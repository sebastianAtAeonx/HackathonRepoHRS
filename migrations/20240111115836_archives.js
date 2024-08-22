/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function up (knex) {
  return knex.schema.createTable("archives", function (table) {
    table.increments("id").primary();
    table.string("file_key", 255).nullable();
    table.timestamp("deletion_time").nullable().defaultTo(knex.fn.now());
    table.string("archive_bucket", 255).nullable();
    table.string("original_bucket", 255).nullable();
    table.string("deleted_by", 100).nullable();
    table.text("reason");
    table.integer("user_id").nullable();
    table.string("modifiedBy",255).nullable();
    table.timestamp("created_at").nullable().defaultTo(knex.fn.now());
    table
      .timestamp("updated_at")
      .nullable()
      .defaultTo(knex.raw("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"));
  });
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function down (knex) {
  return knex.schema.dropTableIfExists("archives");
}
