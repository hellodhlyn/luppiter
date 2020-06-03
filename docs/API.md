# API Guides

## Auth

### POST /vulcan/auth/signin/google
#### Request Body
```json5
{
  "idToken": "string",
  "appId": "string"
}
```

#### Response Body
```json5
{
  "activationKey": "string"
}
```

### POST /vulcan/auth/activate
#### Request Body
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

#### Response Body
```json5
{
  "accessKey": "string",
  "secretKey": "string",
  "expireAt": "iso8601"
}
```