/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function up (knex) {
  return knex.schema.alterTable("scrStatusTimeline", function (table) {
    table
      .foreign("asn_id")
      .references("id")
      .inTable("asns")
      .onUpdate("NO ACTION")
      .onDelete("NO ACTION");
    table
      .foreign("accepted")
      .references("id")
      .inTable("users")
      .onUpdate("NO ACTION")
      .onDelete("NO ACTION");
    table
      .foreign("Cancel")
      .references("id")
      .inTable("users")
      .onUpdate("NO ACTION")
      .onDelete("NO ACTION");
    table
      .foreign("Invoiced")
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
export function down (knex) {
  return knex.schema.alterTable("scrStatusTimeline", function (table) {
    table.dropForeign("asn_id");
    table.dropForeign("accepted");
    table.dropForeign("Cancel");
    table.dropForeign("Invoiced");
  });
}
