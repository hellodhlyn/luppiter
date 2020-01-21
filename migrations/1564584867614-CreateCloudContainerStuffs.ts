import { MigrationInterface, QueryRunner, Table } from "typeorm";

export class CreateCloudContainerStuffs1564584867614 implements MigrationInterface {

  public async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.createTable(new Table({
      name: "cloud_container_tasks",
      columns: [
        { name: "id", type: "bigint", isPrimary: true, isGenerated: true },
        { name: "uuid", type: "varchar", length: "36", isUnique: true },
        { name: "member_id", type: "bigint" },
        { name: "name", type: "varchar", length: "100" },
        { name: "docker_image", type: "varchar", length: "200" },
        { name: "docker_commands", type: "varchar[]" },
        { name: "docker_envs", type: "varchar[]" },
        { name: "created_at", type: "timestamp with time zone", default: "now()" },
        { name: "updated_at", type: "timestamp with time zone", default: "now()" },
      ],
      indices: [
        { name: "idx_cloud_container_tasks_member_id", columnNames: ["member_id"] },
      ],
    }));

    await queryRunner.createTable(new Table({
      name: "cloud_container_histories",
      columns: [
        { name: "id", type: "bigint", isPrimary: true, isGenerated: true },
        { name: "uuid", type: "varchar", length: "36", isUnique: true },
        { name: "task_id", type: "bigint" },
        { name: "container_id", type: "varchar", length: "100" },
        { name: "stdout", type: "bytea", isNullable: true },
        { name: "stderr", type: "bytea", isNullable: true },
        { name: "exit_code", type: "varchar", length: "10", isNullable: true },
        { name: "terminated_at", type: "timestamp with time zone", isNullable: true },
        { name: "created_at", type: "timestamp with time zone", default: "now()" },
        { name: "updated_at", type: "timestamp with time zone", default: "now()" },
      ],
      indices: [
        { name: "idx_cloud_container_histories_task_id", columnNames: ["task_id"] },
      ],
    }));
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.dropTable("cloud_container_histories");
    await queryRunner.dropTable("cloud_container_tasks");
  }

}
