package auth

import "luppiter/components/database"

func init() {
	database.DB.AutoMigrate(
		&AccessToken{},
		&User{},
	)
}
