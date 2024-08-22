export function up(knex) {
  return knex.schema.createTable("approverTest", function (table) {
    table.increments("id").primary().unsigned();
    table.string("departmentId", 36).nullable();
    table.integer("level").nullable();
    table.integer("userId", 10).unsigned().nullable();
    table.string("modifiedBy",255).nullable();
    table.timestamp("created_at").notNullable().defaultTo(knex.fn.now());
    table
      .timestamp("updated_at")
      .defaultTo(knex.raw("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"));
  });
}

export function down(knex) {
  return knex.schema.dropTableIfExists("approverTest");
}
