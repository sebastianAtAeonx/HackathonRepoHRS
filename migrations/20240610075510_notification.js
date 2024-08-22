/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function up(knex) {
  return knex.schema.createTable("notification", function (table) {
    table.increments("id").primary().unsigned();
    table.json("heading").notNullable();
    table.json("message").notNullable();
    table.enu("read", ["1", "0"]).notNullable().defaultTo("0");
    table.integer("modified_by").unsigned().nullable().defaultTo(null);
    table.timestamp("created_at").notNullable().defaultTo(knex.fn.now());
    table
      .timestamp("updated_at")
      .defaultTo(knex.raw("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"));
  });
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function down(knex) {
  return knex.schema.dropTable("notification");
}
