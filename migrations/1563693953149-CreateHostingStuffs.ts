import {MigrationInterface, QueryRunner, Table} from "typeorm";

export class CreateHostingStuffs1563693953149 implements MigrationInterface {

  public async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.createTable(new Table({
      name: "hosting_instances",
      columns: [
        { name: "id", type: "bigint", isPrimary: true, isGenerated: true },
        { name: "uuid", type: "varchar", length: "36" },
        { name: "member_id", type: "bigint" },
        { name: "name", type: "varchar", length: "100" },
        { name: "domain_key", type: "varchar", length: "20" },
        { name: "created_at", type: "timestamp with time zone", default: "now()" },
        { name: "updated_at", type: "timestamp with time zone", default: "now()" },
      ],
      indices: [
        { name: "idx_hosting_instances_member_id", columnNames: ["member_id"] },
        { name: "idx_hosting_instances_name", columnNames: ["name"], isUnique: true },
        { name: "idx_hosting_instances_domain_key", columnNames: ["domain_key"] },
      ],
    }));

    await queryRunner.createTable(new Table({
      name: "hosting_backends",
      columns: [
        { name: "id", type: "bigint", isPrimary: true, isGenerated: true },
        { name: "uuid", type: "varchar", length: "36" },
        { name: "type", type: "varchar", length: "50" },
        { name: "instance_id", type: "bigint" },
        { name: "properties", type: "bytea" },
        { name: "created_at", type: "timestamp with time zone", default: "now()" },
        { name: "updated_at", type: "timestamp with time zone", default: "now()" },
      ],
      indices: [
        { name: "idx_hosting_backends_instance_id", columnNames: ["instance_id"] },
      ],
    }));
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.dropTable("hosting_backends");
    await queryRunner.dropTable("hosting_instnaces");
  }

}
