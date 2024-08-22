/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function seed (knex) {
  // Deletes ALL existing entries
  await knex.raw("SET FOREIGN_KEY_CHECKS = 0");
  await knex("subscribers").del();
  await knex("subscribers").insert([
    {
      id: 1,
      name: "Ashapura Enterprise",
      email: "admin@ashapura.com",
      phone: "1234567890",
      address:
        "Jeevan Udyog, No. 278, Dr Dadabhai Naoroji Rd, Building, Azad Maidan, Fort, Mumbai, Maharashtra 400001",
      plan_id: 1,
      status: "1",
    },
    {
      id: 2,
      name: "Aeonx Digital",
      email: "aeonx.digital@gmail.com",
      phone: "345678999",
      address: "bhuj",
      plan_id: 1,
      status: "1",
    },
  ]);
}
