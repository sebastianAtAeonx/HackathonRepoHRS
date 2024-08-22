export function up(knex) {
  return knex.schema.createTable("taxpayer_credentials", function (table) {
    table.increments("id").primary();
    table.string("supplierId", 255).nullable();
    table.string("username", 255).nullable();
    table.string("password", 255).nullable();
    table.string("gstno", 20).nullable();
    table.text("access_token").nullable();
    table.timestamp("access_token_time").nullable();
    table.text("api_key").nullable();
    table.text("secret_key").nullable();
    table.string("modifiedBy", 255).nullable();
    table.timestamp("createdAt").notNullable().defaultTo(knex.fn.now());
    table
      .timestamp("updatedAt")
      .defaultTo(knex.raw("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"));
  });
}

export function down(knex) {
  return knex.schema.dropTableIfExists("taxpayer_credentials");
}
