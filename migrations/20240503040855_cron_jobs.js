export function up (knex) {
  return knex.schema.createTable("cron_jobs", function (table) {
    table.increments("id").primary().unsigned();
    table
      .enum("time_unit", ["hourly", "daily", "weekly", "monthly", "yearly"])
      .nullable()
      .collate("utf8mb3_general_ci");
    table.string("day", 50).nullable().collate("utf8mb3_general_ci");
    table.time("time").nullable();
    table.date("date").nullable();
    table.string("url", 255).nullable().collate("utf8mb3_general_ci");
    table.string("modifiedBy",255).nullable();
    table.timestamp("created_at").notNullable().defaultTo(knex.fn.now());
    table
      .timestamp("updated_at")
      .defaultTo(knex.raw("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"));
  });
}

export function down (knex) {
  return knex.schema.dropTableIfExists("cron_jobs");
}
