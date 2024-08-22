/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function seed (knex) {
  // Deletes ALL existing entries
  await knex.raw("SET FOREIGN_KEY_CHECKS = 0");
  await knex("business_types").del();
  await knex("business_types").insert([
    {
      id: 34,
      name: "General Partnership",
      status: "1",
      modifiedBy: null,
    },
    {
      id: 35,
      name: "Sole Proprietorships",
      status: "1",
      modifiedBy: null,
    },
    {
      id: 36,
      name: "Limited Liability Company (LLC) ",
      status: "1",
      modifiedBy: null,
    },
    {
      id: 37,
      name: "Corporations",
      status: "1",
      modifiedBy: null,
    },
  ]);
}
