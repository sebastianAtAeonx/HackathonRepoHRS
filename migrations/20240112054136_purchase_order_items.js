/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function up (knex) {
  return knex.schema.createTable("purchase_order_items", function (table) {
    table.increments("id").primary();
    table.integer("po_id", 10).unsigned().notNullable();
    table.integer("item_id").notNullable();
    table.integer("qty").notNullable();
    table.float("price").notNullable();
    table.integer("unit_id").notNullable().defaultTo(0);
    table.float("subtotal").notNullable();
    table
      .enum("status", [
        "pending",
        "processing",
        "shipped",
        "delivered",
        "cancelled",
        "returned",
        "refunded",
        "onhold",
        "backordered",
        "pending_review",
        "fraud_alert",
        "payment_failed",
        "partially_shipped",
        "processing_delayed",
        "out_for_delivery",
        "failed_delivery_attempt",
        "awaiting_pickup",
      ])
      .collate("utf8mb4_general_ci")
      .notNullable();
      table.string("modifiedBy",255).nullable();
    table.datetime("created_at").notNullable().defaultTo(knex.fn.now());
    table
      .datetime("updated_at")
      .notNullable()
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
  return knex.schema.dropTable("purchase_order_items");
}
