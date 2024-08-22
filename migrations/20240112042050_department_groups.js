/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function up (knex) {
  return knex.schema.createTable("department_groups", function (table) {
    table.increments("id").primary();
    table.string("department_id", 36).notNullable();
    table.string("group_id", 36).notNullable();
    table.string("name", 255).notNullable();
    table.enum("status", ["1", "0"]).notNullable().defaultTo("1");
    table.string("modifiedBy",255).nullable();
    table.timestamp("created_at").nullable().defaultTo(knex.fn.now());
    table
      .timestamp("updated_at")
      .nullable()
      .defaultTo(knex.raw("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"));
    //table.foreign('department_id').references('id').inTable('departments');
    //table.foreign('group_id').references('id').inTable('groups');
  });
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function down (knex) {
  return knex.schema.dropTable("department_groups");
}
