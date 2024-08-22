/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function seed(knex) {
  // Deletes ALL existing entries
  await knex.raw("SET FOREIGN_KEY_CHECKS = 0");
  await knex("sapConfiguration").del();
  await knex("sapConfiguration").insert([
    {
      id: 1,
      name: "sapCreds",
      url: null,
      tokenPath: null,
      username: null,
      password: null,
      authentication: null,
      ip: null,
      client: null,
      cookie: null,
      status: "1",
      modifiedBy: null,
    },
    {
      id: 2,
      name: "sap-fetchPoList",
      url: null,
      tokenPath: null,
      username: null,
      password: null,
      authentication: null,
      ip: null,
      client: null,
      cookie: null,
      status: "1",
      modifiedBy: null,
    },
    {
      id: 3,
      name: "sap-fetchPoDetails",
      url: null,
      tokenPath: null,
      username: null,
      password: null,
      authentication: null,
      ip: null,
      client: null,
      cookie: null,
      status: "1",
      modifiedBy: null,
    },
    {
      id: 4,
      name: "sap-createCSRFToken",
      url: null,
      tokenPath: null,
      username: null,
      password: null,
      authentication: null,
      ip: null,
      client: null,
      cookie: null,
      status: "1",
      modifiedBy: null,
    },
  ]);
}
