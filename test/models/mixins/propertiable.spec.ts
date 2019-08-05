import { expect } from "chai";
import { encode, decode } from "@msgpack/msgpack";

import applyMixins from "../../../src/models/mixins/apply";
import Propertiable from "../../../src/models/mixins/propertiable";

class TestModel implements Propertiable {
  public properties: string;
  public loadProperties: () => void;
  public parsedProperties: { [key: string]: any };
  public getProperty: (key: string) => any;
  public setProperty: (key: string, value: any) => void;
}

function packed(obj: any): string {
  return "\\x" + Buffer.from(encode(obj)).toString("hex");
}

describe("Propertiable", () => {
  let model: TestModel;

  before(() => applyMixins(TestModel, [Propertiable]));
  beforeEach(() => {
    model = new TestModel();
  });

  context("#setProperty", () => {
    it("success", () => {
      model.setProperty("testKey", "testValue");
      model.setProperty("testKey2", "testValue2");
      expect(model.properties).to.equal(packed({ testKey: "testValue", testKey2: "testValue2" }));
    });
  });

  context("#getProperty", () => {
    beforeEach(() => model.setProperty("testKey", "testValue"));

    it("succees", () => {
      expect(model.getProperty("testKey")).to.equal("testValue");
    });
  });

  context("#loadProperties", () => {
    const obj = { testKey: "testValue", testKey2: "testValue2" };
    beforeEach(() => {
      model.properties = packed(obj);
    });

    it("success", () => {
      model.loadProperties();
      expect(model.parsedProperties).to.eql(obj);
    });
  });
});
