package repository

import (
	"github.com/hellodhlyn/luppiter/model"
	"github.com/jinzhu/gorm"
)

type AccessTokenRepository interface {
	Save(*model.AccessToken)
}

type AccessTokenRepositoryImpl struct {
	db *gorm.DB
}

func NewAccessTokenRepository(db *gorm.DB) (AccessTokenRepository, error) {
	return &AccessTokenRepositoryImpl{db}, nil
}

func (repo *AccessTokenRepositoryImpl) Save(token *model.AccessToken) {
	repo.db.Save(token)
}
