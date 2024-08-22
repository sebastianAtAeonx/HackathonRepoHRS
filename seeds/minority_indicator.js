/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function seed(knex) {
  // Deletes ALL existing entries
  await knex.raw("SET FOREIGN_KEY_CHECKS = 0");
  await knex("minority_indicator").del();
  await knex("minority_indicator").insert([
    {
      id: 1,
      min_ind: "MED",
      Description: "Medium Enterprise",
      modifiedBy: null,
    },
    {
      id: 2,
      min_ind: "MIC",
      Description: "Micro Enterprise",
      modifiedBy: null,
    },
    {
      id: 3,
      min_ind: "SML",
      Description: "Small Enterprise",
      modifiedBy: null,
    },
  ]);
}
