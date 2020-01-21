import {MigrationInterface, QueryRunner, TableColumn, TableIndex} from "typeorm";

export class AddCertificateIdToHostingInstance1564934942294 implements MigrationInterface {

  public async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.addColumns("hosting_instances", [
      new TableColumn({ name: "domain", type: "varchar", isNullable: true }),
      new TableColumn({ name: "certificate_id", type: "bigint" }),
    ]);

    await queryRunner.createIndex(
      "hosting_instances",
      new TableIndex({ name: "idx_hosting_instance_domain", columnNames: ["domain"] }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.dropIndex("hosting_instances", "idx_hosting_instance_domain");
    await queryRunner.dropColumn("hosting_instances", "certificate_id");
  }

}
