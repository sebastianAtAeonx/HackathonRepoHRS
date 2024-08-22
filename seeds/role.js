/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function seed(knex) {
  // Deletes ALL existing entries
  await knex.raw("SET FOREIGN_KEY_CHECKS = 0");
  await knex("role").del();
  await knex("role").insert([
    {
      id: 1,
      name: "Admin",
      slug: "Admin",
      status: 1,
    },
    {
      id: 15,
      name: "Supplier",
      slug: "Supplier",
      status: 1,
    },
    {
      id: 16,
      name: "Approver",
      slug: "Approver",
      status: 1,
    },
    {
      id: 21,
      name: "sapuser",
      slug: null,
      status: 1,
    },
    {
      id: 22,
      name: "Security Executive",
      slug: null,
      status: 1,
    },
    {
      id: 23,
      name: "Store Keeper",
      slug: null,
      status: 1,
    },
    {
      id: 24,
      name: "Quality Incharge",
      slug: null,
      status: 1,
    },
    {
      id: 25,
      name: "Service Department User",
      slug: null,
      status: 1,
    },
    {
      id: 26,
      name: "Accounts Executive",
      slug: null,
      status: 1,
    },
  ]);
}
