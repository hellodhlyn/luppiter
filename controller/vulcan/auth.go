package vulcan

import (
	"encoding/json"
	"net/http"
	"time"

	"github.com/hellodhlyn/luppiter/controller"
	"github.com/hellodhlyn/luppiter/service"
	"github.com/julienschmidt/httprouter"
)

type AuthController interface {
	AuthByGoogle(http.ResponseWriter, *http.Request, httprouter.Params)
	ActivateAccessToken(http.ResponseWriter, *http.Request, httprouter.Params)
}

type AuthControllerImpl struct {
	accountSvc service.UserAccountService
	appSvc     service.ApplicationService
	tokenSvc   service.AccessTokenService
}

func NewAuthController(
	accountSvc service.UserAccountService,
	appSvc service.ApplicationService,
	tokenSvc service.AccessTokenService,
) (AuthController, error) {
	return &AuthControllerImpl{accountSvc, appSvc, tokenSvc}, nil
}

type SignInReqBody struct {
	IDToken string `json:"idToken"`
	AppID   string `json:"appId"`
}

type SignInResBody struct {
	ActivationKey string `json:"activationKey"`
}

type ActivateReqBody struct {
	ActivationToken string `json:"activationToken"`
}

type ActivateResBody struct {
	AccessKey string     `json:"accessKey"`
	SecretKey string     `json:"secretKey"`
	ExpireAt  *time.Time `json:"expireAt"`
}

// POST /vulcan/auth/signin/google
func (ctrl *AuthControllerImpl) AuthByGoogle(w http.ResponseWriter, r *http.Request, _ httprouter.Params) {
	var reqBody SignInReqBody
	err := json.NewDecoder(r.Body).Decode(&reqBody)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	account, err := ctrl.accountSvc.FindOrCreateByGoogleAccount(reqBody.IDToken)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	app := ctrl.appSvc.FindByUUID(reqBody.AppID)
	if app == nil {
		http.Error(w, "invalid appId", http.StatusBadRequest)
		return
	}

	token, _ := ctrl.tokenSvc.CreateAccessToken(&account.Identity, app)
	controller.JsonResponse(w, &SignInResBody{ActivationKey: token.ActivationKey})
}

// POST /vulcan/auth/activate
func (ctrl *AuthControllerImpl) ActivateAccessToken(w http.ResponseWriter, r *http.Request, _ httprouter.Params) {
	var reqBody ActivateReqBody
	err := json.NewDecoder(r.Body).Decode(&reqBody)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	token, err := ctrl.tokenSvc.ActivateAccessToken(reqBody.ActivationToken)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	controller.JsonResponse(w, &ActivateResBody{AccessKey: token.AccessKey, SecretKey: token.SecretKey, ExpireAt: token.ExpireAt})
}
