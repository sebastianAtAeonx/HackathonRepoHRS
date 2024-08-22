/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function up (knex) {
  return knex.schema.createTable("subscriber_details", function (table) {
    table.increments("id").primary();
    table.integer("subscriber_id", 10).unsigned().notNullable();
    table.text("logo").notNullable();
    table.text("half_logo").notNullable();
    table.text("favicon").notNullable();
    table.integer("approver_hierarchy_level").nullable();
    table.string("modifiedBy",255).nullable();
    table.timestamp("created_at").notNullable().defaultTo(knex.fn.now());
    table
      .timestamp("updated_at")
      .notNullable()
      .defaultTo(knex.raw("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"));

    // Foreign key constraint
    //table.foreign('subscriber_id').references('id').inTable('subscribers').onDelete('CASCADE').onUpdate('CASCADE');

    // Index
    table.unique("approver_hierarchy_level");
  });
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function down (knex) {
  return knex.schema.dropTable("subscriber_details");
}
