/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function up (knex) {
  return knex.schema.createTable("logistics", function (table) {
    table.increments("id").primary();
    table.string("companyName", 255).nullable();
    table.string("contactPerson", 255).nullable();
    table.string("email", 255).nullable();
    table.string("phone", 255).nullable();
    table.string("location", 255).nullable();
    table.enu("status", ["0", "1"]).notNullable().defaultTo("1");
    table.string("modifiedBy",255).nullable();
    table.timestamp("created_at").notNullable().defaultTo(knex.fn.now());
    table
      .timestamp("updated_at")
      .notNullable()
      .defaultTo(knex.raw("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"));
  });
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function down (knex) {
  return knex.schema.dropTable("logistics");
}
