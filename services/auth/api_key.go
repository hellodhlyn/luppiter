package auth

import (
	"encoding/json"
	"fmt"
	"time"

	"github.com/graphql-go/graphql"
	"github.com/jinzhu/gorm/dialects/postgres"

	"luppiter/components/auth"
	"luppiter/components/database"
	"luppiter/components/random"
)

type APIKeyType struct {
	APIKey      string   `json:"key"`
	Comment     string   `json:"comment"`
	Permissions []string `json:"permissions"`
	CreatedAt   time.Time `json:"created_at"`
}

func toGraphQLType(key auth.APIKey) APIKeyType {
	return APIKeyType{
		APIKey:      key.APIKey,
		Comment:     key.Comment,
		Permissions: key.GetPermissions(),
		CreatedAt:   key.CreatedAt,
	}
}

var apiKeyType = graphql.NewObject(graphql.ObjectConfig{
	Name: "APIKey",
	Fields: graphql.Fields{
		"key":         &graphql.Field{Type: graphql.NewNonNull(graphql.String)},
		"comment":     &graphql.Field{Type: graphql.String},
		"permissions": &graphql.Field{Type: graphql.NewNonNull(graphql.NewList(graphql.String))},
		"created_at":  &graphql.Field{Type: graphql.NewNonNull(graphql.DateTime)},
	},
})

// APIKeysQuery =>
//   query { apiKeyList() { key, permissions } }
var APIKeysQuery = &graphql.Field{
	Type:        graphql.NewList(apiKeyType),
	Description: "[Auth] Get api keys.",
	Resolve: func(params graphql.ResolveParams) (interface{}, error) {
		uuidCtx := params.Context.Value("UserUUID")
		if uuidCtx == nil {
			return nil, fmt.Errorf("invalid or expired access token")
		}

		var keys []auth.APIKey
		database.DB.Where(&auth.APIKey{UserUUID: uuidCtx.(string)}).Find(&keys)

		var keyTypes []APIKeyType
		for _, key := range keys {
			keyTypes = append(keyTypes, toGraphQLType(key))
		}
		return keyTypes, nil
	},
}

// CreateAPIKeyMutation =>
//   mutation { createAPIKey(comment:"") { key, permissions } }
var CreateAPIKeyMutation = &graphql.Field{
	Type:        apiKeyType,
	Description: "[Auth] Create new api key.",
	Args: graphql.FieldConfigArgument{
		"comment": &graphql.ArgumentConfig{Type: graphql.String},
	},
	Resolve: func(params graphql.ResolveParams) (interface{}, error) {
		uuidCtx := params.Context.Value("UserUUID")
		if uuidCtx == nil {
			return nil, fmt.Errorf("invalid or expired access token")
		}

		comment, _ := params.Args["comment"].(string)
		key := auth.APIKey{
			APIKey:      random.GenerateRandomString(40),
			UserUUID:    uuidCtx.(string),
			Comment:     comment,
			Permissions: postgres.Jsonb{json.RawMessage(`[]`)},
		}

		errs := database.DB.Save(&key).GetErrors()
		if len(errs) > 0 {
			return nil, errs[0]
		}
		return toGraphQLType(key), nil
	},
}

// AddPermissionMutation =>
//   mutation { addPermissionToAPIKey(key:"", permission:"") { key, permissions } }
var AddPermissionMutation = &graphql.Field{
	Type:        apiKeyType,
	Description: "[Auth] Add a permission to given api key.",
	Args: graphql.FieldConfigArgument{
		"key":        &graphql.ArgumentConfig{Type: graphql.NewNonNull(graphql.String)},
		"permission": &graphql.ArgumentConfig{Type: graphql.NewNonNull(graphql.String)},
	},
	Resolve: func(params graphql.ResolveParams) (interface{}, error) {
		uuidCtx := params.Context.Value("UserUUID")
		if uuidCtx == nil {
			return nil, fmt.Errorf("invalid or expired access token")
		}

		key, _ := params.Args["key"].(string)
		permission, _ := params.Args["permission"].(string)
		apiKey, err := GetByAPIKey(key)
		if err != nil || uuidCtx.(string) != apiKey.UserUUID {
			return nil, fmt.Errorf("invalid api key")
		}

		// If permission already exists, do nothing.
		for _, v := range apiKey.GetPermissions() {
			if v == permission {
				return toGraphQLType(*apiKey), nil
			}
		}

		// Add permission.
		permissions, _ := json.Marshal(append(apiKey.GetPermissions(), permission))
		errs := database.DB.Model(&apiKey).Update(auth.APIKey{Permissions: postgres.Jsonb{permissions}}).GetErrors()
		if len(errs) > 0 {
			return nil, errs[0]
		}

		return toGraphQLType(*apiKey), nil
	},
}

// RemovePermissionMutation =>
//   mutation { removePermissionFromAPIKey(key:"", permission:"") { key, permissions } }
var RemovePermissionMutation = &graphql.Field{
	Type:        apiKeyType,
	Description: "[Auth] Remove a permission to given api key.",
	Args: graphql.FieldConfigArgument{
		"key":        &graphql.ArgumentConfig{Type: graphql.NewNonNull(graphql.String)},
		"permission": &graphql.ArgumentConfig{Type: graphql.NewNonNull(graphql.String)},
	},
	Resolve: func(params graphql.ResolveParams) (interface{}, error) {
		uuidCtx := params.Context.Value("UserUUID")
		if uuidCtx == nil {
			return nil, fmt.Errorf("invalid or expired access token")
		}

		key, _ := params.Args["key"].(string)
		permission, _ := params.Args["permission"].(string)
		apiKey, err := GetByAPIKey(key)
		if err != nil || uuidCtx.(string) != apiKey.UserUUID {
			return nil, fmt.Errorf("invalid api key")
		}

		// If permission already exists, do nothing.
		permissionsArray := []string{}
		for _, v := range apiKey.GetPermissions() {
			if v != permission {
				permissionsArray = append(permissionsArray, v)
			}
		}

		// Add permission.
		permissions, _ := json.Marshal(permissionsArray)
		errs := database.DB.Model(&apiKey).Update(auth.APIKey{Permissions: postgres.Jsonb{permissions}}).GetErrors()
		if len(errs) > 0 {
			return nil, errs[0]
		}

		return toGraphQLType(*apiKey), nil
	},
}

func GetByAPIKey(key string) (*auth.APIKey, error) {
	apiKey := new(auth.APIKey)
	database.DB.Where(&auth.APIKey{APIKey: key}).First(&apiKey)

	if apiKey.UserUUID == "" {
		return nil, fmt.Errorf("invalid api key")
	}
	return apiKey, nil
}
