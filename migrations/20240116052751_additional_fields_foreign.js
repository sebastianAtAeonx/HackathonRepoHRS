/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function up (knex) {
  return knex.schema.alterTable("additional_fields", function (table) {
    table
      .foreign("subscriber_id")
      .references("id")
      .inTable("subscribers")
      .onDelete("CASCADE")
      .onUpdate("CASCADE");
  });
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function down (knex) {
  return knex.schema.alterTable("additional_fields", function (table) {
    table.dropForeign(["subscriber_id"]);
    table.dropColumn("subscriber_id");
  });
}
