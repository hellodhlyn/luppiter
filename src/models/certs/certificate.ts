import crypto from "crypto";
import {
  AfterInsert, BaseEntity, BeforeInsert, Column, CreateDateColumn, Entity, JoinColumn, ManyToOne,
  OneToMany, PrimaryGeneratedColumn, UpdateDateColumn,
} from "typeorm";
import uuidv4 from "uuid/v4";

import { Member } from "../auth/member";
import { CertificateProvision } from "./certificate-provision";

@Entity({ name: "certificates" })
export class Certificate extends BaseEntity {

  @PrimaryGeneratedColumn()
  public id: number;

  @Column({ name: "uuid", type: "varchar" })
  public uuid: string;

  // submitted | initializing | verifying | issued | failed | almost_expired | expired
  @Column({ name: "state", type: "varchar" })
  public state: string;

  @ManyToOne(() => Member)
  @JoinColumn({ name: "member_id" })
  public member: Member;

  @Column({ name: "email", type: "varchar" })
  public email: string;

  @Column({ name: "domains", type: "varchar", array: true })
  public domains: string[];

  @Column({ name: "dns_token", type: "varchar" })
  public dnsToken: string;

  @OneToMany(() => CertificateProvision, (provision) => provision.certificate)
  public provisions: CertificateProvision[];

  @CreateDateColumn({ name: "created_at" })
  public createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  public updatedAt: Date;

  @BeforeInsert()
  public initialize() {
    this.uuid = uuidv4();
    this.state = "submitted";
    this.dnsToken = crypto.randomBytes(20).toString("hex");
  }

  @AfterInsert()
  public startIssueWorker() {
    // TODO implement
  }

  public toJson() {
    return {
      uuid: this.uuid,
      state: this.state,
      domains: this.domains,
      dnsToken: this.dnsToken,
      createdAt: this.createdAt.toISOString(),
    };
  }

  public lastRevision(): number {
    if (this.provisions && this.provisions.length > 0) {
      return Math.max(...this.provisions.map((p) => p.revision));
    }
    return 0;
  }

}
