/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function seed(knex) {
  // Deletes ALL existing entries
  await knex.raw("SET FOREIGN_KEY_CHECKS = 0");
  await knex("major_customer").del();
  await knex("major_customer").insert([
    {
      id: 1,
      name: "tata",
      modifiedBy: null,
    },
    {
      id: 2,
      name: "wipro",
      modifiedBy: null,
    },
    {
      id: 3,
      name: "reliance",
      modifiedBy: null,
    },
  ]);
}
