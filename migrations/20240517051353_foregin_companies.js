/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function up(knex) {
  return knex.schema.alterTable("companies", function (table) {
    // table
    //   .foreign("subscriber_id")
    //   .references("id")
    //   .inTable("subscribers")
    //   .onDelete("NO ACTION")
    //   .onUpdate("NO ACTION");
  });
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function down(knex) {
  return knex.schema.alterTable("companies", function (table) {
    // table.dropForeign(["subscriber_id"]);
  });
}
