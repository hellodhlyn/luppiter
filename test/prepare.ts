import dotenv from "dotenv";

dotenv.config();
process.env.TYPEORM_DATABASE = "luppiter_test";
process.env.TYPEORM_ENTITIES = "src/models/**/*.ts";

import prepare from "mocha-prepare";

import buildFactories from "./factories";

prepare(async (done) => {
  buildFactories();
  done();
});
