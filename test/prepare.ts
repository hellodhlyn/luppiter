import dotenv from "dotenv";

dotenv.config();
process.env.TYPEORM_DATABASE = "luppiter_test";
process.env.TYPEORM_ENTITIES = "src/models/**/*.ts";

import prepare from "mocha-prepare";

import buildFactories from "./factories";
import mockRequest from "./api/mock-request";

prepare(async (done) => {
  buildFactories();
  done();
}, (done) => {
  mockRequest.close();
  done();
});
