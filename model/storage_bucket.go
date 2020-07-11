package model

type StorageBucket struct {
	ModelMixin
	OwnerID  int64
	Owner    UserIdentity
	Name     string
	IsPublic bool
}
