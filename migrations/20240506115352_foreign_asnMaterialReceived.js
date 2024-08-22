/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function up (knex) {
  return knex.schema.alterTable("asnMaterialReceived", function (table) {
    table
      .foreign("giId")
      .references("id")
      .inTable("gis")
      .onDelete("NO ACTION")
      .onUpdate("NO ACTION");
    table
      .foreign("grnId")
      .references("id")
      .inTable("grns")
      .onDelete("NO ACTION")
      .onUpdate("NO ACTION");
    table
      .foreign("storageLocation")
      .references("id")
      .inTable("storage_locations")
      .onDelete("NO ACTION")
      .onUpdate("NO ACTION");
  });
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function down (knex) {
  return knex.schema.alterTable("asnMaterialReceived", function (table) {
    table.dropForeign("giId");
    table.dropForeign("grnId");
    table.dropForeign("storageLocation");
  });
}
