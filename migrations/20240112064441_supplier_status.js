/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function up (knex) {
  return knex.schema.createTable("supplier_status", function (table) {
    table.increments("id").primary();
    table.uuid("supplier_id").nullable();
    table.integer("user_id", 10).unsigned().notNullable().defaultTo(0);
    table.string("status", 50).nullable();
    table.string("level1status", 50).nullable();
    table.string("level2status", 50).nullable();
    table.text("comment").nullable();
    table.integer("approver_level").nullable();
    table.string("modifiedBy",255).nullable();
    table.timestamp("created_at").defaultTo(knex.fn.now());
    table
      .timestamp("updated_at")
      .defaultTo(knex.raw("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"));
    //table.foreign('supplier_id').references('id').inTable('supplier_details');
    //table.foreign('user_id').references('id').inTable('users');
  });
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function down (knex) {
  return knex.schema.dropTable("supplier_status");
}
