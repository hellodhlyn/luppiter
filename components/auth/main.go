package auth

import (
	"context"
	"encoding/json"
	"time"

	"github.com/jinzhu/gorm/dialects/postgres"
)

type APIKey struct {
	APIKey      string         `gorm:"type:varchar(255);PRIMARY_KEY"`
	UserUUID    string         `gorm:"type:varchar(40);NOT NULL"`
	Comment     string         `gorm:"type:varchar(255);PRIMARY_KEY"`
	Permissions postgres.Jsonb `gorm:"default:'[]'::jsonb"`

	CreatedAt time.Time
	UpdatedAt time.Time
}

func (APIKey) TableName() string {
	return "auth_api_keys"
}

func (key APIKey) GetPermissions() []string {
	var permissions []string
	v, _ := key.Permissions.Value()
	json.Unmarshal(v.([]byte), &permissions)
	return permissions
}

func CheckPermissionAndGetAPIKey(ctx context.Context, serviceName string) (*APIKey, bool) {
	apiKey := ctx.Value("APIKey")
	if apiKey == nil {
		return nil, false
	}

	for _, v := range apiKey.(*APIKey).GetPermissions() {
		if v == (serviceName + "::*") {
			return apiKey.(*APIKey), true
		}
	}
	return nil, false
}
