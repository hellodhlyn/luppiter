package main

import (
	"net/http"
	"os"

	v1 "github.com/hellodhlyn/luppiter/cmd/http/v1"
	"github.com/hellodhlyn/luppiter/internal/auths"
	"github.com/julienschmidt/httprouter"
	"github.com/rs/cors"
	log "github.com/sirupsen/logrus"
)

func init() {
	log.SetFormatter(&log.JSONFormatter{})
	log.SetOutput(os.Stdout)
	log.SetLevel(log.DebugLevel)
}

func main() {
	router := httprouter.New()

	// v1 API
	router.GET("/v1/storage/buckets", v1.StorageListBuckets)
	router.POST("/v1/storage/buckets", v1.StorageCreateBucket)
	router.GET("/v1/storage/buckets/:bucketName", v1.StorageListObjects)
	router.GET("/v1/storage/buckets/:bucketName/:objectName", v1.StorageGetObject)
	router.POST("/v1/storage/buckets/:bucketName/:objectName", v1.StorageCreateObject)
	router.DELETE("/v1/storage/buckets/:bucketName/:objectName", v1.StorageDeleteObject)

	authRouter := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		authCtx := auths.WithAuthenticated(r.Context(), &auths.AuthenticatedContext{
			UID: os.Getenv("TMP_CURRENT_USER_UID"),
		})
		router.ServeHTTP(w, r.WithContext(authCtx))
	})

	corsRouter := cors.New(cors.Options{
		AllowedOrigins:   []string{"*"},
		AllowedHeaders:   []string{"*"},
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "PATCH"},
		AllowCredentials: true,
	}).Handler(authRouter)

	log.Info("Server started and listening on :8080")
	log.Fatal(http.ListenAndServe(":8080", corsRouter))
}
