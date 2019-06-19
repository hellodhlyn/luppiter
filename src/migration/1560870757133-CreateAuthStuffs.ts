import { MigrationInterface, QueryRunner, Table, TableIndex } from "typeorm";

export class CreateAuthStuffs1560870757133 implements MigrationInterface {

  public async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.createTable(new Table({
      name: "members",
      columns: [
        { name: "id", type: "bigint", isPrimary: true, isGenerated: true },
        { name: "uuid", type: "varchar", length: "36" },
        { name: "created_at", type: "timestamp with time zone", default: "now()" },
        { name: "updated_at", type: "timestamp with time zone", default: "now()" },
      ],
    }));

    await queryRunner.createIndex("members", new TableIndex({
      name: "idx_uuid",
      columnNames: ["uuid"],
      isUnique: true,
    }));

    await queryRunner.createTable(new Table({
      name: "api_keys",
      columns: [
        { name: "id", type: "bigint", isPrimary: true, isGenerated: true },
        { name: "key", type: "varchar", length: "50" },
        { name: "memo", type: "varchar", length: "50" },
        { name: "permissions", type: "varchar", length: "50", isArray: true },
        { name: "member_id", type: "bigint" },
        { name: "created_at", type: "timestamp with time zone", default: "now()" },
        { name: "updated_at", type: "timestamp with time zone", default: "now()" },
      ],
    }));

    await queryRunner.createIndex("api_keys", new TableIndex({
      name: "idx_key",
      columnNames: ["key"],
    }));

    await queryRunner.createIndex("api_keys", new TableIndex({
      name: "idx_member_id",
      columnNames: ["member_id"],
    }));
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.dropTable("api_keys");
    await queryRunner.dropTable("members");
  }

}
