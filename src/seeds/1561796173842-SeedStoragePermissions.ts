import { MigrationInterface, QueryRunner } from "typeorm";

import { Permission } from "../models/auth/permission";

const seeds = [
  { key: "Storage::*" },
  { key: "Storage::Read" },
  { key: "Storage::Write" },
];

export class SeedStoragePermissions1561796173842 implements MigrationInterface {

  public async up(_: QueryRunner): Promise<any> {
    seeds.forEach(async (p) => await Permission.insert(p));
  }

  public async down(_: QueryRunner): Promise<any> {
    // do nothing...
  }

}
