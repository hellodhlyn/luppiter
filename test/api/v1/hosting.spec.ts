import { expect } from "chai";
import faker = require("faker");
import { Factory } from "rosie";

import mockRequest from "../mock-request";
import { Member } from "../../../src/models/auth/member";
import { ApiKey } from "../../../src/models/auth/api_key";
import { Permission } from "../../../src/models/auth/permission";
import HostingInstance from "../../../src/models/hosting/instance";

describe("vulcan hosting apis", () => {
  let member: Member;
  let apiKey: ApiKey;
  let stranger: Member;
  let strangerKey: ApiKey;

  before(async () => {
    member = await Factory.build<Member>("Member");
    apiKey = await Factory.build<ApiKey>("ApiKey", {
      member,
      permissions: [await Permission.findOne({ key: "Hosting::*" })],
    });

    stranger = await Factory.build<Member>("Member");
    strangerKey = await Factory.build<ApiKey>("ApiKey", {
      member: stranger,
      permissions: [await Permission.findOne({ key: "Hosting::*" })],
    });
  });

  context("GET /vuclan/hosting/instances", () => {
    let instance: HostingInstance;
    before(async () => {
      instance = await Factory.build<HostingInstance>("HostingInstance", { member });
    });

    it("success", (done) => {
      mockRequest.get("/vulcan/hosting/instances")
        .set("X-Api-Key", apiKey.key)
        .then((res) => {
          expect(res.status).to.equal(200);
          expect(res.body.length).to.equal(1);
          expect(res.body[0].uuid).to.equal(instance.uuid);
          expect(res.body[0].name).to.equal(instance.name);
          expect(res.body[0].createdAt).to.equal(instance.createdAt.toISOString());
          done();
        })
        .catch(e => done(e));
    });
  });

  context("POST /vuclan/hosting/instances", () => {
    const expectedName = faker.random.uuid();

    it("success", (done) => {
      mockRequest.post("/vulcan/hosting/instances")
        .set("X-Api-Key", apiKey.key)
        .send({ name: expectedName })
        .then(async (res) => {
          expect(res.status).to.equal(200);
          const instance = await HostingInstance.findOne({ name: expectedName });
          expect(instance).to.not.be.undefined;
          done();
        })
        .catch(e => done(e));
    });

    it("failed for duplicated entry", (done) => {
      mockRequest.post("/vulcan/hosting/instances")
        .set("X-Api-Key", apiKey.key)
        .send({ name: expectedName })
        .then(async (res) => {
          expect(res.status).to.equal(400);
          done();
        })
        .catch(e => done(e));
    });
  });

  context("DELETE /vuclan/hosting/instances/:uuid", () => {
    let instance: HostingInstance;
    beforeEach(async () => {
      instance = await Factory.build<HostingInstance>("HostingInstance", { member });
    });

    it("success", (done) => {
      mockRequest.delete(`/vulcan/hosting/instances/${instance.uuid}`)
        .set("X-Api-Key", apiKey.key)
        .then(async (res) => {
          expect(res.status).to.equal(200);
          expect(res.body.name).to.equal(instance.name);

          instance = await HostingInstance.findOne({ uuid: instance.uuid });
          expect(instance).to.be.undefined;
          done();
        })
        .catch(e => done(e));
    });

    it("raise 401 for non-owner", (done) => {
      mockRequest.delete(`/vulcan/hosting/instances/${instance.uuid}`)
        .set("X-Api-Key", strangerKey.key)
        .then(async (res) => {
          expect(res.status).to.equal(401);
          done();
        })
        .catch(e => done(e));
    });
  });
});
