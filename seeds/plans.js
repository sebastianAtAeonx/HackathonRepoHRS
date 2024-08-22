/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function seed (knex) {
  // Deletes ALL existing entries
  await knex.raw("SET FOREIGN_KEY_CHECKS = 0");
  await knex("plans").del();
  await knex("plans").insert([
    {
      id: 1,
      title: "Pay as you go",
      description: "payment required to use software",
      status: "1",
    },
  ]);
}
