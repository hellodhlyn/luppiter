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
