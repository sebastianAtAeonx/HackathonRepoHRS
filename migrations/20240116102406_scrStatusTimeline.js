export function up (knex) {
  return knex.schema.createTable("scrStatusTimeline", function (table) {
    table.increments("id").primary();
    table.integer("asn_id").unsigned().nullable().defaultTo(null);
    table.integer("requested").unsigned().nullable().defaultTo(null);
    table
      .string("requestedStatus", 255)
      .collate("utf8_general_ci")
      .nullable()
      .defaultTo(null);
    table.timestamp("requestedTime").nullable().defaultTo(null);
    table
      .text("requestedRemarks")
      .collate("utf8_general_ci")
      .nullable()
      .defaultTo(null);
    table.integer("accepted").unsigned().nullable().defaultTo(null);
    table
      .string("acceptedStatus", 255)
      .collate("utf8_general_ci")
      .nullable()
      .defaultTo(null);
    table.date("acceptedTime").nullable().defaultTo(null);
    table
      .text("acceptedRemarks")
      .collate("utf8_general_ci")
      .nullable()
      .defaultTo(null);
    table.integer("Invoiced").unsigned().nullable().defaultTo(null);
    table
      .string("InvoicedStatus", 255)
      .collate("utf8_general_ci")
      .nullable()
      .defaultTo(null);
    table.timestamp("InvoicedTime").nullable().defaultTo(null);
    table
      .text("invoicedRemarks")
      .collate("utf8_general_ci")
      .nullable()
      .defaultTo(null);
    table.integer("Cancel").unsigned().nullable().defaultTo(null);
    table
      .string("CancelStatus", 255)
      .collate("utf8_general_ci")
      .nullable()
      .defaultTo(null);
    table.timestamp("CancelTime").nullable().defaultTo(null);
    table
      .text("CancelRemarks")
      .collate("utf8_general_ci")
      .nullable()
      .defaultTo(null);
      table.string("modifiedBy",255).nullable();
    table.timestamp("created_at").defaultTo(knex.fn.now());
    table
      .timestamp("updated_at")
      .defaultTo(knex.raw("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"));

    
  });
}

export function down (knex) {
  return knex.schema.dropTableIfExists("scrStatusTimeline");
}
