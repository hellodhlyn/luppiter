import prepare from "mocha-prepare";
import { createConnection } from "typeorm";

import buildFactories from "./factories";
import mockRequest from "./api/mock-request";
import { Permission } from "../src/models/auth/permission";
import ormconfig from "../src/ormconfig";

prepare(async (done) => {
  await createConnection(ormconfig);
  await Permission.sync();

  buildFactories();
  done();
}, (done) => {
  mockRequest.close();
  done();
});
