/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function up (knex) {
  return knex.schema.alterTable("pr_services", function (table) {
    table
      .foreign("pr_id")
      .references("id")
      .inTable("purchase_requisitions")
      .onDelete("CASCADE")
      .onUpdate("CASCADE");
    table
      .foreign("service_id")
      .references("id")
      .inTable("services")
      .onDelete("CASCADE")
      .onUpdate("CASCADE");
  });
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function down (knex) {
  return knex.schema.alterTable("pr_services", function (table) {
    table.dropForeign(["pr_id"]);
    table.dropForeign(["service_id"]);
    table.dropColumn("pr_id");
    table.dropColumn("service_id");
  });
}
