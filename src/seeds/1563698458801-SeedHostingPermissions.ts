import { MigrationInterface, QueryRunner } from "typeorm";

import { Permission } from "../models/auth/permission";

const seeds = [
  { key: "Hosting::*" },
  { key: "Hosting::Read" },
  { key: "Hosting::Write" },
];

export class SeedHostingPermissions1563698458801 implements MigrationInterface {

  public async up(_: QueryRunner): Promise<any> {
    seeds.forEach(async (p) => await Permission.insert(p));
  }

  public async down(_: QueryRunner): Promise<any> {
    // do nothing...
  }

}
