/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function up (knex) {
  return knex.schema.alterTable("subscribers", function (table) {
    table
      .foreign("plan_id")
      .references("id")
      .inTable("plans")
      .onDelete("CASCADE")
      .onUpdate("CASCADE");
  });
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function down (knex) {
  return knex.schema.alterTable("subscribers", function (table) {
    table.dropForeign(["plan_id"]);
    table.dropColumn("plan_id");
  });
}
