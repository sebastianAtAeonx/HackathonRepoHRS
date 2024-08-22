/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function up (knex) {
  return knex.schema.alterTable("gst_addresses", function (table) {
    table.foreign("gst_id").references("id").inTable("gst_details");
    table.foreign("state_id").references("id").inTable("states");
  });
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function down (knex) {
  return knex.schema.alterTable("gst_addresses", function (table) {
    table.dropForeign(["gst_id"]);
    table.dropForeign(["state_id"]);
    table.dropColumn("gst_id");
    table.dropColumn("state_id");
  });
}
