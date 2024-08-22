export function up (knex) {
  return knex.schema.createTable("languages", function (table) {
    table.string("id", 36).notNullable().primary();
    table.string("code", 2).notNullable();
    table.string("name", 255).notNullable();
    table.string("country_name", 255).notNullable();
    table.enum("status", ["1", "0"]).notNullable().defaultTo("1");
    table.string("modifiedBy",255).nullable();
    table.timestamp("created_at").notNullable().defaultTo(knex.fn.now());
    table
      .timestamp("updated_at")
      .defaultTo(knex.raw("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"));
  });
}

export function down (knex) {
  return knex.schema.dropTableIfExists("languages");
}
