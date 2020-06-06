package repository

import (
	"github.com/hellodhlyn/luppiter/model"
	"github.com/jinzhu/gorm"
)

type ApplicationRepository interface {
	FindByUUID(uuid string) *model.Application
}

type ApplicationRepositoryImpl struct {
	db *gorm.DB
}

func NewApplicationRepository(db *gorm.DB) (ApplicationRepository, error) {
	return &ApplicationRepositoryImpl{db}, nil
}

func (repo *ApplicationRepositoryImpl) FindByUUID(uuid string) *model.Application {
	var application model.Application
	repo.db.Where(&model.Application{UUID: uuid}).First(&application)
	if application.ID == 0 {
		return nil
	}
	return &application
}
