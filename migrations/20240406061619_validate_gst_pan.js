export function up(knex) {
  return knex.schema.createTable("validateGST_PAN", function (table) {
    table.increments("id").primary().unsigned();
    table.string("supplierId", 36).nullable();
    table.string("supplierName", 255).nullable();
    table.string("sapcode", 12).nullable();
    table.string("gst", 255).nullable();
    table.string("gstStatus", 255).nullable();
    table.timestamp("gstTime").nullable().defaultTo(knex.fn.now());
    table.string("gstOldStatus", 50).nullable();
    table.timestamp("gstOldTime").nullable().defaultTo(knex.fn.now());
    table.string("pan", 255).nullable();
    table.string("panStatus", 255).nullable();
    table.timestamp("panTime").nullable().defaultTo(knex.fn.now());
    table.string("panOldStatus", 50).nullable();
    table.timestamp("panOldTime").nullable().defaultTo(knex.fn.now());
    table.string("msmeNo", 50).nullable();
    table.string("msmeStatus", 20).nullable();
    table.timestamp("msmeTime").nullable().defaultTo(knex.fn.now());
    table.string("msmeOldStatus", 20).nullable();
    table.timestamp("msmeOldTime").nullable().defaultTo(knex.fn.now());
    table.string("modifiedBy", 255).nullable();
    table.timestamp("createdAt").notNullable().defaultTo(knex.fn.now());
    table
      .timestamp("updatedAt")
      .defaultTo(knex.raw("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"));
  });
}

export function down(knex) {
  return knex.schema.dropTableIfExists("validateGST_PAN");
}
