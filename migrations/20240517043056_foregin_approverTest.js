/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function up(knex) {
  return knex.schema.alterTable("approverTest", function (table) {
    // table
    //   .foreign("departmentId")
    //   .references("id")
    //   .inTable("departments")
    //   .onDelete("NO ACTION")
    //   .onUpdate("CASCADE");
    // table
    //   .foreign("userId")
    //   .references("id")
    //   .inTable("users")
    //   .onUpdate("cascade")
    //   .onDelete("NO ACTION");
  });
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function down(knex) {
  return knex.schema.alterTable("approverTest", function (table) {
    // table.dropForeign(["departmentId"]);
    // table.dropForeign(["userId"]);
  });
}
