import crypto from "crypto";
import {
  BaseEntity, BeforeInsert, BeforeRemove, Column, CreateDateColumn, Entity, JoinColumn, ManyToOne,
  PrimaryGeneratedColumn, UpdateDateColumn,
} from "typeorm";
import uuidv4 from "uuid/v4";

import { CloudflareClient } from "../../libs/cloudflare";
import { Member } from "../auth/member";
import { Certificate } from "../certs/certificate";

@Entity({ name: "hosting_instances" })
export default class HostingInstance extends BaseEntity {
  private static cfClient = new CloudflareClient(process.env.CLOUDFLARE_API_TOKEN);

  @PrimaryGeneratedColumn()
  public id: number;

  @Column({ name: "uuid" })
  public uuid: string;

  @ManyToOne(() => Member)
  @JoinColumn({ name: "member_id" })
  public member: Member;

  @Column({ name: "name" })
  public name: string;

  @Column({ name: "domain" })
  public domain: string;

  // Domain: xxxxxxxxxxxxxxxxxxxx.luppiter.dev
  @Column({ name: "domain_key" })
  public domainKey: string;

  @ManyToOne(() => Certificate)
  @JoinColumn({ name: "certificate_id" })
  public certificate: Certificate;

  @CreateDateColumn({ name: "created_at" })
  public createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  public updatedAt: Date;

  @BeforeInsert()
  public setUUIDAndDomain() {
    this.uuid = uuidv4();
    this.domainKey = crypto.randomBytes(10).toString("hex");
  }

  @BeforeInsert()
  public async deployDns() {
    const cfZoneId = process.env.CLOUDFLARE_ZONE_ID;
    await HostingInstance.cfClient.postZonesDnsRecord(cfZoneId, {
      type: "CNAME",
      name: `${this.domainKey}.luppiter.dev`,
      content: "hosting.luppiter.dev",
    });
  }

  @BeforeRemove()
  public async clearDns() {
    const cfZoneId = process.env.CLOUDFLARE_ZONE_ID;
    const name = `${this.domainKey}.luppiter.dev`;
    const res = await HostingInstance.cfClient.listZonesDnsRecords(cfZoneId, { name });
    await HostingInstance.cfClient.deleteZonesDnsRecord(cfZoneId, res.result[0].id);
  }

  public toJson(): object {
    return {
      name: this.name,
      uuid: this.uuid,
      domain: this.domain,
      domainCname: `${this.domainKey}.luppiter.dev`,
      createdAt: this.createdAt.toISOString(),
    };
  }
}
