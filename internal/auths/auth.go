package auths

import "context"

type authContextKey string

const AuthContext authContextKey = "authCtx"

type AuthenticatedContext struct {
	UID string
}

func WithAuthenticated(ctx context.Context, auth *AuthenticatedContext) context.Context {
	return context.WithValue(ctx, AuthContext, auth)
}

func GetAuthenticated(ctx context.Context) *AuthenticatedContext {
	if v := ctx.Value(AuthContext); v != nil {
		return v.(*AuthenticatedContext)
	}
	return nil
}
