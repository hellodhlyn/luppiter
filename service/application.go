package service

import (
	"github.com/hellodhlyn/luppiter/model"
	"github.com/hellodhlyn/luppiter/repository"
)

type ApplicationService interface {
	FindByUUID(uuid string) *model.Application
}

type ApplicationServiceImpl struct {
	repo repository.ApplicationRepository
}

func NewApplicationService(repo repository.ApplicationRepository) (ApplicationService, error) {
	return &ApplicationServiceImpl{repo}, nil
}

func (svc *ApplicationServiceImpl) FindByUUID(uuid string) *model.Application {
	return svc.repo.FindByUUID(uuid)
}
