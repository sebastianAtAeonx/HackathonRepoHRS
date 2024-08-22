/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function up (knex) {
  return knex.schema.createTable("services", function (table) {
    table.increments("id").primary();
    table.string("code", 50).notNullable();
    table.string("name", 50).notNullable();
    table.text("description").notNullable();
    table.float("price").notNullable();
    table.enum("status", ["0", "1"]).notNullable().defaultTo("1");
    table.enum("is_recursive", ["0", "1"]).defaultTo("0");
    table.enum("is_tax_included", ["0", "1"]).defaultTo("0");
    table.integer("recurring_days").defaultTo(null);
    table.float("cost_price").defaultTo(null);
    table.double("recurring_price").defaultTo(null);
    table.uuid("unit_id");
    table.string("modifiedBy",255).nullable();
    table.datetime("created_at").notNullable().defaultTo(knex.fn.now());
    table
      .datetime("updated_at")
      .notNullable()
      .defaultTo(knex.raw("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"));
  });
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function down (knex) {
  return knex.schema.dropTable("services");
}
