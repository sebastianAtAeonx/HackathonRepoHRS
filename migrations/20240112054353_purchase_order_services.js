/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function up (knex) {
  return knex.schema.createTable("purchase_order_services", function (table) {
    table.increments("id").primary();
    table.integer("po_id", 10).unsigned();
    table.integer("service_id");
    table.integer("rfq_id");
    table.uuid("unit_id");
    table.float("units");
    table.float("price");
    table.float("subtotal");
    table.enum("status", ["pending", "submitted", "approved", "rejected"]);
    table.string("modifiedBy",255).nullable();
    table.datetime("created_at").defaultTo(knex.fn.now());
    table
      .datetime("updated_at")
      .defaultTo(knex.raw("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"));

    // Foreign key constraint
    //table.foreign('po_id').references('id').inTable('purchase_orders').onDelete('CASCADE').onUpdate('CASCADE');
  });
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function down (knex) {
  return knex.schema.dropTable("purchase_order_services");
}
