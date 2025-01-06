package errors

import "net/http"

type LuppiterError struct {
	Message    string
	Origin     error
	HTTPStatus int
}

func (e *LuppiterError) Error() string {
	return e.Message
}

func New(origin error, message string, httpStatus ...int) *LuppiterError {
	err := &LuppiterError{
		Message: message,
		Origin:  origin,
	}

	if len(httpStatus) > 0 {
		err.HTTPStatus = httpStatus[0]
	} else {
		err.HTTPStatus = http.StatusInternalServerError
	}

	return err
}

func NewInternal(origin error) *LuppiterError {
	return New(origin, "unexpected error")
}
