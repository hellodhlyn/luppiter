package service

import (
	"crypto/rand"
	"fmt"
	"time"

	"github.com/hellodhlyn/luppiter/model"
	"github.com/hellodhlyn/luppiter/repository"
)

type AccessTokenService interface {
	CreateAccessToken(identity *model.UserIdentity) (*model.AccessToken, error)
}

type AccessTokenServiceImpl struct {
	repo repository.AccessTokenRepository
}

func NewAccessTokenService(repo repository.AccessTokenRepository) (AccessTokenService, error) {
	return &AccessTokenServiceImpl{repo}, nil
}

func (svc *AccessTokenServiceImpl) CreateAccessToken(identity *model.UserIdentity) (*model.AccessToken, error) {
	expireAt := time.Now().Add(7 * 24 * time.Hour)
	token := &model.AccessToken{
		IdentityID: identity.ID,
		Identity:   *identity,
		AccessKey:  secureRandomString(20),
		SecretKey:  secureRandomString(20),
		ExpireAt:   &expireAt,
	}

	svc.repo.Save(token)
	return token, nil
}

func secureRandomString(l int) string {
	bytes := make([]byte, l)
	_, _ = rand.Read(bytes)
	return fmt.Sprintf("%x", bytes)
}
