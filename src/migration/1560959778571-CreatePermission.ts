import {MigrationInterface, QueryRunner, Table, TableColumn} from "typeorm";

export class CreatePermission1560959778571 implements MigrationInterface {

  public async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.dropColumn("api_keys", "permissions");
    await queryRunner.createTable(new Table({
      name: "permissions",
      columns: [
        { name: "id", type: "bigint", isPrimary: true, isGenerated: true },
        { name: "key", type: "varchar", length: "50" },
        { name: "created_at", type: "timestamp with time zone", default: "now()" },
        { name: "updated_at", type: "timestamp with time zone", default: "now()" },
      ],
    }));
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.dropTable("permissions");
    await queryRunner.addColumn("api_keys", new TableColumn({
      name: "permissions",
      type: "varchar",
      length: "50",
      isArray: true,
    }));
  }

}
