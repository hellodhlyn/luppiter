package service

import (
	"fmt"
	"io"

	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/service/s3"

	"github.com/hellodhlyn/luppiter/repository"
)

type StorageService interface {
	ReadFile(bucketName, fileKey string) (io.ReadCloser, error)
}

type StorageServiceImpl struct {
	bucketRepo   repository.StorageBucketRepository
	s3           *s3.S3
	s3BucketName string
}

func NewStorageService(bucketRepo repository.StorageBucketRepository, s3 *s3.S3) (StorageService, error) {
	return &StorageServiceImpl{
		bucketRepo:   bucketRepo,
		s3:           s3,
		s3BucketName: "luppiter.lynlab.co.kr",
	}, nil
}

func (svc *StorageServiceImpl) ReadFile(bucketName, fileKey string) (io.ReadCloser, error) {
	if svc.bucketRepo.FindByName(bucketName) == nil {
		return nil, nil
	}

	output, err := svc.s3.GetObject(&s3.GetObjectInput{
		Bucket: aws.String(svc.s3BucketName),
		Key:    aws.String(fmt.Sprintf("%s/%s", bucketName, fileKey)),
	})

	if err != nil {
		return nil, err
	}
	return output.Body, nil
}
