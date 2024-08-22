export function up (knex) {
  return knex.schema.createTable("logs", function (table) {
    table.increments("id").primary().unsigned().notNullable();
    table.integer("userId").nullable().defaultTo(0);
    table.string("emailId", 255).nullable();
    table.string("action", 255).nullable();
    table.string("method", 50).nullable();
    table.text("description").nullable();
    table.text("activities").nullable();
    table.timestamp("endPointAccessTime").nullable().defaultTo(null);
    table.timestamp("created_at").nullable().defaultTo(knex.fn.now());
    table
      .timestamp("updated_at")
      .defaultTo(knex.raw("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"));
    table.index("userId", "userId_index");
    table.index("emailId", "emailId_index");
  });
}

export function down (knex) {
  return knex.schema.dropTableIfExists("logs");
}
