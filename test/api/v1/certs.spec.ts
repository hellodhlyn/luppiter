import { expect } from "chai";
import faker from "faker";
import { Factory } from "rosie";

import mockRequest from "../mock-request";
import { Member } from "../../../src/models/auth/member";
import { ApiKey } from "../../../src/models/auth/api_key";
import { Permission } from "../../../src/models/auth/permission";
import { Certificate } from "../../../src/models/certs/certificate";

describe("vulcan certs apis", () => {
  let member: Member;
  let apiKey: ApiKey;

  before(async () => {
    member = await Factory.build<Member>("Member");
    apiKey = await Factory.build<ApiKey>("ApiKey", {
      member,
      permissions: [await Permission.findOne({ key: "Certs::*" })],
    });
  });

  describe("POST /vulcan/certs/certificate", () => {
    const email = faker.internet.email();
    const domains = [faker.internet.domainName(), faker.internet.domainName()];

    it("success", (done) => {
      mockRequest.post("/vulcan/certs/certificate")
        .set("X-Api-Key", apiKey.key)
        .send({ email, domains })
        .then(async (res) => {
          expect(res.status).to.equal(200);

          const cert = await Certificate.findOne({ email });
          expect(cert.email).to.equal(email);
          expect(res.body.state).to.equal("submitted");
          expect(res.body.domains).to.eql(cert.domains);
          done();
        })
        .catch(e => done(e));
    });
  });
});
