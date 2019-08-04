import { expect } from "chai";
import faker from "faker";
import { Factory } from "rosie";
import sinon from "sinon";

import mockRequest from "../mock-request";
import { Member } from "../../../src/models/auth/member";
import { ApiKey } from "../../../src/models/auth/api_key";
import { Permission } from "../../../src/models/auth/permission";
import { Certificate } from "../../../src/models/certs/certificate";
import { CloudContainerTask } from "../../../src/models/cloudcontainer/task";

describe("vulcan certs apis", () => {
  let member: Member;
  let apiKey: ApiKey;
  let taskSpy: sinon.SinonStub;

  before(async () => {
    member = await Factory.build<Member>("Member");
    apiKey = await Factory.build<ApiKey>("ApiKey", {
      member,
      permissions: [await Permission.findOne({ key: "Certs::*" })],
    });

    await Factory.build<CloudContainerTask>("CloudContainerTask", { member, name: "Luppiter::CertsWorker" });

    taskSpy = sinon.stub(CloudContainerTask.prototype, "run").returns(null);
  });

  after(() => {
    taskSpy.restore();
  });

  describe("GET /vulcan/certs/certificates", () => {
    let cert: Certificate;
    before(async() => {
      cert = await Factory.build<Certificate>("Certificate", { member });
    });

    it("success", (done) => {
      mockRequest.get("/vulcan/certs/certificates")
        .set("X-Api-Key", apiKey.key)
        .then((res) => {
          expect(res.status).to.equal(200);
          expect(res.body.length).to.equal(1);
          expect(res.body[0].uuid).to.equal(cert.uuid);
          expect(res.body[0].createdAt).to.equal(cert.createdAt.toISOString());
          done();
        })
        .catch(e => done(e));
    });
  });

  describe("POST /vulcan/certs/certificates", () => {
    const email = faker.internet.email();
    const domains = [faker.internet.domainName(), faker.internet.domainName()];

    it("success", (done) => {
      mockRequest.post("/vulcan/certs/certificates")
        .set("X-Api-Key", apiKey.key)
        .send({ email, domains })
        .then(async (res) => {
          expect(res.status).to.equal(200);

          const cert = await Certificate.findOne({ email });
          expect(cert.email).to.equal(email);
          expect(res.body.state).to.equal("submitted");
          expect(res.body.domains).to.eql(cert.domains);

          expect(taskSpy.calledOnceWith([`WORKER_UUID=${res.body.uuid}`])).to.be.true;
          done();
        })
        .catch(e => done(e));
    });
  });
});
