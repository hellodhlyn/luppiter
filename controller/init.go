package controller

import (
	"encoding/json"
	"net/http"
)

func JsonResponse(w http.ResponseWriter, res interface{}) {
	w.Header().Set("Content-Type", "application/json; encode=utf-8")
	_ = json.NewEncoder(w).Encode(res)
}
