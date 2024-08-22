export function up (knex) {
  return knex.schema.createTable("units", function (table) {
    table.increments("id").primary();
    table.string("name", 255).notNullable();
    table.string("unit", 255).notNullable();
    table.enum("status", ["1", "0"]).notNullable().defaultTo("1");
    table.string("modifiedBy",255).nullable();
    table.timestamp("created_at").notNullable().defaultTo(knex.fn.now());
    table
      .timestamp("updated_at")
      .defaultTo(knex.raw("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"));
  });
}

export function down (knex) {
  return knex.schema.dropTableIfExists("units");
}
