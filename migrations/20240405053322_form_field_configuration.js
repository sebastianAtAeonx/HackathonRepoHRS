export function up (knex) {
  return knex.schema.createTable("form_field_configuration", function (table) {
    table.increments("id").primary();
    table.string("moduleName", 50).nullable();
    table.text("fields").nullable();
    table.enum("status", ["1", "0"]).nullable().defaultTo("1");
    table.string("modifiedBy",255).nullable();
    table.timestamp("createdAt").nullable().defaultTo(knex.fn.now());
    table
      .timestamp("updatedAt")
      .defaultTo(knex.raw("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"));
  });
}

export function down (knex) {
  return knex.schema.dropTableIfExists("form_field_configuration");
}
