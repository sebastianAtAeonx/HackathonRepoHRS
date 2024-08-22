/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function up (knex) {
  return knex.schema.alterTable("department_groups", function (table) {
    table
      .foreign("department_id")
      .references("id")
      .inTable("departments")
      .onDelete("NO ACTION")
      .onUpdate("NO ACTION");
  });
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function down (knex) {
  return knex.schema.alterTable("department_groups", function (table) {
    table.dropForeign(["department_id"]);
  });
}
