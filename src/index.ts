// Load environment variables from .env file.
import dotenv from "dotenv";
import { createConnection } from "typeorm";

dotenv.config();

import app from "./app";

// Establish database connection.
createConnection();

// Start web server.
const port = process.env.PORT || 8080;

app.listen(port, () => {
  // tslint:disable-next-line:no-console
  console.log(`Server started at http://localhost:${port}`);
});
