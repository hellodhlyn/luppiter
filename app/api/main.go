package main

import (
	"fmt"
	"log"
	"net/http"
	"os"
	"strings"

	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/aws/session"
	"github.com/aws/aws-sdk-go/service/s3"
	"github.com/julienschmidt/httprouter"
	"github.com/rs/cors"

	"github.com/hellodhlyn/luppiter/connection"
	"github.com/hellodhlyn/luppiter/controller/storage"
	"github.com/hellodhlyn/luppiter/controller/vulcan"
	"github.com/hellodhlyn/luppiter/repository"
	"github.com/hellodhlyn/luppiter/service"
)

func main() {
	// Database
	db, err := connection.NewDatabaseConnection()
	if err != nil {
		panic(err)
	}

	// AWS sessions
	sess := session.Must(session.NewSession(&aws.Config{Region: aws.String("ap-northeast-2")}))
	s3Client := s3.New(sess)

	// Repositories
	accountRepo, _ := repository.NewUserAccountRepository(db)
	identityRepo, _ := repository.NewUserIdentityRepository(db)
	tokenRepo, _ := repository.NewAccessTokenRepository(db)
	appRepo, _ := repository.NewApplicationRepository(db)
	bucketRepo, _ := repository.NewStorageBucketRepository(db)

	// Services
	accountSvc, err := service.NewUserAccountService(accountRepo, identityRepo)
	if err != nil {
		panic(err)
	}
	tokenSvc, _ := service.NewAccessTokenService(tokenRepo)
	appSvc, _ := service.NewApplicationService(appRepo)
	authSvc, _ := service.NewAuthenticationService(tokenRepo)
	storageSvc, _ := service.NewStorageService(bucketRepo, s3Client)

	// Routes
	router := httprouter.New()
	router.GET("/ping", func(w http.ResponseWriter, _ *http.Request, _ httprouter.Params) {
		_, _ = w.Write([]byte("pong"))
	})

	// Routes - /vulcan (v1)
	appCtrl, _ := vulcan.NewApplicationsController(appSvc)
	authCtrl, _ := vulcan.NewAuthController(accountSvc, appSvc, tokenSvc, authSvc)
	router.GET("/vulcan/applications/:uuid", appCtrl.Get)
	router.GET("/vulcan/auth/me", authCtrl.GetMe)
	router.POST("/vulcan/auth/signin/google", authCtrl.AuthByGoogle)
	router.POST("/vulcan/auth/activate", authCtrl.ActivateAccessToken)

	// Routes - /storage
	storageCtrl, _ := storage.NewStorageController(storageSvc)
	router.GET("/storage/:bucket/*key", storageCtrl.GetFile)

	// Route configs
	origins := strings.Split(os.Getenv("LUPPITER_ALLOWED_ORIGINS"), ",")
	handler := cors.New(cors.Options{
		AllowedOrigins: origins,
		AllowedHeaders: []string{"*"},
	}).Handler(router)

	fmt.Println("Start and listening 0.0.0.0:8080")
	log.Fatal(http.ListenAndServe(":8080", handler))
}
