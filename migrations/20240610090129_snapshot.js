/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function up(knex) {
  return knex.schema.createTable("snapShot", function (table) {
    table.increments("id").primary();
    table
      .string("table", 150)
      .nullable()
      .collate("utf8mb3_general_ci")
      .defaultTo(null);
    table
      .string("tableId", 150)
      .nullable()
      .collate("utf8mb3_general_ci")
      .defaultTo(null);
    table
      .text("oldData")
      .nullable()
      .collate("utf8mb3_general_ci")
      .defaultTo(null);
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
  return knex.schema.dropTable("snapShot");
}
