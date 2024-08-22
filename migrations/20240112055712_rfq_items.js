/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function up (knex) {
  return knex.schema.createTable("rfq_items", function (table) {
    table.increments("id").primary();
    table.integer("rfq_id", 10).unsigned().notNullable();
    table.integer("item_id").notNullable();
    table.integer("qty").notNullable();
    table.uuid("unit_id").notNullable().defaultTo("");
    table.enum("status", ["1", "0"]).notNullable().defaultTo("1");
    table.string("quotation", 255);
    table.string("modifiedBy",255).nullable();
    table.datetime("created_at").notNullable().defaultTo(knex.fn.now());
    table
      .datetime("updated_at")
      .notNullable()
      .defaultTo(knex.raw("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"));

    // Foreign key constraint
    //table.foreign('rfq_id').references('id').inTable('request_for_quotations').onDelete('CASCADE').onUpdate('CASCADE');
  });
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function down (knex) {
  return knex.schema.dropTable("rfq_items");
}
