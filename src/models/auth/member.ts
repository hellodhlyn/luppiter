import {
  BaseEntity, Column, CreateDateColumn, Entity, Index, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn,
} from "typeorm";

import { ApiKey } from "./api_key";

@Entity({ name: "members" })
export class Member extends BaseEntity {

  @PrimaryGeneratedColumn()
  public id: number;

  @Column({ name: "uuid" })
  @Index({ unique: true })
  public uuid: string;

  @OneToMany(() => ApiKey, (key) => key.member)
  public apiKeys: ApiKey[];

  @CreateDateColumn({ name: "created_at" })
  public createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  public updatedAt: Date;

}
