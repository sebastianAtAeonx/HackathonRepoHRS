/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function up(knex) {
  return knex.schema.createTable("storage_locations", function (table) {
    table.increments("id").primary();
    table.string("code", 4).notNullable();
    table.string("name", 255).notNullable();
    table.string("description", 255).notNullable();
    table.string("plantId", 36).nullable();
    table
      .enum("status", ["1", "0"])
      .collate("utf8mb4_general_ci")
      .notNullable()
      .defaultTo("1");
    table.string("modifiedBy", 255).nullable();
    table.timestamp("created_at").notNullable().defaultTo(knex.fn.now());
    table
      .timestamp("updated_at")
      .notNullable()
      .defaultTo(knex.raw("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"));

    // Foreign key constraint
    //table.foreign('subscriber_id').references('id').inTable('subscribers').onDelete('CASCADE').onUpdate('CASCADE');
  });
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function down(knex) {
  return knex.schema.dropTable("storage_locations");
}
