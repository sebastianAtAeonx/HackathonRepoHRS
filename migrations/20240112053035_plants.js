/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function up (knex) {
  return knex.schema.createTable("plants", function (table) {
    table.uuid("id").primary();
    table.string("code", 255).notNullable();
    table.string("name", 255);
    table.string("street", 255).notNullable();
    table.string("po_box", 255).notNullable();
    table.string("postal_code", 255).notNullable();
    table.string("city", 255).notNullable();
    table.string("country_key", 255).notNullable();
    table.string("state_code", 255).notNullable();
    table.integer("company_code", 10).unsigned().notNullable().defaultTo(0);
    table.enum("status", ["1", "0"]).notNullable().defaultTo("1");
    table.string("modifiedBy",255).nullable();
    table.timestamp("created_at").defaultTo(knex.fn.now()).notNullable();
    table
      .timestamp("updated_at")
      .defaultTo(knex.raw("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"));

    // Foreign key constraint
    //table.foreign('company_code').references('id').inTable('companies');
  });
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function down (knex) {
  return knex.schema.dropTable("plants");
}
