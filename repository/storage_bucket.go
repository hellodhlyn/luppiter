package repository

import (
	"github.com/jinzhu/gorm"

	"github.com/hellodhlyn/luppiter/model"
)

type StorageBucketRepository interface {
	FindByName(name string) *model.StorageBucket
}

type StorageBucketRepositoryImpl struct {
	db *gorm.DB
}

func NewStorageBucketRepository(db *gorm.DB) (StorageBucketRepository, error) {
	return &StorageBucketRepositoryImpl{db: db}, nil
}

func (repo StorageBucketRepositoryImpl) FindByName(name string) *model.StorageBucket {
	var bucket model.StorageBucket
	repo.db.Where(&model.StorageBucket{Name: name}).First(&bucket)
	if bucket.ID == 0 {
		return nil
	}
	return &bucket
}
