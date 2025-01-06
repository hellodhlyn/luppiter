package storage

import "io"

type Object struct {
	BucketName string            `json:"bucketName"`
	ObjectName string            `json:"objectName"`
	Metadata   map[string]string `json:"metadata"`
	Headers    map[string]string `json:"headers"`
}

type UploadObjectInput struct {
	BucketName string
	ObjectName string
	Body       io.Reader
	Headers    map[string]string
}
