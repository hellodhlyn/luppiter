import dotenv from "dotenv";

dotenv.config();
process.env.TYPEORM_DATABASE = "luppiter_test";

import prepare from "mocha-prepare";
import { createConnection } from "typeorm";

prepare((done) => {
  createConnection()
    .then(() => done())
    .catch((e) => done(e));
});
