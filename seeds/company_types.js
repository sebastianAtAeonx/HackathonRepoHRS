/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function seed (knex) {
  // Deletes ALL existing entries
  await knex.raw("SET FOREIGN_KEY_CHECKS = 0");
  await knex("company_types").del();
  await knex("company_types").insert([
    {
      id: 32,
      name: "Corporation",
      status: "1",
      modifiedBy: null,
    },
    {
      id: 33,
      name: "Private Limited Company",
      status: "1",
      modifiedBy: null,
    },
    {
      id: 34,
      name: "Public Limited Company",
      status: "1",
      modifiedBy: null,
    },
    {
      id: 35,
      name: "NGO",
      status: "1",
      modifiedBy: null,
    },
    {
      id: 36,
      name: "Unlisted Company",
      status: "1",
      modifiedBy: null,
    },
  ]);
}
