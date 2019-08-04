import {
  BaseEntity, BeforeInsert, Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import uuidv4 from "uuid";

import { CloudContainerTask } from "./task";

@Entity({ name: "cloud_container_histories" })
export class CloudContainerHistory extends BaseEntity {

  public get stdout(): Buffer {
    return Buffer.from(this.dbStdout.replace("\\x", ""), "hex");
  }

  public set stdout(src: Buffer) {
    this.dbStdout = "\\x" + src.toString("hex");
  }

  public get stderr(): Buffer {
    return Buffer.from(this.dbStderr.replace("\\x", ""), "hex");
  }

  public set stderr(src: Buffer) {
    this.dbStderr = "\\x" + src.toString("hex");
  }

  @PrimaryGeneratedColumn()
  public id: number;

  @Column({ name: "uuid" })
  public uuid: string;

  @ManyToOne(() => CloudContainerTask, (task) => task.histories)
  @JoinColumn({ name: "task_id" })
  public task: CloudContainerTask;

  @Column({ name: "container_id" })
  public containerId: string;

  @Column({ name: "exit_code" })
  public exitCode: string;

  @CreateDateColumn({ name: "terminated_at" })
  public terminatedAt: Date;

  @CreateDateColumn({ name: "created_at" })
  public createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  public updatedAt: Date;

  @Column({ name: "stdout", type: "bytea" })
  private dbStdout: string;

  @Column({ name: "stderr", type: "bytea" })
  private dbStderr: string;

  @BeforeInsert()
  public setUuid() {
    this.uuid = uuidv4();
  }

  public toJson() {
    return {
      uuid: this.uuid,
      exitCode: this.exitCode,
      terminatedAt: this.terminatedAt.toISOString(),
      createdAt: this.createdAt.toISOString(),
    };
  }

}
