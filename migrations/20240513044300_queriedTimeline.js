export function up (knex) {
  return knex.schema.createTable("queriedTimeline", function (table) {
    table.increments("id").primary().unsigned();
    table.integer("timelineId").notNullable();
    table
      .string("supplierId", 255)
      .notNullable()
      .defaultTo("")
      .collate("utf8mb3_general_ci");
    table
      .string("query", 255)
      .notNullable()
      .defaultTo("")
      .collate("utf8mb3_general_ci");
    table
      .string("queryAnswer", 255)
      .notNullable()
      .defaultTo("")
      .collate("utf8mb3_general_ci");
    table.integer("approverId").notNullable().defaultTo(0);
    table.integer("level").notNullable().defaultTo(0);
    table.string("modifiedBy",255).nullable();
    table.timestamp("created_at").notNullable().defaultTo(knex.fn.now());
    table
      .timestamp("updated_at")
      .defaultTo(knex.raw("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"));
  });
}

export function down (knex) {
  return knex.schema.dropTableIfExists("queriedTimeline");
}
