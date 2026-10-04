package main

import (
	"context"
	"errors"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"strconv"
	"syscall"
	"time"

	"github.com/sidpd51/gym-backend/internal/app"
	"github.com/sidpd51/gym-backend/internal/common"
	"github.com/sidpd51/gym-backend/internal/config"
	"github.com/sidpd51/gym-backend/internal/db"
	"github.com/sidpd51/gym-backend/internal/modules/attendance"
	"github.com/sidpd51/gym-backend/internal/modules/notification"
)

func main() {
	cfg, err := config.Load()
	if err != nil {
		slog.New(slog.NewTextHandler(os.Stderr, nil)).
			Error("config load failed", slog.Any("err", err))
		os.Exit(1)
	}

	log := buildLogger(cfg)

	bootCtx, bootCancel := context.WithTimeout(context.Background(), 10*time.Second)
	pool, err := db.NewPool(bootCtx, cfg.DatabaseURL)
	bootCancel()
	if err != nil {
		log.Error("db pool init failed", slog.Any("err", err))
		os.Exit(1)
	}
	defer pool.Close()
	log.Info("db pool ready")

	// Scheduler: register jobs, then catch up on anything missed overnight
	// before the HTTP server starts accepting traffic. See doc 09 §
	// "Daily shutdown contract".
	scheduler := common.NewScheduler(pool, log, attendance.IST)
	if err := notification.RegisterJobs(scheduler, pool, log); err != nil {
		log.Error("register scheduled jobs failed", slog.Any("err", err))
		os.Exit(1)
	}
	catchUpCtx, catchUpCancel := context.WithTimeout(context.Background(), 2*time.Minute)
	if err := scheduler.RunOverdueJobs(catchUpCtx); err != nil {
		log.Error("overdue-job catch-up failed", slog.Any("err", err))
	}
	catchUpCancel()
	scheduler.Start()
	defer scheduler.Stop()

	srv := &http.Server{
		Addr:              ":" + strconv.Itoa(cfg.Port),
		Handler:           app.New(cfg, log, pool),
		ReadHeaderTimeout: 10 * time.Second,
	}

	ctx, stop := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
	defer stop()

	serverErr := make(chan error, 1)
	go func() {
		log.Info("server starting",
			slog.Int("port", cfg.Port),
			slog.String("env", cfg.Env),
		)
		serverErr <- srv.ListenAndServe()
	}()

	select {
	case <-ctx.Done():
		log.Info("shutdown signal received")
	case err := <-serverErr:
		if err != nil && !errors.Is(err, http.ErrServerClosed) {
			log.Error("server failed", slog.Any("err", err))
			os.Exit(1)
		}
	}

	shutdownCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	if err := srv.Shutdown(shutdownCtx); err != nil {
		log.Error("graceful shutdown failed", slog.Any("err", err))
	}
	log.Info("server stopped")
}

func buildLogger(cfg *config.Config) *slog.Logger {
	var level slog.Level
	switch cfg.LogLevel {
	case "debug":
		level = slog.LevelDebug
	case "warn":
		level = slog.LevelWarn
	case "error":
		level = slog.LevelError
	default:
		level = slog.LevelInfo
	}

	opts := &slog.HandlerOptions{Level: level}
	var handler slog.Handler
	if cfg.Env == "dev" {
		handler = slog.NewTextHandler(os.Stdout, opts)
	} else {
		handler = slog.NewJSONHandler(os.Stdout, opts)
	}
	return slog.New(handler)
}
