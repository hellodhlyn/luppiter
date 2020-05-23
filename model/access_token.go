package model

import (
	"time"
)

type AccessToken struct {
	ModelMixin
	IdentityID int64
	Identity   UserIdentity
	AccessKey  string
	SecretKey  string
	ExpireAt   *time.Time
}
