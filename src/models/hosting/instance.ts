import crypto from "crypto";
import {
  BaseEntity, BeforeInsert, Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import uuidv4 from "uuid/v4";

import { Member } from "../auth/member";

@Entity({ name: "hosting_instances" })
export default class HostingInstance extends BaseEntity {
  @PrimaryGeneratedColumn()
  public id: number;

  @Column({ name: "uuid" })
  public uuid: string;

  @ManyToOne(() => Member)
  @JoinColumn({ name: "member_id" })
  public member: Member;

  @Column({ name: "name" })
  public name: string;

  // Domain: xxxxxxxxxxxxxxxxxxxx.luppiter.dev
  @Column({ name: "domain_key" })
  public domainKey: string;

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
  public deployDns() {
    // TODO - deploy dns using cloudflare
  }

  public toJson(): object {
    return {
      name: this.name,
      uuid: this.uuid,
      createdAt: this.createdAt.toISOString(),
    };
  }
}
