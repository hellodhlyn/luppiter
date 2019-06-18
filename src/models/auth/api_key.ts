import {
  BaseEntity, Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn,
} from "typeorm";

import { Member } from "./member";

@Entity({ name: "api_keys" })
export class ApiKey extends BaseEntity {

  @PrimaryGeneratedColumn()
  public id: number;

  @Column({ name: "key" })
  public key: string;

  @Column({ name: "memo" })
  public memo: string;

  @Column({ name: "permissions", array: true })
  public permission: string[];

  @ManyToOne((type) => Member, (photo) => photo.apiKeys)
  public member: Member;

  @CreateDateColumn({ name: "created_at" })
  public createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  public updatedAt: Date;

}
