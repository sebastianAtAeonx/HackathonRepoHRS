/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function up (knex) {
  return knex.schema.createTable("gst_addresses", function (table) {
    table.increments("id").primary();
    table.integer("gst_id", 10).unsigned().notNullable().defaultTo(0);
    table.enu("is_primary", ["0", "1"]).notNullable();
    table.string("building_name", 128).notNullable();
    table.string("location", 128).notNullable();
    table.string("street_name", 50).notNullable();
    table.string("street_building_no", 50).notNullable();
    table.string("floor_no", 50).notNullable();
    table.integer("state_id", 10).unsigned().notNullable();
    table.string("lattitude", 125).notNullable();
    table.string("longitude", 125).notNullable();
    table.integer("pincode").notNullable();
    table.enu("status", ["0", "1"]).notNullable();
    table.string("district", 255).nullable();
    table.string("city", 255).nullable();
    table.string("modifiedBy",255).nullable();
    table.timestamp("created_at").notNullable().defaultTo(knex.fn.now());
    table
      .timestamp("updated_at")
      .notNullable()
      .defaultTo(knex.raw("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"));

    // table.foreign("gst_id").references("id").inTable("gst_details");
    // table.foreign("state_id").references("id").inTable("states");
  });
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function down (knex) {
  return knex.schema.dropTable("gst_addresses");
}
