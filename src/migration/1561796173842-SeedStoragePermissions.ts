import { MigrationInterface, QueryRunner } from "typeorm";

import { Permission } from "../models/auth/permission";
import { StoragePermissionsSeed } from "../seeds/1561796173842-StoragePermissions";

export class SeedStoragePermissions1561796173842 implements MigrationInterface {

  public async up(_: QueryRunner): Promise<any> {
    StoragePermissionsSeed.forEach(async (p) => await Permission.insert(p));
  }

  public async down(_: QueryRunner): Promise<any> {
    // do nothing...
  }

}
