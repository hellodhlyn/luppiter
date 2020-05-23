package main

import (
	"fmt"
	"log"
	"net/http"

	"github.com/hellodhlyn/luppiter/connection"
	"github.com/hellodhlyn/luppiter/controller/vulcan"
	"github.com/hellodhlyn/luppiter/repository"
	"github.com/hellodhlyn/luppiter/service"
	"github.com/julienschmidt/httprouter"
)

func main() {
	db, err := connection.NewDatabaseConnection()
	if err != nil {
		panic(err)
	}

	accountRepo, err := repository.NewUserAccountRepository(db)
	if err != nil {
		panic(err)
	}
	identityRepo, err := repository.NewUserIdentityRepository(db)
	if err != nil {
		panic(err)
	}
	tokenRepo, err := repository.NewAccessTokenRepository(db)
	if err != nil {
		panic(err)
	}

	accountSvc, err := service.NewUserAccountService(accountRepo, identityRepo)
	if err != nil {
		panic(err)
	}
	tokenSvc, err := service.NewAccessTokenService(tokenRepo)
	if err != nil {
		panic(err)
	}

	authCtrl, _ := vulcan.NewAuthController(accountSvc, tokenSvc)

	router := httprouter.New()
	router.POST("/vulcan/auth/signin/google", authCtrl.AuthByGoogle)

	fmt.Println("Start and listening 0.0.0.0:8080")
	log.Fatal(http.ListenAndServe(":8080", router))
}
