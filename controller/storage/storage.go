package storage

import (
	"errors"
	"io"
	"net/http"
	"strings"

	"github.com/aws/aws-sdk-go/aws/awserr"
	"github.com/aws/aws-sdk-go/service/s3"
	"github.com/julienschmidt/httprouter"

	"github.com/hellodhlyn/luppiter/service"
)

type StorageController interface {
	GetFile(http.ResponseWriter, *http.Request, httprouter.Params)
}

type StorageControllerImpl struct {
	storageSvc service.StorageService
}

func NewStorageController(storageSvc service.StorageService) (StorageController, error) {
	return &StorageControllerImpl{storageSvc: storageSvc}, nil
}

var ErrNoSuchItem = errors.New("no such item")

// GET /storage/:bucket/:key(*)
func (ctrl *StorageControllerImpl) GetFile(w http.ResponseWriter, _ *http.Request, p httprouter.Params) {
	file, err := ctrl.storageSvc.ReadFile(p.ByName("bucket"), strings.TrimPrefix(p.ByName("key"), "/"))
	if err != nil {
		if aerr, ok := err.(awserr.Error); ok && aerr.Code() == s3.ErrCodeNoSuchKey {
			http.Error(w, ErrNoSuchItem.Error(), http.StatusNotFound)
		} else {
			http.Error(w, err.Error(), http.StatusInternalServerError)
		}
		return
	} else if file == nil {
		http.Error(w, ErrNoSuchItem.Error(), http.StatusNotFound)
		return
	}

	_, err = io.Copy(w, file)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
	}
}
