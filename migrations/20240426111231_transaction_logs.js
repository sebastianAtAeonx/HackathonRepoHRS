export function up(knex) {
  return knex.schema.createTable("transaction_logs", function (table) {
    table.increments("id").primary().unsigned();
    table.string("transaction_type", 10).nullable();
    table.string("table_name", 50).nullable();
    table.text("old_value").nullable();
    table.text("new_value").nullable();
    table.integer("user_id").nullable();
    table.index("user_id");
    table.string("modifiedBy", 50).nullable();
    table.timestamp("timestamp").nullable().defaultTo(knex.fn.now());
  });
}

export function down(knex) {
  return knex.schema.dropTableIfExists("transaction_logs");
}
