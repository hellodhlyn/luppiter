import crypto from "crypto";
import faker from "faker";
import { Factory } from "rosie";

import { Member } from "../src/models/auth/member";
import { ApiKey } from "../src/models/auth/api_key";
import { Permission } from "../src/models/auth/permission";
import { StorageBucket } from "../src/models/storage/bucket";
import Repositories from "../src/models/repositories";

export default function buildFactories() {
  // Auth models
  Factory.define<Member>("Member")
    .sequence("id")
    .attr("uuid", () => faker.random.uuid())
    .attr("createdAt", () => new Date())
    .attr("updatedAt", () => new Date())
    .after(async (member) => {
      return Repositories.getRepository(Member).then((repo) => repo.save(member));
    });

  Factory.define<ApiKey>("ApiKey")
    .sequence("id")
    .attr("key", () => crypto.randomBytes(20).toString("hex"))
    .attr("memo", () => faker.random.word())
    .attr("member", () => Factory.build<Member>("Member"))
    .attr("permissions", () => [Factory.build<Permission>("Permission")])
    .attr("createdAt", () => new Date())
    .attr("updatedAt", () => new Date())
    .after(async (key) => {
      return Repositories.getRepository(ApiKey).then((repo) => repo.save(key));
    });

  Factory.define<Permission>("Permission")
    .sequence("id")
    .attr("key", () => faker.random.word())
    .attr("createdAt", () => new Date())
    .attr("updatedAt", () => new Date())
    .after(async (permission) => {
      return Repositories.getRepository(Permission).then((repo) => repo.save(permission));
    });

  // Storage models
  Factory.define<StorageBucket>("StorageBucket")
    .sequence("id")
    .attr("member", () => Factory.build<Member>("Member"))
    .attr("name", () => faker.random.uuid())
    .attr("isPublic", true)
    .attr("createdAt", () => new Date())
    .attr("updatedAt", () => new Date())
    .after(async (bucket) => {
      return Repositories.getRepository(StorageBucket).then((repo) => repo.save(bucket));
    });
}
