/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function seed (knex) {
  // Deletes ALL existing entries
  await knex.raw("SET FOREIGN_KEY_CHECKS = 0");
  return knex("users_roles")
    .del()
    .then(function () {
      // Inserts seed entries
      return knex("users_roles").insert([
        {
          id: 3,
          role_name: "Approver",
          status: "1",
          approver_level: 4,
        },
        {
          id: 6,
          role_name: "Supplier",
          status: "1",
          approver_level: null,
        },
        {
          id: 7,
          role_name: "Admin",
          status: "1",
          approver_level: null,
        },
        {
          id: 9,
          role_name: "sapuser",
          status: "1",
          approver_level: null,
        },
        {
          id: 23,
          role_name: "Security Executive",
          status: "1",
          approver_level: null,
        },
        {
          id: 25,
          role_name: "Store Keeper",
          status: "1",
          approver_level: null,
        },
        {
          id: 26,
          role_name: "Quality Incharge",
          status: "1",
          approver_level: null,
        },
        {
          id: 27,
          role_name: "Service Department User",
          status: "1",
          approver_level: null,
        },
        {
          id: 28,
          role_name: "Accounts Executive",
          status: "1",
          approver_level: null,
        },
        {
          id: 77,
          role_name: "Source",
          status: "1",
          approver_level: null,
        },
        {
          id: 80,
          role_name: "Developer",
          status: "1",
          approver_level: null,
        },
        {
          id: 119,
          role_name: "SuperAdmin",
          status: "1",
          approver_level: null,
        },
        // Add more sample entries as needed
      ]);
    });
}
