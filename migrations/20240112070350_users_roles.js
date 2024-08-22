/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function up (knex) {
  return knex.schema.createTable("users_roles", function (table) {
    table.increments("id").unsigned().notNullable().primary();
    table.string("role_name", 255).notNullable();
    table.enum("status", ["0", "1"]).notNullable().defaultTo("1");
    table.enum("approver_level", ["1", "2", "3", "4"]);
    table.string("modifiedBy",255).nullable();
    table.dateTime("created_at").defaultTo(knex.fn.now());
    table
      .dateTime("updated_at")
      .defaultTo(knex.raw("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"));
  });
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function down (knex) {
  return knex.schema.dropTable("users_roles");
}
