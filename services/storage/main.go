package storage

import (
	"bytes"
	"context"
	"fmt"
	"io"
	"log"
	"time"

	"github.com/aws/aws-sdk-go/aws"
    "github.com/aws/aws-sdk-go/aws/session"
    "github.com/aws/aws-sdk-go/service/s3"
	"github.com/graphql-go/graphql"
	uuid "github.com/satori/go.uuid"
	"github.com/vimeo/go-magic/magic"

	"luppiter/components/auth"
	"luppiter/components/database"
)

var sess *session.Session

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
	BucketUUID string `gorm:"type:varchar(40);UNIQUE_INDEX:uix_bucket_uuid_name"`
	Name       string `gorm:"type:varchar(255);UNIQUE_INDEX:uix_bucket_uuid_name"`

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
//   mutation { createStorageBucket(name, isPublic) { uuid, name, isPublic } }
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

// StorageBucketsQuery =>
//   query { storageBuckets() { uuid, name, isPublic } }
var StorageBucketsQuery = &graphql.Field{
	Type: graphql.NewList(graphql.NewNonNull(storageBucketType)),
	Description: "[Storage] Get list of buckets,",
	Resolve: func(params graphql.ResolveParams) (interface{}, error) {
		apiKey, ok := auth.CheckPermissionAndGetAPIKey(params.Context, "Storage")
		if !ok {
			return nil, fmt.Errorf("insufficient permission")
		}

		var buckets []StorageBucket
		database.DB.Where(&StorageBucket{UserUUID: apiKey.UserUUID}).Find(&buckets)
		return buckets, nil
	},
}

var StorageItemsQuery = &graphql.Field{
	Type: graphql.NewList(graphql.NewNonNull(storageItemType)),
	Description: "[Storage] Get list of items in the bucket.",
	Args: graphql.FieldConfigArgument{
		"bucketUUID": &graphql.ArgumentConfig{Type: graphql.NewNonNull(graphql.String)},
	},
	Resolve: func(params graphql.ResolveParams) (interface{}, error) {
		apiKey, ok := auth.CheckPermissionAndGetAPIKey(params.Context, "Storage")
		if !ok {
			return nil, fmt.Errorf("insufficient permission")
		}

		bucketUUID, _ := params.Args["bucketUUID"].(string)
		var bucket StorageBucket
		database.DB.Where(&StorageBucket{UUID: bucketUUID}).First(&bucket)
		if bucket.UUID == "" || bucket.UserUUID != apiKey.UserUUID {
			return nil, fmt.Errorf("no such bucket or insufficient permission")
		}

		var items []StorageItem
		database.DB.Where(&StorageItem{BucketUUID: bucketUUID}).Find(&items)
		return items, nil
	},
}

// GetItem returns ( storageItem, contentType, err )
func GetItem(ctx context.Context, bucketName string, fileName string) (io.ReadCloser, *string, error) {
	// Check permission for given bucket.
	// If the bucket is opened to public, don't check api key.
	bucket := &StorageBucket{}
	database.DB.Where(&StorageBucket{Name: bucketName}).First(&bucket)
	if bucket.Name == "" || !bucket.IsPublic {
		apiKey, ok := auth.CheckPermissionAndGetAPIKey(ctx, "Storage")
		if !ok || (bucket.UserUUID != apiKey.UserUUID) {
			return nil, nil, fmt.Errorf("insufficient permission")
		}
	}

	item := &StorageItem{}
	database.DB.Where(&StorageItem{BucketUUID: bucket.UUID, Name: fileName}).First(&item)
	if item.UUID == "" {
		return nil, nil, fmt.Errorf("not found")
	}

	output, err := s3.New(sess).GetObject(&s3.GetObjectInput{
		Bucket: aws.String("luppiter.lynlab.co.kr"),
		Key:    aws.String(bucketName + "/" + fileName),
	})

	return output.Body, output.ContentType, err
}

func UploadItem(ctx context.Context, file []byte, bucketName string, fileName string) error {
	// Check permission for given bucket.
	// If the bucket is opened to public, don't check api key.
	bucket := &StorageBucket{}
	database.DB.Where(&StorageBucket{Name: bucketName}).First(&bucket)
	if bucket.Name == "" || !bucket.IsPublic {
		apiKey, ok := auth.CheckPermissionAndGetAPIKey(ctx, "Storage")
		if !ok || (bucket.UserUUID != apiKey.UserUUID) {
			return fmt.Errorf("insufficient permission")
		}
	}

	// Save item on DB.
	item := StorageItem{
		UUID:       uuid.NewV4().String(),
		BucketUUID: bucket.UUID,
		Name:       fileName,
	}
	errs := database.DB.Save(&item).GetErrors()
	if len(errs) > 0 {
		return errs[0]
	}

	// Write metadata and upload.
	_, err := s3.New(sess).PutObject(&s3.PutObjectInput{
		Bucket:      aws.String("luppiter.lynlab.co.kr"),
		Key:         aws.String(bucketName + "/" + fileName),
		Body:        bytes.NewReader(file),
		ContentType: aws.String(magic.MimeFromBytes(file)),
	})

	return err
}

func init() {
	var err error
	sess, err = session.NewSession(&aws.Config{Region: aws.String("ap-northeast-2")})
	if err != nil {
		log.Fatal(err)
	}
}
