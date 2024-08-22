/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function up (knex) {
  return knex.schema.alterTable("rfq_services", function (table) {
    table
      .foreign("rfq_id")
      .references("request_for_quotations.id")
      .onDelete("CASCADE")
      .onUpdate("CASCADE");
    table
      .foreign("service_id")
      .references("services.id")
      .onDelete("CASCADE")
      .onUpdate("CASCADE");
  });
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function down (knex) {
  return knex.schema.alterTable("rfq_services", function (table) {
    table.dropForeign(["rfq_id"]);
    table.dropForeign(["service_id"]);
    table.dropColumn("rfq_id");
    table.dropColumn("service_id");
  });
}
