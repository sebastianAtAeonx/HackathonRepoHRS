/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function seed (knex) {
  // Deletes ALL existing entries
  await knex.raw("SET FOREIGN_KEY_CHECKS = 0");
  await knex("modules").del();
  await knex("modules").insert([
    { id: 1, module_key: "Dashboards", status: "1" },
    { id: 4, module_key: "Roles", status: "1" },
    { id: 11, module_key: "Supplier Statusupdate", status: "1" },
    { id: 15, module_key: "Storage Locations", status: "1" },
    { id: 16, module_key: "Administration", status: "1" },
    { id: 17, module_key: "Supplier", status: "1" },
    { id: 18, module_key: "Vendor Class", status: "1" },
    { id: 19, module_key: "Vendor Schema", status: "1" },
    { id: 20, module_key: "Purchase Group", status: "1" },
    { id: 21, module_key: "Reconciliation", status: "1" },
    { id: 22, module_key: "BusinessPartner Group", status: "1" },
    { id: 23, module_key: "Business Type", status: "1" },
    { id: 24, module_key: "Company Type", status: "1" },
    { id: 25, module_key: "Payment Type", status: "1" },
    { id: 26, module_key: "Payment Terms", status: "1" },
    { id: 27, module_key: "Tds", status: "1" },
    { id: 28, module_key: "Countries", status: "1" },
    { id: 29, module_key: "Currency", status: "1" },
    { id: 30, module_key: "Companies", status: "1" },
    { id: 31, module_key: "Units", status: "1" },
    { id: 32, module_key: "Material Group", status: "1" },
    { id: 33, module_key: "Materials", status: "1" },
    { id: 34, module_key: "Department", status: "1" },
    { id: 35, module_key: "Department Approver", status: "1" },
    { id: 36, module_key: "User", status: "1" },
    { id: 37, module_key: "Approval Level", status: "1" },
    { id: 38, module_key: "Invoice", status: "1" },
    { id: 39, module_key: "Plants", status: "1" },
    { id: 40, module_key: "Purchase Order", status: "1" },
    { id: 41, module_key: "Asns", status: "1" },
    { id: 42, module_key: "Scan Qrcode", status: "1" },
    { id: 55, module_key: "Subscriber", status: "1" },
    { id: 56, module_key: "Pr Items", status: "1" },
    { id: 57, module_key: "Pr Services", status: "1" },
    { id: 61, module_key: "Gate Inward", status: "1" },
    { id: 62, module_key: "Store Keeper", status: "1" },
    { id: 63, module_key: "Quality Incharge", status: "1" },
    { id: 64, module_key: "Test", status: "1" },
  ]);
}
