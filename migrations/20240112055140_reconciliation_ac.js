/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function up (knex) {
  return knex.schema.createTable("reconciliation_ac", function (table) {
    table.increments("id").primary();
    table.string("code", 50);
    table.string("name", 255);
    table.integer("company_id", 10).unsigned();
    table.text("co_names");
    table.string("modifiedBy",255).nullable();
    table.timestamp("created_at").defaultTo(knex.fn.now());
    table
      .timestamp("updated_at")
      .defaultTo(knex.raw("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"));
    table.enum("status", ["1", "0"]).notNullable().defaultTo("1");

    // Foreign key constraint
    // table
    //   .foreign("company_id")
    //   .references("id")
    //   .inTable("companies")
    //   .onDelete("CASCADE")
    //   .onUpdate("CASCADE");
  });
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function down (knex) {
  return knex.schema.dropTable("reconciliation_ac");
}
