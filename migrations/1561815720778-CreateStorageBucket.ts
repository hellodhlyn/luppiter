import {MigrationInterface, QueryRunner, Table} from "typeorm";

export class CreateStorageBucket1561815720778 implements MigrationInterface {

  public async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.createTable(new Table({
      name: "storage_buckets",
      columns: [
        { name: "id", type: "bigint", isPrimary: true, isGenerated: true },
        { name: "member_id", type: "bigint" },
        { name: "name", type: "varchar", length: "100" },
        { name: "is_public", type: "boolean", default: false },
        { name: "created_at", type: "timestamp with time zone", default: "now()" },
        { name: "updated_at", type: "timestamp with time zone", default: "now()" },
      ],
      indices: [
        { name: "idx_storage_buckets_member_id", columnNames: ["member_id"] },
        { name: "idx_storage_buckets_name", columnNames: ["name"], isUnique: true },
      ],
    }));
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.dropTable("storage_buckets");
  }

}
