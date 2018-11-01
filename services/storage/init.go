package storage

import "luppiter/components/database"

func init() {
	database.DB.AutoMigrate(
		&StorageBucket{},
		&StorageItem{},
	)
}
