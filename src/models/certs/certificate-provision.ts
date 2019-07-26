import {
  BaseEntity, Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn,
} from "typeorm";

import { Certificate } from "./certificate";

@Entity({ name: "certificate_provisions" })
export class CertificateProvision extends BaseEntity {

  public get csr(): Buffer {
    return Buffer.from(this.dbCsr.replace("\\x", ""), "hex");
  }

  public set csr(src: Buffer) {
    this.dbCsr = "\\x" + src.toString("hex");
  }

  public get certificate(): Buffer {
    return Buffer.from(this.dbCertificate.replace("\\x", ""), "hex");
  }

  public set certificate(src: Buffer) {
    this.dbCertificate = "\\x" + src.toString("hex");
  }

  public get privateKey(): Buffer {
    return Buffer.from(this.dbPrivateKey.replace("\\x", ""), "hex");
  }

  public set privateKey(src: Buffer) {
    this.dbPrivateKey = "\\x" + src.toString("hex");
  }

  @PrimaryGeneratedColumn()
  public id: number;

  @ManyToOne(() => Certificate, (cert) => cert)
  @JoinColumn({ name: "certificate_id" })
  public certificateModel: Certificate;

  @Column({ name: "revision" })
  public revision: number;

  @Column({ name: "expire_at" })
  public expireAt: Date;

  @CreateDateColumn({ name: "created_at" })
  public createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  public updatedAt: Date;

  @Column({ name: "csr", type: "bytea" })
  private dbCsr: string;

  @Column({ name: "certificate", type: "bytea" })
  private dbCertificate: string;

  @Column({ name: "private_key", type: "bytea" })
  private dbPrivateKey: string;

}
