package main

import (
	"context"
	"net/http"
	"strings"

	"github.com/graphql-go/graphql"
	"github.com/graphql-go/handler"

	"luppiter/services/auth"
	"luppiter/services/keyvalue"
	"luppiter/services/storage"
)

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
			},
		}),
		Mutation: graphql.NewObject(graphql.ObjectConfig{
			Name: "RootMutation",
			Fields: graphql.Fields{
				// KeyValue mutations.
				"setKeyValueItem": keyvalue.SetKeyValueItemMutation,

				// Storage mutations.
				"createStorageBucket": storage.CreateStorageBucketMutation,
				"createStorageItem": storage.CreateStorageItemMutation,
			},
		}),
	})

	// Set GraphQL endpoint.
	privateHandler := handler.New(&handler.Config{Schema: &privateSchema})
	publicHandler := handler.New(&handler.Config{Schema: &publicSchema, Playground: true})

	http.Handle("/private/graphql", http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Some CORS configurations.
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Accept, Content-Type, Content-Length, Accept-Encoding, Authorization")

		// Set context values.
		ctx := context.Background()
		authorizationHeader := r.Header.Get("Authorization")
		if len(authorizationHeader) > 0 {
			ok, uuid := auth.ValidateAccessTokenAndGetUserUUID(strings.Split(authorizationHeader, " ")[1])
			if ok {
				ctx = context.WithValue(ctx, "UserUUID", uuid)
			}
		}

		apiKey := r.Header.Get("X-Api-Key")
		if len(apiKey) > 0 {
			key, err := auth.GetByAPIKey(apiKey)
			if err != nil {
				w.WriteHeader(http.StatusUnauthorized)
				return
			}
			ctx = context.WithValue(ctx, "APIKey", key)
		}

		privateHandler.ContextHandler(ctx, w, r)
	}))

	http.Handle("/public/graphql", http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Some CORS configurations.
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Accept, Content-Type, Content-Length, Accept-Encoding, Authorization")

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

	http.ListenAndServe(":8081", nil)
}
