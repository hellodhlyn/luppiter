import express from "express";
import { createConnection } from "typeorm";

import vulcanAuth from "./api/v1/auth";

createConnection();

const port = process.env.PORT || 8080;
const app = express();

app.use(express.json());

// V1 (Vulcan)
app.get("/vulcan/auth/me", vulcanAuth.getMe);
app.get("/vulcan/auth/api_keys", vulcanAuth.listApiKeys);
app.post("/vulcan/auth/api_keys", vulcanAuth.createApiKey);

app.get("/ping", (req, res) => res.send("pong"));
app.listen(port, () => {
  // tslint:disable-next-line:no-console
  console.log(`Server started at http://localhost:${port}`);
});
