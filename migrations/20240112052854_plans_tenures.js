/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function up (knex) {
  return knex.schema.createTable("plans_tenures", function (table) {
    table.uuid("id").primary();
    table.string("plan_id", 255).notNullable();
    table.string("tenure", 255).notNullable();
    table.string("months", 255).notNullable();
    table.double("price").notNullable().defaultTo(0);
    table.double("discounted_price").notNullable().defaultTo(0);
    table.enum("status", ["1", "0"]).notNullable().defaultTo("1");
    table.string("modifiedBy",255).nullable();
    table.timestamp("created_at").defaultTo(knex.fn.now()).notNullable();
    table
      .timestamp("updated_at")
      .defaultTo(knex.raw("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"));
  });
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function down (knex) {
  return knex.schema.dropTable("plans_tenures");
}
