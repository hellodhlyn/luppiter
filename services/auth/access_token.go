package auth

import (
	"fmt"
	"luppiter/components/database"
	"os"
	"time"

	"github.com/dgrijalva/jwt-go"
	"github.com/graphql-go/graphql"
)

var hmacSecret []byte

type AccessToken struct {
	Token string `json:"token"`
}

type AuthClaims struct {
	UserUUID string `json:"user_uuid"`

	jwt.StandardClaims
}

var accessTokenType = graphql.NewObject(graphql.ObjectConfig{
	Name: "AccessToken",
	Fields: graphql.Fields{
		"token": &graphql.Field{Type: graphql.NewNonNull(graphql.String)},
	},
})

var CreateAccessTokenMutation = &graphql.Field{
	Type:        accessTokenType,
	Description: "[Auth] Get access token for specific user.",
	Args: graphql.FieldConfigArgument{
		"LoginInput": &graphql.ArgumentConfig{
			Type: graphql.NewNonNull(graphql.NewInputObject(graphql.InputObjectConfig{
				Name:        "LoginInput",
				Description: "Input object for login",
				Fields: graphql.InputObjectConfigFieldMap{
					"username": &graphql.InputObjectFieldConfig{Type: graphql.NewNonNull(graphql.String)},
					"password": &graphql.InputObjectFieldConfig{Type: graphql.NewNonNull(graphql.String)},
				},
			})),
		},
	},
	Resolve: func(params graphql.ResolveParams) (interface{}, error) {
		loginInput, _ := params.Args["LoginInput"].(map[string]interface{})

		// Check username and password.
		user := new(User)
		database.DB.Where(&User{Username: loginInput["username"].(string)}).First(&user)
		if user.UUID == "" || !user.ValidatePassword(loginInput["password"].(string)) {
			return nil, fmt.Errorf("invalid username of password")
		}

		// Issue new access token.
		claim := AuthClaims{
			user.UUID,
			jwt.StandardClaims{
				Issuer:    "LYnLab/Luppiter",
				IssuedAt:  time.Now().Unix(),
				ExpiresAt: time.Now().AddDate(0, 0, 7).Unix(),
			},
		}

		token, err := jwt.NewWithClaims(jwt.SigningMethodHS256, claim).SignedString(hmacSecret)
		return AccessToken{Token: token}, err
	},
}

// returns (bool, string)
//   bool   : true if access token is valid.
//   string : uuid of user.
func ValidateAccessTokenAndGetUserUUID(tokenString string) (bool, string) {
	token, err := jwt.ParseWithClaims(tokenString, &AuthClaims{}, func(t *jwt.Token) (interface{}, error) {
		return hmacSecret, nil
	})
	if err != nil {
		return false, ""
	}

	if claims, ok := token.Claims.(*AuthClaims); ok && token.Valid {
		return true, claims.UserUUID
	} else {
		return false, ""
	}
}

func init() {
	hmacSecret = []byte(os.Getenv("LUPPITER_SECRET_KEY"))
}
