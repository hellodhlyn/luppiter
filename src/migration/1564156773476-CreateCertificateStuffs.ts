import { MigrationInterface, QueryRunner, Table } from "typeorm";

export class CreateCertificateStuffs1564156773476 implements MigrationInterface {

  public async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.createTable(new Table({
      name: "certificates",
      columns: [
        { name: "id", type: "bigint", isPrimary: true, isGenerated: true },
        { name: "uuid", type: "varchar", length: "36" },
        { name: "state", type: "varchar", length: "20" },
        { name: "member_id", type: "bigint" },
        { name: "email", type: "varchar", length: "100" },
        { name: "domains", type: "varchar[]" },
        { name: "dns_token", type: "varchar", length: "40" },
        { name: "created_at", type: "timestamp with time zone", default: "now()" },
        { name: "updated_at", type: "timestamp with time zone", default: "now()" },
      ],
      indices: [
        { name: "idx_certificates_uuid", columnNames: ["uuid"], isUnique: true },
        { name: "idx_certificates_member_id", columnNames: ["member_id"] },
        { name: "idx_certificates_dns_token", columnNames: ["dns_token"], isUnique: true },
      ],
    }));

    await queryRunner.createTable(new Table({
      name: "certificate_provisions",
      columns: [
        { name: "id", type: "bigint", isPrimary: true, isGenerated: true },
        { name: "certificate_id", type: "bigint" },
        { name: "revision", type: "int" },
        { name: "csr", type: "bytea" },
        { name: "certificate", type: "bytea" },
        { name: "private_key", type: "bytea" },
        { name: "expire_at", type: "timestamp with time zone" },
        { name: "created_at", type: "timestamp with time zone", default: "now()" },
        { name: "updated_at", type: "timestamp with time zone", default: "now()" },
      ],
      indices: [
        { name: "idx_certificate_provisions_certificate_id_revision", columnNames: ["certificate_id", "revision"], isUnique: true },
        { name: "idx_certificate_provisions_expire_at", columnNames: ["expire_at"] },
      ],
    }));
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.dropTable("certificate_provisions");
    await queryRunner.dropTable("certificates");
  }

}
