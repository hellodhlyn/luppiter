package main

import (
	"context"
	"net/http"
	"strings"

	"github.com/graphql-go/graphql"
	"github.com/graphql-go/handler"

	"luppiter/services/auth"
	"luppiter/services/keyvalue"
)

func main() {
	schema, _ := graphql.NewSchema(graphql.SchemaConfig{
		Query: graphql.NewObject(graphql.ObjectConfig{
			Name: "RootQuery",
			Fields: graphql.Fields{
				// Auth queries.
				"me":         auth.MeQuery,
				"apiKeyList": auth.APIKeysQuery,

				// Keyvalue queries,
				"keyValueItem": keyvalue.KeyValueItemQuery,
			},
		}),
		Mutation: graphql.NewObject(graphql.ObjectConfig{
			Name: "RootMutation",
			Fields: graphql.Fields{
				// Auth mutations.
				"activateUser":	              auth.ActivateUserMutation,
				"createUser":                 auth.CreateUserMutation,
				"createAccessToken":          auth.CreateAccessTokenMutation,
				"createAPIKey":               auth.CreateAPIKeyMutation,
				"addPermissionToAPIKey":      auth.AddPermissionMutation,
				"removePermissionFromAPIKey": auth.RemovePermissionMutation,

				// KeyValue mutations.
				"setKeyValueItem": keyvalue.SetKeyValueItemMutation,
			},
		}),
	})

	// Set GraphQL endpoint.
	h := handler.New(&handler.Config{ 
		Schema: &schema,
		Playground: true,
	})

	http.Handle("/graphql", http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
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

		h.ContextHandler(ctx, w, r)
	}))

	http.ListenAndServe(":8081", nil)
}
