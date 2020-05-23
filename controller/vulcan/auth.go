package vulcan

import (
	"encoding/json"
	"net/http"
	"time"

	"github.com/hellodhlyn/luppiter/service"
	"github.com/julienschmidt/httprouter"
)

type AuthController interface {
	AuthByGoogle(http.ResponseWriter, *http.Request, httprouter.Params)
}

type AuthControllerImpl struct {
	accountSvc service.UserAccountService
	tokenSvc   service.AccessTokenService
}

func NewAuthController(accountSvc service.UserAccountService, tokenSvc service.AccessTokenService) (AuthController, error) {
	return &AuthControllerImpl{accountSvc, tokenSvc}, nil
}

type PostAccountBody struct {
	IdToken string `json:"idToken"`
}

type AccessTokenBody struct {
	AccessKey string     `json:"access_key"`
	SecretKey string     `json:"secret_key"`
	ExpireAt  *time.Time `json:"expire_at"`
}

// POST /vulcan/auth/signin/google
// Body =>
// {
//   "idToken": "string"
// }
func (ctrl *AuthControllerImpl) AuthByGoogle(w http.ResponseWriter, r *http.Request, _ httprouter.Params) {
	var reqBody PostAccountBody
	err := json.NewDecoder(r.Body).Decode(&reqBody)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	account, err := ctrl.accountSvc.FindOrCreateByGoogleAccount(reqBody.IdToken)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	token, _ := ctrl.tokenSvc.CreateAccessToken(&account.Identity)

	resBody := AccessTokenBody{AccessKey: token.AccessKey, SecretKey: token.SecretKey, ExpireAt: token.ExpireAt}
	w.Header().Set("Content-Type", "application/json; encode=utf-8")
	_ = json.NewEncoder(w).Encode(resBody)
}
