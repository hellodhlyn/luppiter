import { expect } from "chai";

import { ApiKey } from "../../../src/models/auth/api_key";
import { Permission } from "../../../src/models/auth/permission";

describe("ApiKey#hasPermission()", () => {
  [
    { target: "Storage::Read", permission: "Storage::Read", expected: true },
    { target: "Storage::Read", permission: "Storage::Read::Specific", expected: false },
    { target: "Storage::Read", permission: "Storage::Write", expected: false },
    { target: "Storage::Read", permission: "Storage::*", expected: true },
    { target: "Storage::Read", permission: "*", expected: true },
  ].forEach((each) => {
    it(`${each.permission} has ${each.target}?`, () => {
      const permission = new Permission();
      permission.key = each.permission;

      const apiKey = new ApiKey();
      apiKey.permissions = [ permission ];

      expect(apiKey.hasPermission(each.target)).to.equal(each.expected);
    });
  });
});
