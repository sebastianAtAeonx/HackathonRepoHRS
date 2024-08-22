export function up (knex) {
  return knex.schema.createTable("sapConfiguration", function (table) {
    table.increments("id").primary();
    table.string("name", 255).nullable().defaultTo(null);
    table.text("url").nullable().defaultTo(null);
    table.text("tokenPath").nullable().defaultTo(null);
    table.string("username", 50).nullable().defaultTo(null);
    table.string("password", 50).nullable().defaultTo(null);
    table.text("authentication").nullable().defaultTo(null);
    table.string("ip", 50).nullable().defaultTo(null);
    table.string("client", 50).nullable().defaultTo(null);
    table.text("cookie").nullable().defaultTo(null);
    table.enum("status", ["1", "0"]).nullable().defaultTo("1");
    table.string("modifiedBy",255).nullable();
    table.timestamp("createdAt").nullable().defaultTo(knex.fn.now());
    table
      .timestamp("updatedAt")
      .defaultTo(knex.raw("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"));
  });
}

export function down (knex) {
  return knex.schema.dropTableIfExists("sapConfiguration");
}
