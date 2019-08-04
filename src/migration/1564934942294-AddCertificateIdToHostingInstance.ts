import {MigrationInterface, QueryRunner, TableColumn} from "typeorm";

export class AddCertificateIdToHostingInstance1564934942294 implements MigrationInterface {

  public async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.addColumn(
      "hosting_instances",
      new TableColumn({ name: "certificate_id", type: "bigint" }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.dropColumn("hosting_instances", "certificate_id");
  }

}
