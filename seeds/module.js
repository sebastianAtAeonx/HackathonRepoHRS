/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function seed(knex) {
  // Deletes ALL existing entries
  await knex.raw("SET FOREIGN_KEY_CHECKS = 0");
  await knex("module").del();
  await knex("module").insert([
    {
      id: 36,
      name: "Dashboards",
      slug: "Dashboard",
      parent_id: null,
    },
    {
      id: 37,
      name: "Dashboard",
      slug: "Dashboard",
      parent_id: 36,
    },
    {
      id: 38,
      name: "Supplier Details",
      slug: "Supplier Details",
      parent_id: 36,
    },
    {
      id: 40,
      name: "Suppliers List",
      slug: "Suppliers List",
      parent_id: 36,
    },
    {
      id: 41,
      name: "Administration",
      slug: "Administration",
      parent_id: null,
    },
    {
      id: 42,
      name: "Masters",
      slug: "Masters",
      parent_id: 41,
    },
    {
      id: 43,
      name: "Form View",
      slug: "Form View",
      parent_id: 41,
    },
    {
      id: 44,
      name: "Roles & Permissions",
      slug: "Roles & Permissions",
      parent_id: 41,
    },
    {
      id: 45,
      name: "Logs",
      slug: "Logs",
      parent_id: 41,
    },
    {
      id: 46,
      name: "Compliance",
      slug: "Compliance",
      parent_id: null,
    },
    {
      id: 47,
      name: "Gst Compliance",
      slug: "Gst Compliance",
      parent_id: 46,
    },
    {
      id: 48,
      name: "Pan Compliance",
      slug: "Pan Compliance",
      parent_id: 46,
    },
    {
      id: 49,
      name: "Msme Compliance",
      slug: "Msme Compliance",
      parent_id: 46,
    },
    {
      id: 50,
      name: "Configurations",
      slug: "Configurations",
      parent_id: null,
    },
    {
      id: 51,
      name: "ASN Config",
      slug: "ASN Config",
      parent_id: 50,
    },
    {
      id: 52,
      name: "Migration",
      slug: "Migration",
      parent_id: 50,
    },
    {
      id: 53,
      name: "Form Field",
      slug: "Form Field",
      parent_id: 50,
    },
    {
      id: 54,
      name: "API Configuration",
      slug: "API Configuration",
      parent_id: 50,
    },
    {
      id: 55,
      name: "Third Party Counts",
      slug: "Third Party Counts",
      parent_id: 50,
    },
    {
      id: 56,
      name: "Source",
      slug: "Source",
      parent_id: null,
    },
    {
      id: 57,
      name: "Purchase Order",
      slug: "Purchase Order",
      parent_id: 56,
    },
    {
      id: 58,
      name: "Purchase Requisition",
      slug: "Purchase Requisition",
      parent_id: 56,
    },
    {
      id: 59,
      name: "ASN/SCR",
      slug: "ASN/SCR",
      parent_id: 56,
    },
    {
      id: 60,
      name: "Invoice",
      slug: "Invoice",
      parent_id: 56,
    },
    {
      id: 61,
      name: "Scan QR",
      slug: "Scan QR",
      parent_id: 56,
    },
    {
      id: 62,
      name: "Scanned History",
      slug: "Scanned History",
      parent_id: 56,
    },
    {
      id: 63,
      name: "Sap Invoice",
      slug: "Sap Invoice",
      parent_id: 56,
    },
    {
      id: 64,
      name: "GI List",
      slug: "GI List",
      parent_id: 56,
    },
  ]);
}
