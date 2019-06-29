import {
  BaseEntity, Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn,
} from "typeorm";
import { Member } from "../auth/member";

@Entity({ name: "storage_buckets" })
export class StorageBucket extends BaseEntity {

  @PrimaryGeneratedColumn()
  public id: number;

  @ManyToOne((type) => Member)
  @JoinColumn({ name: "member_id" })
  public member: Member;

  @Column({ name: "name" })
  public name: string;

  @Column({ name: "is_public" })
  public isPublic: boolean;

  @CreateDateColumn({ name: "created_at" })
  public createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  public updatedAt: Date;

  public toJson(): object {
    return {
      name: this.name,
      isPublic: this.isPublic,
    };
  }

}
