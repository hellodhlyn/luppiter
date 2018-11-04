package main

import (
	"bytes"
	"context"
	"io"
	"net/http"
	"strings"

	"github.com/graphql-go/graphql"
	"github.com/graphql-go/handler"

	"luppiter/services/auth"
	"luppiter/services/keyvalue"
	"luppiter/services/storage"
)

func allowCORS(w http.ResponseWriter, methods string) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", methods)
	w.Header().Set("Access-Control-Allow-Headers", "Accept, Content-Type, Content-Length, Accept-Encoding, Authorization, X-Api-Key")
}

func main() {
	privateSchema, _ := graphql.NewSchema(graphql.SchemaConfig{
		Query: graphql.NewObject(graphql.ObjectConfig{
			Name: "RootQuery",
			Fields: graphql.Fields{
				"me":         auth.MeQuery,
				"apiKeyList": auth.APIKeysQuery,
			},
		}),
		Mutation: graphql.NewObject(graphql.ObjectConfig{
			Name: "RootMutation",
			Fields: graphql.Fields{
				"activateUser":               auth.ActivateUserMutation,
				"createUser":                 auth.CreateUserMutation,
				"createAccessToken":          auth.CreateAccessTokenMutation,
				"createAPIKey":               auth.CreateAPIKeyMutation,
				"addPermissionToAPIKey":      auth.AddPermissionMutation,
				"removePermissionFromAPIKey": auth.RemovePermissionMutation,
			},
		}),
	})

	publicSchema, _ := graphql.NewSchema(graphql.SchemaConfig{
		Query: graphql.NewObject(graphql.ObjectConfig{
			Name: "RootQuery",
			Fields: graphql.Fields{
				// Keyvalue queries,
				"keyValueItem": keyvalue.KeyValueItemQuery,

				// Storage queries.
				"storageBuckets": storage.StorageBucketsQuery,
				"storageItems":   storage.StorageItemsQuery,
			},
		}),
		Mutation: graphql.NewObject(graphql.ObjectConfig{
			Name: "RootMutation",
			Fields: graphql.Fields{
				// KeyValue mutations.
				"setKeyValueItem": keyvalue.SetKeyValueItemMutation,

				// Storage mutations.
				"createStorageBucket": storage.CreateStorageBucketMutation,
				"createStorageItem":   storage.CreateStorageItemMutation,
			},
		}),
	})

	// GET, POST /private/graphql
	// APIs for web console. (Shouldn't use by users.)
	privateHandler := handler.New(&handler.Config{Schema: &privateSchema})
	http.Handle("/private/graphql", http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		allowCORS(w, "GET, POST, OPTIONS")

		// Set context values.
		ctx := context.Background()
		authorizationHeader := r.Header.Get("Authorization")
		if len(authorizationHeader) > 0 {
			ok, uuid := auth.ValidateAccessTokenAndGetUserUUID(strings.Split(authorizationHeader, " ")[1])
			if ok {
				ctx = context.WithValue(ctx, "UserUUID", uuid)
			}
		}

		privateHandler.ContextHandler(ctx, w, r)
	}))

	// GET, POST /apis/graphql
	// Public GraphQL APIs endpoint.
	publicHandler := handler.New(&handler.Config{Schema: &publicSchema, Playground: true})
	http.Handle("/apis/graphql", http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		allowCORS(w, "GET, POST, OPTIONS")

		// Set context values.
		ctx := context.Background()
		apiKey := r.Header.Get("X-Api-Key")
		if len(apiKey) > 0 {
			key, err := auth.GetByAPIKey(apiKey)
			if err != nil {
				w.WriteHeader(http.StatusUnauthorized)
				return
			}
			ctx = context.WithValue(ctx, "APIKey", key)
		}

		publicHandler.ContextHandler(ctx, w, r)
	}))

	// GET, POST, DELETE /files/{bucketName}/{fileName}
	http.HandleFunc("/files/", func(w http.ResponseWriter, r *http.Request) {
		allowCORS(w, "GET, POST, OPTIONS")

		// Parse bucketName and fileName.
		paths := strings.Split(r.URL.Path, "/")
		if len(paths) != 4 {
			w.WriteHeader(http.StatusNotFound)
			return
		}
		bucketName := paths[2]
		fileName := paths[3]

		// Set context values.
		ctx := context.Background()
		apiKey := r.Header.Get("X-Api-Key")
		if len(apiKey) > 0 {
			key, err := auth.GetByAPIKey(apiKey)
			if err != nil {
				w.WriteHeader(http.StatusUnauthorized)
				return
			}
			ctx = context.WithValue(ctx, "APIKey", key)
		}

		if r.Method == "GET" {
			reader, contentType, err := storage.GetItem(ctx, bucketName, fileName)
			if err != nil {
				w.WriteHeader(http.StatusBadRequest)
				return
			}

			if contentType != nil {
				w.Header().Set("Content-Type", *contentType)
			}

			io.Copy(w, reader)
		} else if r.Method == "POST" {
			// Limit file size to 10MB.
			r.Body = http.MaxBytesReader(w, r.Body, 10 * 1024 * 1024)

			// Get byte from the HTTP request.
			var buffer bytes.Buffer
			upload, _, err := r.FormFile("item")
			if err != nil {
				w.WriteHeader(http.StatusBadRequest)
				return
			}

			// Upload file
			io.Copy(&buffer, upload)
			file := buffer.Bytes()
			err = storage.UploadItem(ctx, file, bucketName, fileName)
			if err != nil {
				w.WriteHeader(http.StatusBadRequest)
				return
			}
			w.WriteHeader(http.StatusCreated)

			defer upload.Close()
		} else if r.Method == "DELETE" {
			
		} else {
			w.WriteHeader(http.StatusMethodNotAllowed)
		}
	})

	http.ListenAndServe(":8081", nil)
}
