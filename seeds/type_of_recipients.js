/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function seed(knex) {
  // Deletes ALL existing entries
  await knex.raw("SET FOREIGN_KEY_CHECKS = 0");
  await knex("type_of_recipients").del();
  await knex("type_of_recipients").insert([
    {
      id: 1,
      name: "CO",
      code: "CO",
      status: "1",
      modifiedBy: null,
    },
    {
      id: 2,
      name: "OT",
      code: "OT",
      status: "1",
      modifiedBy: null,
    },
  ]);
}
