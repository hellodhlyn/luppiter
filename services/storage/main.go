package storage

import (
	"fmt"
	"time"

	"github.com/graphql-go/graphql"
	uuid "github.com/satori/go.uuid"

	"luppiter/components/auth"
	"luppiter/components/database"
)

type StorageBucket struct {
	UUID     string `gorm:"type:varchar(40);PRIMARY_KEY"`
	Name     string `gorm:"type:varchar(255);UNIQUE_INDEX"`
	UserUUID string `gorm:"type:varchar(40);INDEX"`

	IsPublic bool `gorm:"default:false"`

	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

type StorageItem struct {
	UUID       string `gorm:"type:varchar(40);PRIMARY_KEY"`
	BucketUUID string `gorm:"type:varchar(40);INDEX"`
	Name       string `gorm:"type:varchar(255)"`

	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

func (StorageBucket) TableName() string {
	return "storage_buckets"
}

func (StorageItem) TableName() string {
	return "storage_items"
}

var storageBucketType = graphql.NewObject(graphql.ObjectConfig{
	Name: "StorageBucket",
	Fields: graphql.Fields{
		"uuid":     &graphql.Field{Type: graphql.NewNonNull(graphql.String)},
		"name":     &graphql.Field{Type: graphql.NewNonNull(graphql.String)},
		"isPublic": &graphql.Field{Type: graphql.NewNonNull(graphql.Boolean)},
	},
})

var storageItemType = graphql.NewObject(graphql.ObjectConfig{
	Name: "StorageItem",
	Fields: graphql.Fields{
		"uuid":       &graphql.Field{Type: graphql.NewNonNull(graphql.String)},
		"name":       &graphql.Field{Type: graphql.NewNonNull(graphql.String)},
		"bucketUUID": &graphql.Field{Type: graphql.NewNonNull(graphql.String)},
	},
})

// CreateStorageBucketMutation =>
//   mutation { createStorageBucket(name, isPublic) { uuid, name } }
var CreateStorageBucketMutation = &graphql.Field{
	Type:        storageBucketType,
	Description: "[Storage] Create a new bucket.",
	Args: graphql.FieldConfigArgument{
		"name":     &graphql.ArgumentConfig{Type: graphql.NewNonNull(graphql.String)},
		"isPublic": &graphql.ArgumentConfig{Type: graphql.Boolean},
	},
	Resolve: func(params graphql.ResolveParams) (interface{}, error) {
		apiKey, ok := auth.CheckPermissionAndGetAPIKey(params.Context, "Storage")
		if !ok {
			return nil, fmt.Errorf("insufficient permission")
		}

		// Fetch requested arguments.
		name := params.Args["name"].(string)
		var isPublic bool
		if params.Args["isPublic"] == nil {
			isPublic = false
		} else {
			isPublic = params.Args["isPublic"].(bool)
		}

		// Create new bucket.
		bucket := &StorageBucket{
			UUID:     uuid.NewV4().String(),
			Name:     name,
			UserUUID: apiKey.UserUUID,
			IsPublic: isPublic,
		}
		errs := database.DB.Create(&bucket).GetErrors()
		if len(errs) > 0 {
			return nil, errs[0]
		}
		return bucket, nil
	},
}

// CreateStorageItem =>
//   mutation { createStorageItem(bucketUUID, name) { bucketUUID, name, uuid } }
var CreateStorageItemMutation = &graphql.Field{
	Type:        storageItemType,
	Description: "[Storage] Create a new bucket.",
	Args: graphql.FieldConfigArgument{
		"bucketUUID": &graphql.ArgumentConfig{Type: graphql.NewNonNull(graphql.String)},
		"name":       &graphql.ArgumentConfig{Type: graphql.NewNonNull(graphql.String)},
	},
	Resolve: func(params graphql.ResolveParams) (interface{}, error) {
		bucketUUID := params.Args["bucketUUID"].(string)

		bucket := &StorageBucket{}
		database.DB.Where(&StorageBucket{UUID: bucketUUID}).First(&bucket)

		// Check permission for given bucket.
		// If the bucket is opened to public, don't check api key.
		if bucket.Name == "" || !bucket.IsPublic {
			_, ok := auth.CheckPermissionAndGetAPIKey(params.Context, "Storage")
			if !ok {
				return nil, fmt.Errorf("insufficient permission")
			}
		}

		// Create new item.
		item := &StorageItem{
			UUID:       uuid.NewV4().String(),
			BucketUUID: bucketUUID,
			Name:       params.Args["name"].(string),
		}

		errs := database.DB.Create(&item).GetErrors()
		if len(errs) > 0 {
			return nil, errs[0]
		}
		return item, nil
	},
}
