package connection

import (
	"fmt"
	"os"

	"github.com/jinzhu/gorm"
	_ "github.com/jinzhu/gorm/dialects/postgres"
)

func getenvOrDefault(key, defaultValue string) string {
	if value, ok := os.LookupEnv(key); ok {
		return value
	}
	return defaultValue
}

func NewDatabaseConnection() (*gorm.DB, error) {
	dbUsername := getenvOrDefault("DB_USERNAME", "postgres")
	dbPassword := getenvOrDefault("DB_PASSWORD", "rootpass")
	dbHost := getenvOrDefault("DB_HOST", "127.0.0.1")
	dbPort := getenvOrDefault("DB_PORT", "5432")
	dbName := getenvOrDefault("DB_NAME", "luppiter")

	return gorm.Open("postgres", fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=%s sslmode=disable", dbHost, dbPort, dbUsername, dbPassword, dbName))
}
