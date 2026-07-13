import { rolePermissions } from "../src/bootstrap/bootstrap-core";

describe("default system role permissions", () => {
  it("allows cashier sales and returns without owner-only administration", () => {
    expect(rolePermissions.cashier).toEqual(expect.arrayContaining([
      "pos.access",
      "dashboard.view",
      "pos.sell",
      "invoices.view",
      "returns.view",
      "returns.create",
      "shifts.open",
      "shifts.close",
    ]));

    expect(rolePermissions.cashier).not.toEqual(expect.arrayContaining([
      "backup.manage",
      "license.manage",
      "settings.receipt.update",
      "closing.create",
      "reports.view",
      "users.manage",
    ]));
  });
});
