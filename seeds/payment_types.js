/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function seed(knex) {
  // Deletes ALL existing entries
  await knex.raw("SET FOREIGN_KEY_CHECKS = 0");
  await knex("payment_types").del();
  await knex("payment_types").insert([
    {
      id: 1,
      code: "E",
      name: "Cash Payment",
      status: "1",
      modifiedBy: null,
    },
    {
      id: 2,
      code: "C",
      name: "Cheque",
      status: "1",
      modifiedBy: null,
    },
    {
      id: 6,
      code: "T",
      name: "Bank Transfer",
      status: "1",
      modifiedBy: null,
    },
  ]);
}
