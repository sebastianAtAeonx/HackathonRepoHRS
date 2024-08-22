/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function up (knex) {
  return knex.schema.createTable("currencies", function (table) {
    table.increments("id").primary();
    table.string("country_key").nullable();
    table.string("code", 45).notNullable();
    table.string("name", 45).notNullable();
    table.string("symbol", 45).notNullable();
    table.string("position", 45).notNullable();
    table.enum("is_deletable", ["1", "0"]).notNullable().defaultTo("1");
    table.string("modifiedBy",255).nullable();
    table.timestamp("created_at").notNullable().defaultTo(knex.fn.now());
    table
      .timestamp("updated_at")
      .notNullable()
      .defaultTo(knex.raw("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"));
    table.enum("status", ["1", "0"]).defaultTo("1");
    //table.foreign("country_key").references("country_key").inTable("countries");
  });
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function down (knex) {
  return knex.schema.dropTable("currencies");
}
