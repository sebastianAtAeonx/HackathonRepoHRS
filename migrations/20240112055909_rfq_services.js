/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function up (knex) {
  return knex.schema.createTable("rfq_services", function (table) {
    table.increments("id").primary();
    table.integer("rfq_id", 10).unsigned().notNullable().defaultTo(0);
    table.integer("service_id", 10).unsigned().notNullable().defaultTo(0);
    table.uuid("unit_id");
    table
      .enum("status", ["draft", "submitted", "approved", "rejected"])
      .notNullable()
      .defaultTo("draft");
      table.string("modifiedBy",255).nullable();
    table.timestamp("created_at").notNullable().defaultTo(knex.fn.now());
    table
      .timestamp("updated_at")
      .notNullable()
      .defaultTo(knex.raw("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"));

    // Foreign key constraints
    // table.foreign("rfq_id").references("request_for_quotations.id");
    // table.foreign("service_id").references("services.id");
  });
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function down (knex) {
  return knex.schema.dropTable("rfq_services");
}
