import {
  BaseEntity, Column, CreateDateColumn, Entity, JoinColumn, JoinTable, ManyToMany, ManyToOne,
  PrimaryGeneratedColumn, UpdateDateColumn,
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
  @JoinTable({ name: "api_key_permission_relations", joinColumn: { name: "api_key_id" } })
  public permissions: Permission[];

  @ManyToOne((type) => Member, (photo) => photo.apiKeys)
  @JoinColumn({ name: "member_id" })
  public member: Member;

  @CreateDateColumn({ name: "created_at" })
  public createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  public updatedAt: Date;

  public hasPermission(target: string): boolean {
    const targetNs = target.split('::');
    for (let i = 0; i < this.permissions.length; i += 1) {
      const permission = this.permissions[i].key;
      if (permission === target) {
        return true;
      }

      const permissionNs = permission.split("::");
      for (let j = 0; j < Math.min(targetNs.length, permissionNs.length); j += 1) {
        if (permissionNs[j] === "*") {
          return true;
        }

        if (targetNs[j] !== permissionNs[j]) {
          break;
        }
      }
    }
    
    return false;
  }

  public toJson(): object {
    return {
      key: this.key,
      memo: this.memo,
      permissions: (this.permissions || []).map((p) => p.toJson()),
      createdAt: this.createdAt.toISOString(),
    };
  }

}
