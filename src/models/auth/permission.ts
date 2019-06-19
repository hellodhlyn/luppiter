import {
  BaseEntity, Column, CreateDateColumn, Entity, Index, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn,
} from "typeorm";

@Entity({ name: "permissions" })
export class Permission extends BaseEntity {

  @PrimaryGeneratedColumn()
  public id: number;

  @Column({ name: "key" })
  @Index({ unique: true })
  public key: string;

  @CreateDateColumn({ name: "created_at" })
  public createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  public updatedAt: Date;

}
