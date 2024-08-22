export function up (knex) {
  return knex.schema.createTable("approval_timeline", function (table) {
    table.increments("id").primary();

    table
      .string("supplier_id", 36)
      .nullable();

    table.integer("queried").nullable().defaultTo(null);

    table.timestamp("queriedTime").nullable().defaultTo(null);

    table
      .string("queriedRemarks", 255)
      .nullable()
      .defaultTo(null)
      .collate("utf8_general_ci");

    table.integer("approved").nullable().defaultTo(null);

    table.timestamp("approvedTime").nullable().defaultTo(null);

    table
      .string("approvedRemarks", 255)
      .nullable()
      .defaultTo(null)
      .collate("utf8_general_ci");

    table.integer("rejected").nullable().defaultTo(null);

    table.timestamp("rejectedTime").nullable().defaultTo(null);

    table
      .string("rejectedRemarks", 255)
      .nullable()
      .defaultTo(null)
      .collate("utf8_general_ci");
    table.enum("isEditable", ["1", "0"]).nullable().defaultTo("0");
    table.string("modifiedBy",255).nullable();
    table.timestamp("created_at").notNullable().defaultTo(knex.fn.now());

    table
      .timestamp("updated_at")
      .defaultTo(knex.raw("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"));
  });
}

export function down (knex) {
  return knex.schema.dropTable("approval_timeline");
}
