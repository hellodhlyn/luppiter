package keyvalue

import (
	"fmt"
	"time"

	"github.com/graphql-go/graphql"

	"luppiter/components/auth"
	"luppiter/components/database"
)

type KeyValueItem struct {
	Namespace string `gorm:"type:varchar(255);PRIMARY_KEY"`
	Key       string `gorm:"type:varchar(255);PRIMARY_KEY"`
	Value     string `gorm:"type:varchar(1024)"`

	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

func (KeyValueItem) TableName() string {
	return "keyvalue_items"
}

var keyValueItemType = graphql.NewObject(graphql.ObjectConfig{
	Name: "KeyValueItem",
	Fields: graphql.Fields{
		"key":   &graphql.Field{Type: graphql.NewNonNull(graphql.String)},
		"value": &graphql.Field{Type: graphql.NewNonNull(graphql.String)},
	},
})

// SetKeyValueItemMutation =>
//   mutation { setKeyValueItem { key, value } }
var SetKeyValueItemMutation = &graphql.Field{
	Type:        keyValueItemType,
	Description: "[KeyValue] Create a new key-value item.",
	Args: graphql.FieldConfigArgument{
		"key":   &graphql.ArgumentConfig{Type: graphql.NewNonNull(graphql.String)},
		"value": &graphql.ArgumentConfig{Type: graphql.NewNonNull(graphql.String)},
	},
	Resolve: func(params graphql.ResolveParams) (interface{}, error) {
		apiKey, ok := auth.CheckPermissionAndGetAPIKey(params.Context, "KeyValue")
		if !ok {
			return nil, fmt.Errorf("insufficient permission")
		}

		key, _ := params.Args["key"].(string)
		value, _ := params.Args["value"].(string)

		item := &KeyValueItem{}
		database.DB.Where(&KeyValueItem{Namespace: apiKey.UserUUID, Key: key}).First(&item)

		var errs []error
		if len(item.Value) > 0 {
			// If key already exists, update it.
			errs = database.DB.Model(&item).Update(&KeyValueItem{Value: value}).GetErrors()
		} else {
			// If xnot exists, create it.
			item.Value = value
			errs = database.DB.Create(&item).GetErrors()
		}

		if len(errs) > 0 {
			return nil, fmt.Errorf("failed to create new item")
		}
		return item, nil
	},
}

// KeyValueItemQuery =>
//   query { keyValueItem(key:"") { key, value } }
var KeyValueItemQuery = &graphql.Field{
	Type:        keyValueItemType,
	Description: "[KeyValue] Get key-value item",
	Args: graphql.FieldConfigArgument{
		"key": &graphql.ArgumentConfig{Type: graphql.NewNonNull(graphql.String)},
	},
	Resolve: func(params graphql.ResolveParams) (interface{}, error) {
		apiKey, ok := auth.CheckPermissionAndGetAPIKey(params.Context, "KeyValue")
		if !ok {
			return nil, fmt.Errorf("insufficient permission")
		}

		key, _ := params.Args["key"].(string)

		item := &KeyValueItem{}
		database.DB.Where(&KeyValueItem{Namespace: apiKey.UserUUID, Key: key}).First(&item)
		if item.Value == "" {
			return nil, fmt.Errorf("no such item")
		}
		return item, nil
	},
}
