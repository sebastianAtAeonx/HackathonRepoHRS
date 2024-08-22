/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function up (knex) {
  return knex.schema.alterTable("asnStatusTimeline", function (table) {
    table
      .foreign("asn_id")
      .references("id")
      .inTable("asns")
      .onDelete("NO ACTION")
      .onUpdate("NO ACTION");

    table
      .foreign("Cancel")
      .references("id")
      .inTable("users")
      .onDelete("NO ACTION")
      .onUpdate("NO ACTION");

    table
      .foreign("Invoiced")
      .references("id")
      .inTable("users")
      .onDelete("NO ACTION")
      .onUpdate("NO ACTION");
    table
      .foreign("MaterialGateInward")
      .references("id")
      .inTable("users")
      .onDelete("NO ACTION")
      .onUpdate("NO ACTION");
    table
      .foreign("MaterialReceived")
      .references("id")
      .inTable("users")
      .onDelete("NO ACTION")
      .onUpdate("NO ACTION");
    table
      .foreign("QualityApproved")
      .references("id")
      .inTable("users")
      .onDelete("NO ACTION")
      .onUpdate("NO ACTION");
  });
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function down (knex) {
  return knex.schema.alterTable("asnStatusTimeline", function (table) {
    table.dropForeign("asn_id");
    table.dropForeign("Cancel");
    table.dropForeign("Invoiced");
    table.dropForeign("MaterialGateInward");
    table.dropForeign("MaterialReceived");
    table.dropForeign("QualityApproved");
  });
}
