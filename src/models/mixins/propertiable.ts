import { decode, encode } from "@msgpack/msgpack";
import { AfterLoad, Column } from "typeorm";

export default class Propertiable {
  public parsedProperties: { [key: string]: any };

  @Column({ name: "properties", type: "bytea" })
  public properties: string;

  @AfterLoad()
  public loadProperties() {
    this.parsedProperties = decode(Buffer.from(this.properties.replace("\\x", ""), "hex")) as object;
  }

  public getProperty(key: string): any {
    return this.parsedProperties[key];
  }

  public setProperty(key: string, value: any) {
    this.parsedProperties = this.parsedProperties || {};
    this.parsedProperties[key] = value;
    this.properties = "\\x" + Buffer.from(encode(this.parsedProperties)).toString("hex");
  }
}
