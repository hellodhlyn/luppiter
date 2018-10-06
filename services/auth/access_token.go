package auth

import (
	"fmt"
	"luppiter/components/database"
	"luppiter/components/random"
	"time"

	"github.com/graphql-go/graphql"
)

type AccessToken struct {
	AccessToken           string    `gorm:"type:varchar(255);PRIMARY_KEY" json:"token"`
	AccessTokenValidUntil time.Time `json:"valid_until"`
	UserUUID              string    `gorm:"type:varchar(40);NOT NULL"`

	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

func (AccessToken) TableName() string {
	return "auth_access_tokens"
}

func (token *AccessToken) IsExpired() bool {
	return time.Now().After(token.AccessTokenValidUntil)
}

var accessTokenType = graphql.NewObject(graphql.ObjectConfig{
	Name: "AccessToken",
	Fields: graphql.Fields{
		"token":       &graphql.Field{Type: graphql.NewNonNull(graphql.String)},
		"valid_until": &graphql.Field{Type: graphql.NewNonNull(graphql.DateTime)},
	},
})

var CreateAccessTokenMutation = &graphql.Field{
	Type:        accessTokenType,
	Description: "[Auth] Get access token for specific user.",
	Args: graphql.FieldConfigArgument{
		"username": &graphql.ArgumentConfig{Type: graphql.NewNonNull(graphql.String)},
		"password": &graphql.ArgumentConfig{Type: graphql.NewNonNull(graphql.DateTime)},
	},
	Resolve: func(params graphql.ResolveParams) (interface{}, error) {
		username, _ := params.Args["username"].(string)
		password, _ := params.Args["password"].(string)

		// Check username and password.
		user := new(User)
		database.DB.Where(&User{Username: username}).First(&user)
		if user.UUID == "" || !user.ValidatePassword(password) {
			return nil, fmt.Errorf("invalid username of password")
		}

		// If there isn't existing access token or alreay expired, generate new
		// access token.
		token := new(AccessToken)
		database.DB.Where(AccessToken{UserUUID: user.UUID}).First(&token)
		if token.AccessToken == "" || token.IsExpired() {
			token.UserUUID = user.UUID
			token.AccessToken = random.GenerateRandomString(40)
			token.AccessTokenValidUntil = time.Now().AddDate(0, 0, 7)

			errs := database.DB.Save(&token).GetErrors()
			if len(errs) > 0 {
				return nil, fmt.Errorf("an error occurred during issue token")
			}
		}

		return token, nil
	},
}

func ValidateAccessToken(accessToken string) *AccessToken {
	token := new(AccessToken)
	database.DB.Where(AccessToken{AccessToken: accessToken}).First(&token)

	if token.UserUUID == "" || time.Now().After(token.AccessTokenValidUntil) {
		return nil
	}
	return token
}
