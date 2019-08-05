import { ChildEntity } from "typeorm";

import HostingBackend from "../backend";

@ChildEntity()
export default class LuppiterStorageBackend extends HostingBackend {
  private bucketNameKey = "b";
  private filePrefixKey = "p";
  private redirectToIndexKey = "i";

  constructor() {
    super();
    this.type = "storage";
  }

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

  get redirectToIndex(): boolean {
    return this.getProperty(this.redirectToIndexKey);
  }

  set redirectToIndex(value: boolean) {
    this.setProperty(this.redirectToIndexKey, value);
  }
}
