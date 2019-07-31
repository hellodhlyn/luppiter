import { MigrationInterface, QueryRunner } from "typeorm";

import { Permission } from "../models/auth/permission";

const seeds = [
  { key: "CloudContainer::*" },
  { key: "CloudContainer::Read" },
  { key: "CloudContainer::Write" },
];

export class SeedCloudContainerPermissions1564588472254 implements MigrationInterface {

  public async up(_: QueryRunner): Promise<any> {
    seeds.forEach(async (p) => await Permission.insert(p));
  }

  public async down(_: QueryRunner): Promise<any> {
    // do nothing...
  }

}
