package keyvalue

import "luppiter/components/database"

func init() {
	database.DB.AutoMigrate(
		&KeyValueItem{},
	)
}
