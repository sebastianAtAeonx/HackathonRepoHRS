/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function up(knex) {
    return knex.schema.createTable('role', function(table) {
        table.increments('id').primary();
        table.string('name', 50).nullable().defaultTo(null);
        table.string('slug', 50).nullable().defaultTo(null);
        table.boolean('status').nullable().defaultTo(1);
        table.timestamp("created_at").defaultTo(knex.fn.now()).nullable();
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
    return knex.schema.dropTable('role');
}
