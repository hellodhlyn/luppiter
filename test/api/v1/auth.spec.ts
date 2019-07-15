import axios from "axios";
import { expect } from "chai";
import faker from "faker";
import { Factory } from "rosie";
import { Response } from "superagent";
import sinon from "sinon";

import mockRequest from "../mock-request";
import Repositories from "../../../src/models/repositories";
import { Member } from "../../../src/models/auth/member";
import { ApiKey } from "../../../src/models/auth/api_key";
import { Permission } from "../../../src/models/auth/permission";

describe("vulcan auth apis", () => {
  let axiosSpy: sinon.SinonStub;

  context("with new member", () => {
    const memberData = { uuid: faker.random.uuid() };
    before(() => {
      axiosSpy = sinon.stub(axios, "get").returns(new Promise((resolve) => resolve({ data: memberData })));
    });
    after(() => axiosSpy.restore());

    it("GET /vulcan/auth/me", (done) => {
      mockRequest.get("/vulcan/auth/me")
        .set("Authorization", "Bearer dummy")
        .then(async (res) => {
          expect(res.status).to.equal(200);
          expect(res.body.uuid).to.equal(memberData.uuid);

          const member = await Member.findOne({ uuid: memberData.uuid });
          expect(member).to.not.be.undefined;
          done();
        })
        .catch(e => done(e));
    });
  });

  context("for valid tokens", () => {
    let member: Member;
    let apiKey: ApiKey;
    beforeEach(async () => {
      member = await Factory.build<Member>("Member");
      apiKey = await Factory.build<ApiKey>("ApiKey", {
        member,
        permissions: [await Permission.findOne({ key: "Storage::Read" })],
      });

      axiosSpy = sinon.stub(axios, "get").returns(new Promise((resolve) => resolve({ data: { uuid: member.uuid } })));
    });
    afterEach(() => axiosSpy.restore());

    it("GET /vulcan/auth/me", (done) => {
      mockRequest.get("/vulcan/auth/me")
        .set("Authorization", "Bearer dummy")
        .then((res) => {
          expect(res.status).to.equal(200);
          expect(res.body.uuid).to.equal(member.uuid);
          done();
        })
        .catch(e => done(e));
    });

    it("GET /vulcan/auth/api_keys", (done) => {
      mockRequest.get("/vulcan/auth/api_keys")
        .set("Authorization", "Bearer dummy")
        .then((res) => {
          expect(res.status).to.equal(200);
          expect(res.body.length).to.equal(1);
          expect(res.body[0].key).to.equal(apiKey.key);
          done();
        })
        .catch(e => done(e));
    });

    it("POST /vulcan/auth/api_keys", (done) => {
      const memo = faker.random.words(3);
      mockRequest.post("/vulcan/auth/api_keys")
        .set("Authorization", "Bearer dummy")
        .send({ memo })
        .then(async (res) => {
          expect(res.status).to.equal(200);
          
          const dbApiKey = await ApiKey.findOne({ where: { key: res.body.key }, relations: ["member"] });
          expect(dbApiKey.member.id).to.equal(member.id);
          expect(dbApiKey.memo).to.equal(memo);
          done();
        })
        .catch(e => done(e));
    });

    it("DELETE /vulcan/auth/api_keys/:key", (done) => {
      mockRequest.delete(`/vulcan/auth/api_keys/${apiKey.key}`)
        .set("Authorization", "Bearer dummy")
        .then(async (res) => {
          expect(res.status).to.equal(200);

          const dbApiKey = await ApiKey.findOne({ key: apiKey.key });
          expect(dbApiKey).to.be.undefined;
          done();
        })
        .catch(e => done(e));
    });

    it("GET /vulcan/auth/api_keys/:key/permission", (done) => {
      mockRequest.get(`/vulcan/auth/api_keys/${apiKey.key}/permissions`)
        .set("Authorization", "Bearer dummy")
        .then((res) => {
          expect(res.status).to.equal(200);
          expect(res.body.length).to.equal(1);
          expect(res.body[0].key).to.equal(apiKey.permissions[0].key);
          done();
        })
        .catch(e => done(e));
    });

    it("POST /vulcan/auth/api_keys/:key/permission", (done) => {
      mockRequest.post(`/vulcan/auth/api_keys/${apiKey.key}/permissions`)
        .set("Authorization", "Bearer dummy")
        .send({ key: "Storage::Write" })
        .then(async (res) => {
          expect(res.status).to.equal(200);
          expect(res.body.length).to.equal(2);

          const repo = await Repositories.getRepository(ApiKey);
          apiKey = await repo.findOne({ where: { key: apiKey.key }, relations: ["permissions"] });
          expect(apiKey.permissions.length).to.equal(2);
          done();
        })
        .catch(e => done(e));
    });

    it("POST /vulcan/auth/api_keys/:key/permission (duplicated permission)", (done) => {
      mockRequest.post(`/vulcan/auth/api_keys/${apiKey.key}/permissions`)
        .set("Authorization", "Bearer dummy")
        .send({ key: "Storage::Read" })
        .then(async (res) => {
          expect(res.status).to.equal(200);
          expect(res.body.length).to.equal(1);
          done();
        })
        .catch(e => done(e));
    });

    it("DELETE /vulcan/auth/api_keys/:key/permission", (done) => {
      mockRequest.delete(`/vulcan/auth/api_keys/${apiKey.key}/permissions`)
        .set("Authorization", "Bearer dummy")
        .send({ key: "Storage::Read" })
        .then(async (res) => {
          expect(res.status).to.equal(200);
          
          const repo = await Repositories.getRepository(ApiKey);
          apiKey = await repo.findOne({ where: { key: apiKey.key }, relations: ["permissions"] });
          expect(apiKey.permissions.length).to.equal(0);
          done();
        })
        .catch(e => done(e));
    });

    context("GET /vulcan/auth/permissions", () => {
      it("query exists", (done) => {
        mockRequest.get(`/vulcan/auth/permissions`)
          .query({ query: "::Read" })
          .then(async (res) => {
            expect(res.status).to.equal(200);
            expect(res.body.length).to.not.equal(0);
            expect(res.body[0].key).to.have.string("::Read");
            done();
          })
          .catch(e => done(e));
      });

      it("query too short", (done) => {
        mockRequest.get(`/vulcan/auth/permissions`)
          .query({ query: "S" })
          .then(async (res) => {
            expect(res.body.length).to.equal(0);
            done();
          })
          .catch(e => done(e));
      });
    });
  });

  context("for invalid tokens", () => {
    before(() => {
      axiosSpy = sinon.stub(axios, "get").throws(Error("Unauthorized"));
    });
    after(() => axiosSpy.restore());

    const urls = [
      ["GET", "/vulcan/auth/me"],
      ["GET", "/vulcan/auth/api_keys"],
      ["POST", "/vulcan/auth/api_keys"],
      ["DELETE", "/vulcan/auth/api_keys/dummy"],
      ["GET", "/vulcan/auth/api_keys/dummy/permissions"],
      ["POST", "/vulcan/auth/api_keys/dummy/permissions"],
      ["DELETE", "/vulcan/auth/api_keys/dummy/permissions"],
    ];

    urls.forEach((url) => {
      it(`${url[0]} ${url[1]}`, (done) => {
        let call;
        switch (url[0]) {
          case "GET":    call = mockRequest.get;    break;
          case "POST":   call = mockRequest.post;   break;
          case "PUT":    call = mockRequest.put;    break;
          case "DELETE": call = mockRequest.delete; break;
          default: done("No such method");
        }

        call(url[1])
          .set("Authorization", "Bearer dummy")
          .then((res: Response) => {
            expect(res.status).to.equal(401);
            done();
          })
          .catch((e: any) => done(e));
      });
    });
  });
});
