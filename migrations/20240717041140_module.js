/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function up(knex) {
    return knex.schema.createTable('module', function(table) {
        table.increments('id').primary();
        table.string('name', 50).notNullable().defaultTo('');
        table.string('slug', 50).nullable().defaultTo(null);
        table.integer('parent_id').unsigned().nullable();
        table.timestamp("created_at").defaultTo(knex.fn.now()).nullable();
    table
      .timestamp("updated_at")
      .defaultTo(knex.raw("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"));
    
        table.foreign('parent_id').references('id').inTable('module').onUpdate('NO ACTION').onDelete('NO ACTION');
    
        table.index('parent_id', 'FK_module_module');
      });
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function down(knex) {
    return knex.schema.dropTable('module');
}
