/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function up (knex) {
  return knex.schema.createTable("countries", function (table) {
    table.bigIncrements("id").primary();
    table.integer("country_id").notNullable().defaultTo(0);
    table.string("capital").notNullable();
    table.integer("currency_code").notNullable().defaultTo(0);
    table.string("domain", 50).notNullable().defaultTo("");
    table.string("emoji", 50).nullable();
    table.string("country_key", 50).nullable();
    table.string("iso3", 50).nullable();
    table.string("latitude", 50).nullable();
    table.string("longitude", 50).nullable();
    table.string("name", 50).nullable();
    table.string("native", 50).nullable();
    table.string("phonecode", 50).nullable();
    table.string("region", 50).nullable();
    table.string("subregion", 50).nullable();
    table.enum("status", ["1", "0"]).defaultTo("1");
    table.string("modifiedBy",255).nullable();
    table.timestamp("created_at").notNullable().defaultTo(knex.fn.now());
    table
      .timestamp("updated_at")
      .notNullable()
      .defaultTo(knex.raw("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"));
    table.unique("country_key");
  });
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function down (knex) {
  return knex.schema.dropTable("countries");
}
