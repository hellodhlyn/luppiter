import { ChildEntity } from "typeorm";

import HostingBackend from "../backend";

@ChildEntity()
export default class LuppiterStorageBackend extends HostingBackend {
  private bucketNameKey = "bucketName";
  private filePrefixKey = "filePrefix";

  get bucketName(): string {
    return this.getProperty(this.bucketNameKey);
  }

  set bucketName(name: string) {
    this.setProperty(this.bucketNameKey, name);
  }

  get filePrefix(): string {
    return this.getProperty(this.filePrefixKey);
  }

  set filePrefix(prefix: string) {
    this.setProperty(this.filePrefixKey, prefix);
  }
}
