/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function up(knex) {
  return knex.schema.alterTable("approvers2", function (table) {
    // table
    //   .foreign("department_id")
    //   .references("id")
    //   .inTable("departments")
    //   .onDelete("NO ACTION")
    //   .onUpdate("NO ACTION");
    // table
    //   .foreign("approval_hierarchy_id")
    //   .references("id")
    //   .inTable("approval_hierarchy")
    //   .onDelete("NO ACTION")
    //   .onUpdate("NO ACTION");
  });
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function down(knex) {
  return knex.schema.alterTable("approvers2", function (table) {
    // table.dropForeign(["department_id"]);
    // table.dropForeign(["approval_hierarchy_id"]);
  });
}
