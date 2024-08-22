export function up(knex) {
  return knex.schema.createTable("approversLogsTest", function (table) {
    table.increments("id").primary().unsigned();
    table.integer("wfId").nullable();
    table.string("supplierId", 36).nullable();
    table.string("status", 255).nullable();
    table.time("statusTime").nullable();
    table.string("comment", 255).nullable();
    table.integer("approverId", 10).unsigned().nullable();
    table.integer("level").nullable();
    table.enum("isEditable", ["1", "0"]).nullable().defaultTo("0");
    table.string("modifiedBy", 255).nullable();
    table.timestamp("created_at").notNullable().defaultTo(knex.fn.now());
    table
      .timestamp("updated_at")
      .defaultTo(knex.raw("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"));
  });
}

export function down(knex) {
  return knex.schema.dropTableIfExists("approversLogsTest");
}
