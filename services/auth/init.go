package auth

import (
	"luppiter/components/auth"
	"luppiter/components/database"
)

func init() {
	database.DB.AutoMigrate(
		&auth.APIKey{},
		&AccessToken{},
		&User{},
	)
}
