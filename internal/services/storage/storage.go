package storage

import (
	"context"
	"io"
)

const (
	HeaderContentType   = "Content-Type"
	HeaderETag          = "ETag"
	HeaderContentLength = "Content-Length"
	HeaderCacheControl  = "Cache-Control"
)

type StorageService interface {
	ListBucket(ctx context.Context) ([]*Bucket, error)
	CreateBucket(ctx context.Context, bucketName string) (*Bucket, error)

	ListObjects(ctx context.Context, bucketName string) ([]*Object, error)
	GetObject(ctx context.Context, bucketName, objectName string) (*Object, io.Reader, error)
	CreateObject(ctx context.Context, input *UploadObjectInput) (*Object, error)
	DeleteObject(ctx context.Context, bucketName, objectName string) error
}
