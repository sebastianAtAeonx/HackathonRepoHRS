/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function seed(knex) {
  // Deletes ALL existing entries
  await knex.raw("SET FOREIGN_KEY_CHECKS = 0");
  await knex("company_source").del();
  await knex("company_source").insert([
    {
      id: 1,
      name: "Aeonx website",
      email: "aeonx.digital@gmail.com",
      password: "1234",
      status: "1",
      modifiedBy: null,
    },
    {
      id: 2,
      name: "News article",
      email: "news@today.com",
      password: "1116",
      status: "1",
      modifiedBy: null,
    },
  ]);
}
