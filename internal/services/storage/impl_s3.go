package storage

import (
	"bytes"
	"context"
	goerrors "errors"
	"fmt"
	"io"
	"net/http"
	"os"
	"strings"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	"github.com/aws/aws-sdk-go-v2/service/s3/types"
	"github.com/hellodhlyn/luppiter/internal/auths"
	"github.com/hellodhlyn/luppiter/internal/errors"
)

type S3StorageService struct {
	s3Client     *s3.Client
	s3BucketName string
}

func NewStorageService() (StorageService, error) {
	s3BucketName := os.Getenv("STORAGE_S3_BUCKET_NAME")
	if s3BucketName == "" {
		return nil, errors.New(nil, "STORAGE_S3_BUCKET_NAME is required", http.StatusInternalServerError)
	}

	cfg, err := config.LoadDefaultConfig(context.Background())
	if err != nil {
		return nil, errors.NewInternal(err)
	}

	client := s3.NewFromConfig(cfg)
	return &S3StorageService{
		s3Client:     client,
		s3BucketName: s3BucketName,
	}, nil
}

func (s *S3StorageService) ListBucket(ctx context.Context) ([]*Bucket, error) {
	auth := auths.GetAuthenticated(ctx)
	prefix := auth.UID + "/"

	res, err := s.s3Client.ListObjectsV2(ctx, &s3.ListObjectsV2Input{
		Bucket:    &s.s3BucketName,
		Prefix:    &prefix,
		Delimiter: aws.String("/"),
	})
	if err != nil {
		return nil, errors.NewInternal(err)
	}

	buckets := make([]*Bucket, len(res.CommonPrefixes))
	for idx, commonPrefix := range res.CommonPrefixes {
		buckets[idx] = &Bucket{Name: strings.Replace(strings.Replace(*commonPrefix.Prefix, prefix, "", 1), "/", "", 1)}
	}

	return buckets, nil
}

func (s *S3StorageService) CreateBucket(ctx context.Context, bucketName string) (*Bucket, error) {
	auth := auths.GetAuthenticated(ctx)

	key := auth.UID + "/" + bucketName + "/"
	exists, err := s.s3ObjectExists(ctx, key)
	if err != nil {
		return nil, errors.NewInternal(err)
	}
	if exists {
		return nil, errors.New(nil, "bucket already exists", http.StatusBadRequest)
	}

	_, err = s.s3Client.PutObject(ctx, &s3.PutObjectInput{
		Bucket: &s.s3BucketName,
		Key:    aws.String(key),
	})
	if err != nil {
		return nil, errors.NewInternal(err)
	}

	return &Bucket{Name: bucketName}, nil
}

func (s *S3StorageService) ListObjects(ctx context.Context, bucketName string) ([]*Object, error) {
	auth := auths.GetAuthenticated(ctx)
	prefix := auth.UID + "/" + bucketName + "/"

	res, err := s.s3Client.ListObjectsV2(ctx, &s3.ListObjectsV2Input{
		Bucket: &s.s3BucketName,
		Prefix: &prefix,
	})
	if err != nil {
		return nil, errors.NewInternal(err)
	}

	objects := make([]*Object, len(res.Contents)-1)
	idx := 0
	for _, content := range res.Contents {
		if *content.Key == prefix {
			continue
		}

		headRes, err := s.s3Client.HeadObject(ctx, &s3.HeadObjectInput{
			Bucket: &s.s3BucketName,
			Key:    content.Key,
		})
		if err != nil {
			return nil, errors.NewInternal(err)
		}

		objects[idx] = &Object{
			BucketName: bucketName,
			ObjectName: strings.Replace(*content.Key, prefix, "", -1),
			Metadata:   headRes.Metadata,
			Headers: map[string]string{
				HeaderContentLength: fmt.Sprint(*content.Size),
				HeaderContentType:   aws.ToString(headRes.ContentType),
				HeaderCacheControl:  aws.ToString(headRes.CacheControl),
				HeaderETag:          aws.ToString(headRes.ETag),
			},
		}
		idx += 1
	}

	return objects, nil
}

func (s *S3StorageService) GetObject(ctx context.Context, bucketName, objectName string) (*Object, io.Reader, error) {
	auth := auths.GetAuthenticated(ctx)

	key := auth.UID + "/" + bucketName + "/" + objectName
	exists, err := s.s3ObjectExists(ctx, key)
	if err != nil {
		return nil, nil, errors.NewInternal(err)
	}
	if !exists {
		return nil, nil, errors.New(nil, "object not found", http.StatusNotFound)
	}

	getObjRes, err := s.s3Client.GetObject(ctx, &s3.GetObjectInput{
		Bucket: &s.s3BucketName,
		Key:    aws.String(key),
	})
	if err != nil {
		return nil, nil, errors.NewInternal(err)
	}

	return &Object{
		BucketName: bucketName,
		ObjectName: objectName,
		Metadata:   getObjRes.Metadata,
		Headers: map[string]string{
			HeaderContentLength: fmt.Sprint(*getObjRes.ContentLength),
			HeaderContentType:   aws.ToString(getObjRes.ContentType),
			HeaderCacheControl:  aws.ToString(getObjRes.CacheControl),
			HeaderETag:          aws.ToString(getObjRes.ETag),
		},
	}, getObjRes.Body, nil
}

func (s *S3StorageService) CreateObject(ctx context.Context, input *UploadObjectInput) (*Object, error) {
	auth := auths.GetAuthenticated(ctx)

	key := auth.UID + "/" + input.BucketName + "/" + input.ObjectName
	exists, err := s.s3ObjectExists(ctx, key)
	if err != nil {
		return nil, errors.NewInternal(err)
	}
	if exists {
		return nil, errors.New(nil, "object already exists", http.StatusBadRequest)
	}

	body, _ := io.ReadAll(input.Body)
	_, err = s.s3Client.PutObject(ctx, &s3.PutObjectInput{
		Bucket:       &s.s3BucketName,
		Key:          aws.String(key),
		Body:         bytes.NewBuffer(body),
		CacheControl: aws.String(input.Headers[HeaderCacheControl]),
		ContentType:  aws.String(input.Headers[HeaderContentType]),
	})
	if err != nil {
		return nil, errors.NewInternal(err)
	}

	getObj, _, err := s.GetObject(ctx, input.BucketName, input.ObjectName)
	if err != nil {
		return nil, errors.NewInternal(err)
	}
	return getObj, nil
}

func (s *S3StorageService) DeleteObject(ctx context.Context, bucketName, objectName string) error {
	auth := auths.GetAuthenticated(ctx)

	key := auth.UID + "/" + bucketName + "/" + objectName
	exists, err := s.s3ObjectExists(ctx, key)
	if err != nil {
		return errors.NewInternal(err)
	}
	if !exists {
		return errors.New(nil, "object not found", http.StatusNotFound)
	}

	_, err = s.s3Client.DeleteObject(ctx, &s3.DeleteObjectInput{
		Bucket: &s.s3BucketName,
		Key:    aws.String(key),
	})
	if err != nil {
		return errors.NewInternal(err)
	}

	return nil
}

func (s *S3StorageService) s3ObjectExists(ctx context.Context, key string) (bool, error) {
	_, err := s.s3Client.HeadObject(ctx, &s3.HeadObjectInput{
		Bucket: aws.String(s.s3BucketName),
		Key:    aws.String(key),
	})

	if err != nil {
		var notFound *types.NotFound
		if ok := goerrors.As(err, &notFound); ok {
			return false, nil // File does not exist
		}
		return false, err
	}

	return true, nil
}
