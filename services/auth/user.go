package auth

import (
	"bytes"
	"crypto/rand"
	"fmt"
	"os"
	"time"

	"github.com/graphql-go/graphql"
	uuid "github.com/satori/go.uuid"
	"golang.org/x/crypto/argon2"

	"luppiter/components/database"
	"luppiter/components/email"
	"luppiter/components/random"
)

type User struct {
	UUID string `gorm:"type:varchar(40);PRIMARY_KEY" json:"uuid"`

	Username     string `gorm:"type:varchar(255);NOT NULL;UNIQUE_INDEX" json:"username"`
	PasswordHash []byte `gorm:"NOT NULL"`
	PasswordSalt []byte `gorm:"NOT NULL"`
	Email        string `gorm:"type:varchar(255);UNIQUE_INDEX" json:"email"`

	Activated                 bool   `gorm:"default:false"`
	ActivationToken           string `gorm:"type:varchar(255);INDEX"`
	ActivationTokenValidUntil time.Time

	CreatedAt time.Time
	UpdatedAt time.Time
}

func (User) TableName() string {
	return "auth_users"
}

func (user *User) ValidatePassword(password string) bool {
	hash := argon2.IDKey([]byte(password), user.PasswordSalt, 1, 8*1024, 4, 32)
	return bytes.Compare(hash, user.PasswordHash) == 0
}

var userType = graphql.NewObject(graphql.ObjectConfig{
	Name: "User",
	Fields: graphql.Fields{
		"uuid":      &graphql.Field{Type: graphql.String},
		"username":  &graphql.Field{Type: graphql.String},
		"email":     &graphql.Field{Type: graphql.String},
		"createdAt": &graphql.Field{Type: graphql.DateTime},
	},
})

// MeQuery =>
//   query {
//     me { uuid, username, email, created_at }
//   }
var MeQuery = &graphql.Field{
	Type:        userType,
	Description: "[Auth] Get basic information for user.",
	Resolve: func(params graphql.ResolveParams) (interface{}, error) {
		uuidCtx := params.Context.Value("UserUUID")
		if uuidCtx == nil {
			return nil, fmt.Errorf("invalid or expired access token")
		}

		user := new(User)
		errs := database.DB.Where(&User{UUID: uuidCtx.(string)}).First(&user).GetErrors()
		if len(errs) > 0 {
			return nil, errs[0]
		}
		return user, nil
	},
}

var CreateUserMutation = &graphql.Field{
	Type:        userType,
	Description: "[Auth] Create new user.",
	Args: graphql.FieldConfigArgument{
		"UserInput": &graphql.ArgumentConfig{
			Type: graphql.NewNonNull(graphql.NewInputObject(graphql.InputObjectConfig{
				Name:        "UserInput",
				Description: "InputObject for creating new user",
				Fields: graphql.InputObjectConfigFieldMap{
					"username":       &graphql.InputObjectFieldConfig{Type: graphql.NewNonNull(graphql.String)},
					"password":       &graphql.InputObjectFieldConfig{Type: graphql.NewNonNull(graphql.String)},
					"email":          &graphql.InputObjectFieldConfig{Type: graphql.NewNonNull(graphql.String)},
					"redirectionUrl": &graphql.InputObjectFieldConfig{Type: graphql.NewNonNull(graphql.String)},
				},
			})),
		},
	},
	Resolve: func(params graphql.ResolveParams) (interface{}, error) {
		userInput := params.Args["UserInput"].(map[string]interface{})

		username := userInput["username"].(string)
		password := userInput["password"].(string)
		email := userInput["email"].(string)
		redirectionURL := userInput["redirectionUrl"].(string)

		return register(username, password, email, redirectionURL)
	},
}

// Activate given account.
// Because of HTTP redirection, this API doesn't use GraphQL interface.
func Activate(activationToken string) error {
	user := new(User)
	errs := database.DB.Where(&User{ActivationToken: activationToken}).First(&user).GetErrors()
	if len(errs) > 0 || user.UUID == "" || time.Now().After(user.ActivationTokenValidUntil) {
		return fmt.Errorf("invalid activation token")
	}

	// Activate the user.
	user.Activated = true
	user.ActivationTokenValidUntil = time.Now()
	database.DB.Save(&user)

	return nil
}

func register(username string, password string, email string, redirectionURL string) (user *User, err error) {
	// Create user model.
	salt := make([]byte, 32)
	rand.Read(salt)

	hash := argon2.IDKey([]byte(password), salt, 1, 8*1024, 4, 32)
	activationToken := random.GenerateRandomString(40)
	user = &User{
		UUID: uuid.NewV4().String(),

		Username:     username,
		PasswordHash: hash,
		PasswordSalt: salt,
		Email:        email,

		Activated:                 false,
		ActivationToken:           activationToken,
		ActivationTokenValidUntil: time.Now().Add(1 * time.Hour),
	}

	// Save record on DB.
	errs := database.DB.Create(&user).GetErrors()
	if len(errs) > 0 {
		return nil, fmt.Errorf("failed to create new user")
	}

	// Send activation email.
	return user, sendActivationEmail(email, activationToken, redirectionURL)
}

func sendActivationEmail(to string, activationToken string, redirectionURL string) error {
	activationURL := os.Getenv("LUPPITER_HOST") + "/graphql/api/activate_user?redirection_url=" + redirectionURL + "&activation_token=" + activationToken
	return email.Send(
		to,
		"LYnLab Luppiter 계정 활성화 안내",
		fmt.Sprintf(`
		<p>안녕하세요 :)</p>

		<p>LYnLab Luppiter 계정 활성화를 위한 인증 이메일입니다.<br/>
		<a href="%s">여기</a>를 눌러 인증 절차를 진행해주세요.</p>

		<p>만약 본인이 가입하지 않았다면 이 메일을 무시하셔도 됩니다.</p>

		<p>===============<br/>LYnLab Luppiter<br/>https://luppiter.lynlab.co.kr/web<br/>===============</p>
		`, activationURL, activationURL, activationURL),
	)
}
