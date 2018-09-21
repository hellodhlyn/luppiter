package email

import (
	"os"

	"gopkg.in/gomail.v2"
)

var (
	d *gomail.Dialer
)

func init() {
	d = gomail.NewDialer(os.Getenv("SMTP_HOST"), 587, os.Getenv("SMTP_USERNAME"), os.Getenv("SMTP_PASSWORD"))
}

func Send(to string, subject string, body string) (err error) {
	m := gomail.NewMessage()
	m.SetHeader("From", "noreply@lynlab.co.kr")
	m.SetHeader("To", to)
	m.SetHeader("Subject", subject)
	m.SetBody("text/html", body)

	err = d.DialAndSend(m)
	return
}
