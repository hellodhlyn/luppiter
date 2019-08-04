import {
  BaseEntity, BeforeInsert, Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import uuidv4 from "uuid";

import { DockerClient } from "../../libs/docker";
import { Member } from "../auth/member";
import { CloudContainerHistory } from "./history";

@Entity({ name: "cloud_container_tasks" })
export class CloudContainerTask extends BaseEntity {

  @PrimaryGeneratedColumn()
  public id: number;

  @Column({ name: "uuid" })
  public uuid: string;

  @ManyToOne(() => Member)
  @JoinColumn({ name: "member_id" })
  public member: Member;

  @Column({ name: "name" })
  public name: string;

  @Column({ name: "docker_image" })
  public dockerImage: string;

  @Column({ name: "docker_commands", type: "varchar", array: true })
  public dockerCommands: string[];

  /**
   * Array of environment variables.
   *   { "KEY1=VALUE1", "KEY2=VALUE2", ... }
   */
  @Column({ name: "docker_envs", type: "varchar", array: true })
  public dockerEnvs: string[];

  @OneToMany(() => CloudContainerHistory, (history) => history.task)
  public histories: CloudContainerHistory[];

  @CreateDateColumn({ name: "created_at" })
  public createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  public updatedAt: Date;

  @BeforeInsert()
  public setUuid() {
    this.uuid = uuidv4();
  }

  public toJson() {
    return {
      uuid: this.uuid,
      name: this.name,
      image: this.dockerImage,
      commands: this.dockerCommands,
      envs: this.dockerEnvs,
      createdAt: this.createdAt.toISOString(),
    };
  }

  public async run(envs?: string[]): Promise<CloudContainerHistory> {
    // Set environment variables.
    const envsMap = new Map();
    this.dockerEnvs
      .map((env) => env.split("="))
      .forEach((split) => envsMap.set(split[0], split[1]));

    (envs || [])
      .map((env) => env.split("="))
      .forEach((split) => envsMap.set(split[0], split[1]));

    const mergedEnvs: string[] = [];
    envsMap.forEach((v, k) => mergedEnvs.push(`${k}=${v}`));

    // Download docker image.
    const docker = DockerClient.getInstance();
    const image = docker.getImage(this.dockerImage);
    if (!image) {
      await docker.pull(this.dockerImage, {});
    }

    // Start container.
    const container = await docker.createContainer({
      Image: this.dockerImage,
      Cmd: this.dockerCommands.length > 0 ? this.dockerCommands : null,
      Env: mergedEnvs.length > 0 ? mergedEnvs : null,
    });

    const history = new CloudContainerHistory();
    history.task = this;
    history.containerId = container.id;
    await history.save();

    await container.start();
    return history;
  }

}
