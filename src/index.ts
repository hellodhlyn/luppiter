// Load environment variables from .env file.
import dotenv from "dotenv";

dotenv.config();

import express, { RequestHandler } from "express";
import expressFileupload from "express-fileupload";
import expressContext from "express-http-context";
import { createConnection } from "typeorm";

import storage from "./api/storage";
import vulcanAuth from "./api/v1/auth";
import vulcanStorage from "./api/v1/storage";
import { ApiKey } from "./models/auth/api_key";

// Establish database connection.
createConnection();

// Start web server.
const port = process.env.PORT || 8080;
const app = express();

app.use(express.json());
app.use(expressContext.middleware);
app.use(expressFileupload({
  limits: { fileSize: 10 * 1024 * 1024 },
}));

function permitted(handle: RequestHandler, permission: string): RequestHandler {
  return async (req, res, next) => {
    const key = req.header("X-Api-Key");
    if (!key) {
      res.sendStatus(401);
      return;
    }

    const apiKey = await ApiKey.findOne({ where: { key }, relations: ["member", "permissions"] });
    if (!apiKey || !apiKey.hasPermission(permission)) {
      res.sendStatus(401);
      return;
    }

    expressContext.set("request:api_key", apiKey);
    return handle(req, res, next);
  };
}

// V1 (Vulcan)
app.get("/vulcan/auth/me", vulcanAuth.getMe);
app.get("/vulcan/auth/api_keys", vulcanAuth.listApiKeys);
app.post("/vulcan/auth/api_keys", vulcanAuth.createApiKey);
app.get("/vulcan/auth/api_keys/:key/permissions", vulcanAuth.listPermissions);
app.post("/vulcan/auth/api_keys/:key/permissions", vulcanAuth.addPermission);
app.delete("/vulcan/auth/api_keys/:key/permissions", vulcanAuth.removePermission);

app.get("/vulcan/storage/buckets", permitted(vulcanStorage.listBuckets, "Storage::Read"));
app.post("/vulcan/storage/buckets", permitted(vulcanStorage.createBucket, "Storage::Write"));
app.put("/vulcan/storage/buckets/:name", permitted(vulcanStorage.updateBucket, "Storage::Write"));
app.delete("/vulcan/storage/buckets/:name", permitted(vulcanStorage.deleteBucket, "Storage::Write"));

// File Storage
app.get("/storage/:namespace/:key", storage.readFile);
app.post("/storage/:namespace/:key", storage.writeFile);

app.get("/ping", (req, res) => res.send("pong"));
app.listen(port, () => {
  // tslint:disable-next-line:no-console
  console.log(`Server started at http://localhost:${port}`);
});
