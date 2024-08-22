/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function up(knex) {
  return knex.schema.alterTable("asns", function (table) {
    // table
    //   .foreign("departmentId")
    //   .references("id")
    //   .inTable("departments")
    //   .onDelete("NO ACTION")
    //   .onUpdate("CASCADE");
    table
      .foreign("grnId")
      .references("id")
      .inTable("grns")
      .onDelete("NO ACTION")
      .onUpdate("CASCADE");
    table
      .foreign("giId")
      .references("id")
      .inTable("gis")
      .onDelete("NO ACTION")
      .onUpdate("No ACTION");

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
export function down(knex) {
  return knex.schema.alterTable("asns", function (table) {
    table.dropForeign("grnId");
    table.dropForeign("giId");
    table.dropForeign("storageLocation");
  });
}
