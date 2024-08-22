export function up (knex) {
  return knex.schema.createTable("environment_variables", function (table) {
    table.increments("id").primary();
    table.text("env_key").notNullable().collate("utf8_general_ci");
    table.text("env_value").notNullable().collate("utf8_general_ci");
    table.text("env_key_description").notNullable().collate("utf8_general_ci");
    table.string("modifiedBy",255).nullable();
    table.timestamp("created_at").notNullable().defaultTo(knex.fn.now());
    table
      .timestamp("updated_at")
      .defaultTo(knex.raw("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"));
  });
}

export function down (knex) {
  return knex.schema.dropTableIfExists("environment_variables");
}
