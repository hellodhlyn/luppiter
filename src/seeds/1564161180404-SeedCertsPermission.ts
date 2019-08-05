import { MigrationInterface, QueryRunner } from "typeorm";

import { Permission } from "../models/auth/permission";

const seeds = [
  { key: "Certs::*" },
  { key: "Certs::Read" },
  { key: "Certs::Write" },
];

export class SeedCertsPermission1564161180404 implements MigrationInterface {

  public async up(_: QueryRunner): Promise<any> {
    seeds.forEach(async (p) => await Permission.insert(p));
  }

  public async down(_: QueryRunner): Promise<any> {
    // do nothing...
  }

}
