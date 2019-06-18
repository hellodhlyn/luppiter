import express from "express";

const port = process.env.PORT || 8080;

const app = express();
app.get("/ping", (req, res) => res.send("pong"));
app.listen(port, () => {
  // tslint:disable-next-line:no-console
  console.log(`Server started at http://localhost:${port}`);
});
