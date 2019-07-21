import {
  AfterLoad, BaseEntity, Column, CreateDateColumn, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn,
  TableInheritance, UpdateDateColumn,
} from "typeorm";

import applyMixins from "../mixins/apply";
import Propertiable from "../mixins/propertiable";
import HostingInstance from "./instance";

@Entity({ name: "hosting_backends" })
@TableInheritance({ column: { name: "type", type: "varchar" } })
class HostingBackend extends BaseEntity {
  @PrimaryGeneratedColumn()
  public id: number;

  @Column({ name: "uuid" })
  public uuid: string;

  @Column({ name: "type" })
  public type: string;

  @OneToOne(() => HostingInstance)
  @JoinColumn({ name: "instance_id" })
  public instance: HostingInstance;

  @CreateDateColumn({ name: "created_at" })
  public createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  public updatedAt: Date;

  // Propertiable mixin
  @Column({ name: "properties", type: "bytea" })
  public properties: string;

  @AfterLoad()
  public loadProperties: () => void;

  public parsedProperties: { [key: string]: any };
  public getProperty: (key: string) => any;
  public setProperty: (key: string, value: any) => void;
}

applyMixins(HostingBackend, [Propertiable]);

export default HostingBackend;
