import { expect } from "chai";
import Docker from "dockerode";
import faker from "faker";
import { Factory } from "rosie";
import sinon from "sinon";

import mockRequest from "../mock-request";
import { Member } from "../../../src/models/auth/member";
import { ApiKey } from "../../../src/models/auth/api_key";
import { Permission } from "../../../src/models/auth/permission";
import { CloudContainerTask } from "../../../src/models/cloudcontainer/task";
import { CloudContainerHistory } from "../../../src/models/cloudcontainer/history";

describe("vulcan cloudcontainer apis", () => {
  let member: Member;
  let apiKey: ApiKey;
  let stranger: Member;
  let strangerKey: ApiKey;

  before(async () => {
    member = await Factory.build<Member>("Member");
    apiKey = await Factory.build<ApiKey>("ApiKey", {
      member,
      permissions: [await Permission.findOne({ key: "CloudContainer::*" })],
    });

    stranger = await Factory.build<Member>("Member");
    strangerKey = await Factory.build<ApiKey>("ApiKey", {
      member: stranger,
      permissions: [await Permission.findOne({ key: "CloudContainer::*" })],
    });
  });

  describe("GET /vulcan/cloudcontainer/tasks", () => {
    let task: CloudContainerTask;
    before(async () => {
      task = await Factory.build<CloudContainerTask>("CloudContainerTask", { member });
    });

    it("success", (done) => {
      mockRequest.get('/vulcan/cloudcontainer/tasks')
        .set("X-Api-Key", apiKey.key)
        .then((res) => {
          expect(res.status).to.equal(200);
          expect(res.body.length).to.equal(1);
          expect(res.body[0].name).to.equal(task.name);
          expect(res.body[0].createdAt).to.equal(task.createdAt.toISOString());
          done();
        })
        .catch(e => done(e));
    });
  });

  describe("POST /vulcan/cloudcontainer/tasks", () => {
    const expectedName = faker.random.uuid();

    it("success", (done) => {
      mockRequest.post('/vulcan/cloudcontainer/tasks')
        .set("X-Api-Key", apiKey.key)
        .send({ name: expectedName, image: "hello-world", commands: ["echo", "1"], envs: ["KEY=VALUE"], })
        .then(async (res) => {
          expect(res.status).to.equal(200);
          expect(res.body.name).to.be.equal(expectedName);
          expect(res.body.commands).to.eql(["echo", "1"]);

          const task = await CloudContainerTask.findOne({ name: expectedName });
          expect(task).to.not.be.undefined;
          expect(task.dockerCommands).to.eql(["echo", "1"]);

          done();
        })
        .catch(e => done(e));
    });
  });

  describe("PUT /vulcan/cloudcontainer/tasks/:uuid", () => {
    let task: CloudContainerTask;
    beforeEach(async () => {
      task = await Factory.build<CloudContainerTask>("CloudContainerTask", { member, dockerEnvs: ["KEY1=VALUE2"] });
    });

    it("success", (done) => {
      mockRequest.put(`/vulcan/cloudcontainer/tasks/${task.uuid}`)
        .set("X-Api-Key", apiKey.key)
        .send({ commands: ["echo", "1"] })
        .then(async (res) => {
          expect(res.status).to.equal(200);
          expect(res.body.name).to.equal(task.name);
          expect(res.body.commands).to.be.eql(["echo", "1"]);
          expect(res.body.envs).to.be.eql(["KEY1=VALUE2"]);

          task = await CloudContainerTask.findOne({ id: task.id });
          expect(task.dockerCommands).to.be.eql(["echo", "1"]);
          expect(task.dockerEnvs).to.be.eql(["KEY1=VALUE2"]);

          done();
        })
        .catch(e => done(e));
    });

    it("raise 401 for non-existing bucket", (done) => {
      mockRequest.put(`/vulcan/cloudcontainer/tasks/${faker.random.uuid()}`)
        .set("X-Api-Key", apiKey.key)
        .then(res => {
          expect(res.status).to.equal(401);
          done();
        })
        .catch(e => done(e));
    });

    it("raise 401 for non-owner", (done) => {
      mockRequest.put(`/vulcan/cloudcontainer/tasks/${task.uuid}`)
        .set("X-Api-Key", strangerKey.key)
        .then(res => {
          expect(res.status).to.equal(401);
          done();
        })
        .catch(e => done(e));
    });
  });

  describe("DELETE /vulcan/cloudcontainer/tasks/:uuid", () => {
    let task: CloudContainerTask;
    beforeEach(async () => {
      task = await Factory.build<CloudContainerTask>("CloudContainerTask", { member });
    });

    it("success", (done) => {
      mockRequest.delete(`/vulcan/cloudcontainer/tasks/${task.uuid}`)
        .set("X-Api-Key", apiKey.key)
        .then(async (res) => {
          expect(res.status).to.equal(200);
          
          task = await CloudContainerTask.findOne({ uuid: task.uuid });
          expect(task).to.be.undefined;
          done();
        })
        .catch(e => done(e));
    });
  });

  describe("GET /vulcan/cloudcontainer/tasks/:uuid/run", () => {
    let task: CloudContainerTask;

    let createContainerSpy: sinon.SinonStub;
    let startSpy: sinon.SinonStub;
    let historyCount: number; // TODO - replace with chai-http library
    beforeEach(async () => {
      task = await Factory.build<CloudContainerTask>("CloudContainerTask", { member });
      createContainerSpy = sinon.stub(Docker.prototype, "createContainer").returns(new Promise((resolve) => {
        resolve(new Docker.Container(null, faker.random.uuid()));
      }));
      startSpy = sinon.stub(Docker.Container.prototype, "start").returns(new Promise((resolve) => resolve()));

      historyCount = await CloudContainerHistory.count();
    });
    afterEach(() => {
      createContainerSpy.restore();
      startSpy.restore();
    });

    it("success", (done) => {
      mockRequest.post(`/vulcan/cloudcontainer/tasks/${task.uuid}/run`)
        .set("X-Api-Key", apiKey.key)
        .then(async (res) => {
          expect(res.status).to.equal(201);
          expect((await CloudContainerHistory.count()) - historyCount).to.equal(1);
          done();
        })
        .catch(e => done(e));
    });

    it("raise 401 for non-owner", (done) => {
      mockRequest.post(`/vulcan/cloudcontainer/tasks/${task.uuid}/run`)
        .set("X-Api-Key", strangerKey.key)
        .then(res => {
          expect(res.status).to.equal(401);
          done();
        })
        .catch(e => done(e));
    });
  });
});
