package backup

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"os"
	"os/exec"
	"path/filepath"
	"sort"
	"strings"
	"syscall"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"

	"github.com/sidpd51/gym-backend/internal/common"
	"github.com/sidpd51/gym-backend/internal/common/render"
	appmw "github.com/sidpd51/gym-backend/internal/middleware"
)

// Service wraps pg_dump / psql via exec. BackupDir is created on first use.
// DatabaseURL carries all connection info (host, port, user, password, dbname).
type Service struct {
	BackupDir   string
	DatabaseURL string
}

func NewService(backupDir, databaseURL string) *Service {
	return &Service{BackupDir: backupDir, DatabaseURL: databaseURL}
}

type BackupFile struct {
	Name      string    `json:"name"`
	SizeBytes int64     `json:"sizeBytes"`
	CreatedAt time.Time `json:"createdAt"`
}

// Create runs pg_dump and writes gymdb_YYYYMMDD_HHMMSS.sql into BackupDir.
// Idempotent for the daily scheduler job: a same-day file name causes a
// no-op (the caller sees the existing file name).
func (s *Service) Create(ctx context.Context, idempotentDaily bool) (BackupFile, error) {
	if err := os.MkdirAll(s.BackupDir, 0o750); err != nil {
		return BackupFile{}, fmt.Errorf("mkdir backup dir: %w", err)
	}

	ts := time.Now()
	var name string
	if idempotentDaily {
		// For the daily cron job, drop the time portion so re-runs within
		// the same date are no-ops.
		name = fmt.Sprintf("gymdb_%s.sql", ts.Format("20060102"))
	} else {
		name = fmt.Sprintf("gymdb_%s.sql", ts.Format("20060102_150405"))
	}
	path := filepath.Join(s.BackupDir, name)

	if idempotentDaily {
		if info, err := os.Stat(path); err == nil {
			return BackupFile{
				Name: name, SizeBytes: info.Size(), CreatedAt: info.ModTime(),
			}, nil
		}
	}

	connStr, err := pgConnString(s.DatabaseURL)
	if err != nil {
		return BackupFile{}, err
	}

	// Resolve pg_dump path. Not in PATH on some Windows installs; prefer
	// pg_dump next to postgres if PGBIN env is set.
	bin := envOr("PGDUMP_BIN", "pg_dump")
	cmd := exec.CommandContext(ctx, bin,
		"--no-owner", "--no-privileges", "--format=plain",
		"--file", path, connStr,
	)
	cmd.Env = append(os.Environ(), passwordEnv(s.DatabaseURL)...)
	if out, err := cmd.CombinedOutput(); err != nil {
		_ = os.Remove(path)
		return BackupFile{}, fmt.Errorf("pg_dump failed: %v: %s", err, string(out))
	}

	info, err := os.Stat(path)
	if err != nil {
		return BackupFile{}, err
	}
	return BackupFile{Name: name, SizeBytes: info.Size(), CreatedAt: info.ModTime()}, nil
}

func (s *Service) List(_ context.Context) ([]BackupFile, error) {
	entries, err := os.ReadDir(s.BackupDir)
	if err != nil {
		if errors.Is(err, os.ErrNotExist) {
			return []BackupFile{}, nil
		}
		return nil, err
	}
	out := make([]BackupFile, 0, len(entries))
	for _, e := range entries {
		if e.IsDir() || !strings.HasSuffix(e.Name(), ".sql") {
			continue
		}
		info, err := e.Info()
		if err != nil {
			continue
		}
		out = append(out, BackupFile{Name: e.Name(), SizeBytes: info.Size(), CreatedAt: info.ModTime()})
	}
	sort.Slice(out, func(i, j int) bool { return out[i].CreatedAt.After(out[j].CreatedAt) })
	return out, nil
}

// Restore runs `psql -f <uploaded.sql>` against the configured database.
// On success, callers typically trigger process shutdown (via systemd/NSSM
// restart) to drop any stale connections. The caller handles that signal.
func (s *Service) Restore(ctx context.Context, sqlReader io.Reader) error {
	connStr, err := pgConnString(s.DatabaseURL)
	if err != nil {
		return err
	}
	bin := envOr("PSQL_BIN", "psql")
	cmd := exec.CommandContext(ctx, bin,
		"--set", "ON_ERROR_STOP=on", connStr,
	)
	cmd.Stdin = sqlReader
	cmd.Env = append(os.Environ(), passwordEnv(s.DatabaseURL)...)
	if out, err := cmd.CombinedOutput(); err != nil {
		return fmt.Errorf("psql restore failed: %v: %s", err, string(out))
	}
	return nil
}

// pgConnString strips the password from a URL for safe pg_dump/psql invocation.
// Password goes to PGPASSWORD env (via passwordEnv) instead so it doesn't appear
// in process listings.
func pgConnString(databaseURL string) (string, error) {
	u, err := url.Parse(databaseURL)
	if err != nil {
		return "", fmt.Errorf("parse DATABASE_URL: %w", err)
	}
	if u.User != nil {
		u.User = url.User(u.User.Username())
	}
	return u.String(), nil
}

func passwordEnv(databaseURL string) []string {
	u, err := url.Parse(databaseURL)
	if err != nil || u.User == nil {
		return nil
	}
	pw, _ := u.User.Password()
	if pw == "" {
		return nil
	}
	return []string{"PGPASSWORD=" + pw}
}

func envOr(key, def string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return def
}

// --- Handler ---

type Handler struct{ svc *Service }

func NewHandler(svc *Service) *Handler { return &Handler{svc: svc} }

func (h *Handler) Mount(r chi.Router) {
	// OWNER-only via settings:edit permission (which only OWNER has).
	r.With(appmw.RequirePermission(common.PermSettingsEdit)).Post("/backup/create", h.create)
	r.With(appmw.RequirePermission(common.PermSettingsEdit)).Get("/backup/list", h.list)
	r.With(appmw.RequirePermission(common.PermSettingsEdit)).Post("/backup/restore", h.restore)
}

type createResp struct {
	BackupFile
	Actor uuid.UUID `json:"triggeredBy"`
}

func (h *Handler) create(w http.ResponseWriter, r *http.Request) {
	bf, err := h.svc.Create(r.Context(), false)
	if err != nil {
		render.Error(w, r, common.NewInternalError("BACKUP_FAILED").WithCause(err))
		return
	}
	render.JSON(w, http.StatusCreated, createResp{BackupFile: bf, Actor: appmw.ActorID(r.Context())})
}

func (h *Handler) list(w http.ResponseWriter, r *http.Request) {
	out, err := h.svc.List(r.Context())
	if err != nil {
		render.Error(w, r, err)
		return
	}
	render.JSON(w, http.StatusOK, out)
}

func (h *Handler) restore(w http.ResponseWriter, r *http.Request) {
	// Accept the dump as the raw request body (multipart was overkill for
	// a single-file upload on LAN).
	if r.ContentLength == 0 {
		render.Error(w, r, common.NewBadRequestError("EMPTY_BODY", "Upload a .sql dump as the request body."))
		return
	}
	defer func() { _ = r.Body.Close() }()
	if err := h.svc.Restore(r.Context(), r.Body); err != nil {
		render.Error(w, r, common.NewInternalError("RESTORE_FAILED").WithCause(err))
		return
	}
	// Trigger a graceful shutdown so the service manager restarts us with
	// a fresh connection pool. We send ourselves SIGTERM; main.go handles it.
	go func() {
		time.Sleep(100 * time.Millisecond)
		_ = sendTerm()
	}()
	w.WriteHeader(http.StatusAccepted)
	_, _ = w.Write([]byte(`{"status":"restored","restarting":true}`))
}

// sendTerm raises SIGTERM to the current process. The server's
// signal.NotifyContext in main.go turns this into a graceful shutdown.
func sendTerm() error {
	p, err := os.FindProcess(os.Getpid())
	if err != nil {
		return err
	}
	return p.Signal(syscall.SIGTERM)
}

// Ensure encoding/json stays referenced in case of future response changes.
var _ = json.Marshal
