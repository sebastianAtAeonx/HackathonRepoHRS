/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function up (knex) {
  return knex.schema.createTable("apis", function (table) {
    table.increments("id").primary();
    table.string("name", 255).nullable();
    table.string("username", 100).nullable();
    table.string("password", 150).nullable();
    table.text("clientId");
    table.text("clientSecret");
    table.text("grantType");
    table.text("apiKey");
    table.text("secretKey");
    table.text("url");
    table.text("authorization");
    table.text("apiVersion");
    table.enu("status", ["1", "0"]).defaultTo("1");
    table.string("modifiedBy",255).nullable();
    table.timestamp("createdAt").defaultTo(knex.fn.now());
    table
      .timestamp("updatedAt")
      .defaultTo(knex.raw("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"));
  });
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function down (knex) {
  return knex.schema.dropTableIfExists("apis");
}
