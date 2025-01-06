package v1

import (
	"encoding/json"
	"net/http"

	"github.com/hellodhlyn/luppiter/internal/errors"
	gonanoid "github.com/matoous/go-nanoid/v2"
	log "github.com/sirupsen/logrus"
)

func respondError(w http.ResponseWriter, origin error) {
	traceId := gonanoid.Must(16)
	luppiterErr, ok := origin.(*errors.LuppiterError)
	if !ok {
		luppiterErr = errors.NewInternal(origin)
	}

	log.WithFields(log.Fields{
		"traceId": traceId,
		"origin":  luppiterErr.Origin,
	}).Error(luppiterErr.Message)

	errBody := map[string]interface{}{
		"error":   luppiterErr.Message,
		"traceId": traceId,
	}
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(luppiterErr.HTTPStatus)
	_ = json.NewEncoder(w).Encode(errBody)
}

func respondJSON(w http.ResponseWriter, status int, body interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(body)
}
