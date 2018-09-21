package main

import (
	"context"
	"net/http"
	"strings"

	"github.com/graphql-go/graphql"
	"github.com/graphql-go/handler"

	"luppiter/services/auth"
)

func main() {
	schema, _ := graphql.NewSchema(graphql.SchemaConfig{
		Query: graphql.NewObject(graphql.ObjectConfig{
			Name: "RootQuery",
			Fields: graphql.Fields{
				// Auth queries.
				"me": auth.MeQuery,
			},
		}),
		Mutation: graphql.NewObject(graphql.ObjectConfig{
			Name: "RootMutation",
			Fields: graphql.Fields{
				// Auth mutations.
				"createUser":        auth.CreateUserMutation,
				"createAccessToken": auth.CreateAccessTokenMutation,
			},
		}),
	})

	// Set GraphQL endpoint.
	h := handler.New(&handler.Config{
		Schema: &schema,
		Pretty: true,
	})

	http.Handle("/graphql", http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Some CROS configurations.
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "POST, GET, OPTIONS, PUT, DELETE")
		w.Header().Set("Access-Control-Allow-Headers", "Accept, Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization")

		// Set context values.
		ctx := context.Background()
		ctx = context.WithValue(ctx, "permissions", map[string]string{}) // FIXME - dummy value has given.
		authorization := r.Header.Get("Authorization")
		if len(authorization) > 0 {
			token := auth.ValidateAccessToken(strings.Split(authorization, " ")[1])
			if token != nil {
				ctx = context.WithValue(ctx, "UserUUID", token.UserUUID)
			}
		}

		h.ContextHandler(ctx, w, r)
	}))

	// Set HTTP API endpoints.
	http.HandleFunc("/api/activate_user", func(w http.ResponseWriter, r *http.Request) {
		activationToken := r.URL.Query().Get("activation_token")
		redirectionURL := r.URL.Query().Get("redirection_url")

		err := auth.Activate(activationToken)
		if err != nil {
			w.Write([]byte("유효하지 않은 토큰입니다."))
		} else {
			w.Header().Set("Location", redirectionURL)
			w.WriteHeader(http.StatusTemporaryRedirect)
		}
	})

	http.ListenAndServe(":8081", nil)
}
