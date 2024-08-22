/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function up(knex) {
  return knex.schema.alterTable("notification_recipients", function (table) {
    table
      .foreign("notification_id")
      .references("id")
      .inTable("notification")
      .onDelete("NO ACTION")
      .onUpdate("NO ACTION");

    table
      .foreign("user_id")
      .references("id")
      .inTable("users")
      .onUpdate("NO ACTION")
      .onDelete("NO ACTION");
  });
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function down(knex) {
  return knex.schema.alterTable("notification_recipients", function (table) {
    table.dropForeign(["notification_id"]);
    table.dropForeign(["user_id"]);
  });
}
