/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function up (knex) {
  return knex.schema.createTable("pr_services", function (table) {
    table.increments("id").primary();
    table.integer("pr_id", 10).unsigned().defaultTo(0);
    table.integer("service_id", 10).unsigned().defaultTo(0);
    table.uuid("unit_id");
    table
      .enum("status", ["draft", "submitted", "approved", "rejected"])
      .notNullable()
      .defaultTo("draft");
      table.string("modifiedBy",255).nullable();
    table.timestamp("created_at").defaultTo(knex.fn.now()).notNullable();
    table
      .timestamp("updated_at")
      .defaultTo(knex.raw("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"));

    // Foreign key constraints
    //table.foreign('pr_id').references('id').inTable('purchase_requisitions').onDelete('CASCADE').onUpdate('CASCADE');
    //table.foreign('service_id').references('id').inTable('services').onDelete('CASCADE').onUpdate('CASCADE');
  });
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function down (knex) {
  return knex.schema.dropTable("pr_services");
}
