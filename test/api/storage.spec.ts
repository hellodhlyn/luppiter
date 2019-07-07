import { expect } from "chai";
import { Factory } from "rosie";
import sinon from "sinon";

import mockRequest from "./mock-request";
import { Member } from "../../src/models/auth/member";
import { StorageBucket } from "../../src/models/storage/bucket";
import { ApiKey } from "../../src/models/auth/api_key";
import { Permission } from "../../src/models/auth/permission";

describe("storage apis", () => {
  let member: Member;
  let apiKey: ApiKey;

  before(async () => {
    member = await Factory.build<Member>("Member");
    apiKey = await Factory.build<ApiKey>("ApiKey", {
      member,
      permissions: [await Permission.findOne({ key: "Storage::*" })],
    });
  });
  after(() => mockRequest.close());

  describe("GET /storage/:bucketName/:key", () => {
    let bucket: StorageBucket;
    let spy: sinon.SinonStub;

    before(() => {
      spy = sinon.stub(StorageBucket.prototype, "readFile")
        .returns(new Promise((resolve) => resolve(Buffer.from("example", "utf-8"))));
    });
    after(() => spy.restore());

    context("public bucket", () => {
      before(async () => {
        bucket = await Factory.build<StorageBucket>("StorageBucket", { member, isPublic: true });
      });

      it("everybody accessible", (done) => {
        mockRequest.get(`/storage/${bucket.name}/mykey`).end((_, res) => {
          expect(res.status).to.equal(200);
          done();
        });
      });
    });

    context("private bucket", () => {
      before(async () => {
        bucket = await Factory.build<StorageBucket>("StorageBucket", { member, isPublic: false });
      });

      it("stranger cannot access", (done) => {
        mockRequest.get(`/storage/${bucket.name}/mykey`).end((_, res) => {
          expect(res.status).to.equal(401);
          done();
        });
      });

      it("owner is accessible", (done) => {
        mockRequest.get(`/storage/${bucket.name}/mykey`)
          .set("X-Api-Key", apiKey.key)
          .end((_, res) => {
            expect(res.status).to.equal(200);
            done();
          });
      });
    });
  });

  describe("POST /storage/:bucketName/:key", () => {
    let bucket: StorageBucket;
    let spy: sinon.SinonStub;

    before(async () => {
      spy = sinon.stub(StorageBucket.prototype, "writeFile").returns(new Promise((resolve) => resolve()));
      bucket = await Factory.build<StorageBucket>("StorageBucket", { member, isPublic: true });
    });
    after(() => spy.restore());

    it("stranger cannot access", (done) => {
      mockRequest.post(`/storage/${bucket.name}/mykey`)
        .end((_, res) => {
          expect(res.status).to.equal(401);
          done();
        });
    });

    it("owner is accessible", (done) => {
      mockRequest.post(`/storage/${bucket.name}/mykey`)
        .set("X-Api-Key", apiKey.key)
        .attach("file", Buffer.from("example", "utf-8"))
        .end((_, res) => {
          expect(res.status).to.equal(201);
          expect(spy.calledOnceWith("mykey", Buffer.from("example", "utf-8"))).to.be.true;
          done();
        });
    });
  });
});
