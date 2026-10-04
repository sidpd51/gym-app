package config

import (
	"time"

	"github.com/caarlos0/env/v11"
)

type Config struct {
	Env            string        `env:"ENV"             envDefault:"prod"`
	Port           int           `env:"PORT"            envDefault:"8080"`
	DatabaseURL    string        `env:"DATABASE_URL,required"`
	JWTSecret      string        `env:"JWT_SECRET,required"`
	CookieSecret   string        `env:"COOKIE_SECRET,required"`
	FrontendOrigin string        `env:"FRONTEND_ORIGIN" envDefault:"http://localhost:5173"`
	SessionTTL     time.Duration `env:"SESSION_TTL"     envDefault:"8h"`
	BackupDir      string        `env:"BACKUP_DIR"      envDefault:"/opt/gym-backups"`
	LogLevel       string        `env:"LOG_LEVEL"       envDefault:"info"`
	HTTPSCert      string        `env:"HTTPS_CERT"`
	HTTPSKey       string        `env:"HTTPS_KEY"`
}

func Load() (*Config, error) {
	var c Config
	if err := env.Parse(&c); err != nil {
		return nil, err
	}
	return &c, nil
}
