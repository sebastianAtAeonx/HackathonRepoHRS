/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function up (knex) {
  return knex.schema.createTable("users_roles_permissions", function (table) {
    table.increments("id").unsigned().notNullable().primary();
    table.integer("role_id").unsigned().notNullable();
    table.integer("module_id").unsigned().notNullable();
    table.enum("readP", ["0", "1"]).notNullable().defaultTo("0");
    table.enum("createP", ["0", "1"]).notNullable().defaultTo("0");
    table.enum("updateP", ["0", "1"]).notNullable().defaultTo("0");
    table.enum("deleteP", ["0", "1"]).notNullable().defaultTo("0");
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
  return knex.schema.dropTable("users_roles_permissions");
}
