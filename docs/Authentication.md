# Authentication API Guides

## List
* GET /vulcan/auth/me
* POST /vulcan/auth/signin/google (Public)
* POST /vulcan/auth/activate (Public)

## How To Authorize Requests

Pass a JWT by `Authorization` header on request.

Token should be encrypted by the secret key of an access token, including payload:

```json5
{
  "accessKey": "string"
}
```

## GET /vulcan/auth/me
### Response Body
```json5
{
  "uuid": "string",    // Unique ID of the user identity
  "email": "string",   // Verified email address
  "username": "string" // Username of the user identity
}
```

## POST /vulcan/auth/signin/google (Public)
### Request Body
```json5
{
  "idToken": "string",
  "appId": "string"
}
```

### Response Body
```json5
{
  "activationKey": "string"
}
```

## POST /vulcan/auth/activate (Public)
### Request Body
```json5
{
  "activationToken": "string"
}
```

`activationToken` is a JWT encrypted by application's secret key, including payload:

```json5
{
  "key": "string" // activationKey issued from the sign-in API.
}
```

### Response Body
```json5
{
  "accessKey": "string",
  "secretKey": "string",
  "expireAt": "iso8601"
}
```
