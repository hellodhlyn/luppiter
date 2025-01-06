package v1

import (
	"encoding/json"
	"io"
	"net/http"

	"github.com/hellodhlyn/luppiter/internal/errors"
	"github.com/hellodhlyn/luppiter/internal/services/storage"
	"github.com/julienschmidt/httprouter"
)

var (
	storageService storage.StorageService
)

func init() {
	var err error
	storageService, err = storage.NewStorageService()
	if err != nil {
		panic(err)
	}
}

func StorageListBuckets(w http.ResponseWriter, r *http.Request, _ httprouter.Params) {
	buckets, err := storageService.ListBucket(r.Context())
	if err != nil {
		respondError(w, err)
		return
	}

	respondJSON(w, http.StatusOK, buckets)
}

func StorageCreateBucket(w http.ResponseWriter, r *http.Request, _ httprouter.Params) {
	var resBody map[string]interface{}
	if err := json.NewDecoder(r.Body).Decode(&resBody); err != nil {
		respondError(w, errors.New(err, "malformed request body", http.StatusBadRequest))
		return
	}

	bucketName, ok := resBody["name"].(string)
	if !ok {
		respondError(w, errors.New(nil, "name is required", http.StatusBadRequest))
		return
	}

	bucket, err := storageService.CreateBucket(r.Context(), bucketName)
	if err != nil {
		respondError(w, err)
		return
	}

	respondJSON(w, http.StatusCreated, bucket)
}

func StorageListObjects(w http.ResponseWriter, r *http.Request, params httprouter.Params) {
	bucketName := params.ByName("bucketName")
	objects, err := storageService.ListObjects(r.Context(), bucketName)
	if err != nil {
		respondError(w, err)
		return
	}

	respondJSON(w, http.StatusOK, objects)
}

func StorageGetObject(w http.ResponseWriter, r *http.Request, params httprouter.Params) {
	bucketName := params.ByName("bucketName")
	objectName := params.ByName("objectName")
	object, reader, err := storageService.GetObject(r.Context(), bucketName, objectName)
	if err != nil {
		respondError(w, err)
		return
	}

	for key, value := range object.Headers {
		if value != "" {
			w.Header().Set(key, value)
		}
	}
	w.WriteHeader(http.StatusOK)
	_, _ = io.Copy(w, reader)
}

func StorageCreateObject(w http.ResponseWriter, r *http.Request, params httprouter.Params) {
	bucketName := params.ByName("bucketName")
	objectName := params.ByName("objectName")
	object, err := storageService.CreateObject(r.Context(), &storage.UploadObjectInput{
		BucketName: bucketName,
		ObjectName: objectName,
		Body:       r.Body,
		Headers: map[string]string{
			storage.HeaderContentType:  r.Header.Get(storage.HeaderContentType),
			storage.HeaderCacheControl: r.Header.Get(storage.HeaderCacheControl),
		},
	})

	if err != nil {
		respondError(w, err)
		return
	}

	respondJSON(w, http.StatusCreated, object)
}

func StorageDeleteObject(w http.ResponseWriter, r *http.Request, params httprouter.Params) {
	bucketName := params.ByName("bucketName")
	objectName := params.ByName("objectName")
	if err := storageService.DeleteObject(r.Context(), bucketName, objectName); err != nil {
		respondError(w, err)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}
