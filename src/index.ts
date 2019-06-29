// Load environment variables from .env file.
import dotenv from "dotenv";

dotenv.config();

import express from "express";
import expressFileupload from "express-fileupload";
import { createConnection } from "typeorm";

import storage from "./api/storage";
import vulcanAuth from "./api/v1/auth";

// Establish database connection.
createConnection();

// Start web server.
const port = process.env.PORT || 8080;
const app = express();

app.use(express.json());
app.use(expressFileupload({
  limits: { fileSize: 10 * 1024 * 1024 },
}));

// V1 (Vulcan)
app.get("/vulcan/auth/me", vulcanAuth.getMe);
app.get("/vulcan/auth/api_keys", vulcanAuth.listApiKeys);
app.post("/vulcan/auth/api_keys", vulcanAuth.createApiKey);
app.get("/vulcan/auth/api_keys/:key/permissions", vulcanAuth.listPermissions);
app.post("/vulcan/auth/api_keys/:key/permissions", vulcanAuth.addPermission);
app.delete("/vulcan/auth/api_keys/:key/permissions", vulcanAuth.removePermission);

// File Storage
app.get("/storage/:namespace/:key", storage.readFile);
app.post("/storage/:namespace/:key", storage.writeFile);

app.get("/ping", (req, res) => res.send("pong"));
app.listen(port, () => {
  // tslint:disable-next-line:no-console
  console.log(`Server started at http://localhost:${port}`);
});
