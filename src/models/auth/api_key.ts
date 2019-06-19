import {
  BaseEntity, Column, CreateDateColumn, Entity, JoinTable, ManyToMany, ManyToOne, PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

import { Member } from "./member";
import { Permission } from "./permission";

@Entity({ name: "api_keys" })
export class ApiKey extends BaseEntity {

  @PrimaryGeneratedColumn()
  public id: number;

  @Column({ name: "key" })
  public key: string;

  @Column({ name: "memo" })
  public memo: string;

  @ManyToMany((type) => Permission)
  @JoinTable()
  public permissions: Permission[];

  @ManyToOne((type) => Member, (photo) => photo.apiKeys)
  public member: Member;

  @CreateDateColumn({ name: "created_at" })
  public createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  public updatedAt: Date;

}
