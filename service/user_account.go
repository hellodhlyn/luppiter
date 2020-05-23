package service

import (
	"context"
	"os"

	"github.com/dgrijalva/jwt-go"
	"github.com/google/uuid"
	"github.com/hellodhlyn/luppiter/model"
	"github.com/hellodhlyn/luppiter/repository"
	"google.golang.org/api/idtoken"
)

const (
	providerGoogle = "google"
)

type UserAccountService interface {
	FindOrCreateByGoogleAccount(string) (*model.UserAccount, error)
}

type UserAccountServiceImpl struct {
	accountRepo  repository.UserAccountRepository
	identityRepo repository.UserIdentityRepository
	validator    *idtoken.Validator
	audience     string
}

func NewUserAccountService(accountRepo repository.UserAccountRepository, identityRepo repository.UserIdentityRepository) (UserAccountService, error) {
	googleClientID := os.Getenv("GOOGLE_CLIENT_ID")
	googleCredPath := os.Getenv("GOOGLE_SECRET_ACCOUNT_PATH")

	validator, err := idtoken.NewValidator(context.Background(), idtoken.WithCredentialsFile(googleCredPath))
	if err != nil {
		return nil, err
	}

	return &UserAccountServiceImpl{accountRepo, identityRepo, validator, googleClientID}, nil
}

func (svc *UserAccountServiceImpl) FindOrCreateByGoogleAccount(idToken string) (*model.UserAccount, error) {
	payload, err := svc.validator.Validate(context.Background(), idToken, svc.audience)
	if err != nil {
		return nil, err
	}

	account := svc.accountRepo.FindByProviderId(providerGoogle, payload.Subject)
	if account == nil {
		// payload.Claims returns an empty map by a bug.
		// See: https://github.com/googleapis/google-api-go-client/pull/498
		token, _ := jwt.Parse(idToken, nil)
		claims := token.Claims.(jwt.MapClaims)

		identity := &model.UserIdentity{UUID: uuid.New().String(), Username: claims["name"].(string), Email: claims["email"].(string)}
		svc.identityRepo.Save(identity)

		account = &model.UserAccount{Provider: providerGoogle, ProviderID: payload.Subject, IdentityID: identity.ID, Identity: *identity}
		svc.accountRepo.Save(account)
	}

	return account, nil
}
