/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function seed (knex) {
  // Deletes ALL existing entries
  await knex.raw("SET FOREIGN_KEY_CHECKS = 0");
  return knex("users")
    .del()
    .then(function () {
      // Inserts seed entries
      return knex("users").insert([
        {
          id: 1,
          username: "AdminDev",
          firstname: "Admin",
          subscriber_id: 1,
          lastname: "Admin",
          email: "admin@gmail.com",
          password: "2b2f71120be36cbd0b358fab62b1b5e9",
          status: 1,
          role: 7,
        },
        // Add more sample entries as needed
      ]);
    });
}
