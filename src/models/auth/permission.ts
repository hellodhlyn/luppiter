import {
  BaseEntity, Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn,
} from "typeorm";

@Entity({ name: "permissions" })
export class Permission extends BaseEntity {

  public static async sync() {
    for (const key of this.keys) {
      if (!await Permission.findOne({ key })) {
        const newPermission = new Permission();
        newPermission.key = key;
        await newPermission.save();
      }
    }
  }

  private static keys = [
    "Storage::*", "Storage::Write", "Storage::Read",
    "Hosting::*", "Hosting::Write", "Hosting::Read",
    "Certs::*", "Certs::Write", "Certs::Read",
    "CloudContainer::*", "CloudContainer::Write", "CloudContainer::Read",
  ];

  @PrimaryGeneratedColumn()
  public id: number;

  @Column({ name: "key" })
  @Index({ unique: true })
  public key: string;

  @CreateDateColumn({ name: "created_at" })
  public createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  public updatedAt: Date;

  public toJson(): object {
    return { key: this.key };
  }

}
