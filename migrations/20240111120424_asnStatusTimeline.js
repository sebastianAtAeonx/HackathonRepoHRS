export function up (knex) {
  return knex.schema.createTable("asnStatusTimeline", function (table) {
    table.increments("id").primary();
    table.integer("asn_id").unsigned().nullable();
    table.integer("MaterialShipped").unsigned().nullable();
    table.timestamp("MaterialShippedTime").nullable();
    table.string("MaterialShippedStatus", 255).nullable();
    table.text("MaterialShippedRemarks").nullable();
    table.integer("MaterialGateInward").unsigned().nullable();
    table.timestamp("MGITime").nullable();
    table.string("MaterialGateInwardStatus", 255).nullable();
    table.text("MaterialGateInwardRemarks").nullable();
    table.integer("MaterialReceived").unsigned().nullable();
    table.timestamp("MaterialReceivedTime").nullable();
    table.string("MaterialReceivedStatus", 255).nullable();
    table.text("MaterialReceivedRemarks").nullable();
    table.integer("QualityApproved").unsigned().nullable();
    table.timestamp("QualityApprovedTime").nullable();
    table.string("QualityApprovedStatus", 255).nullable();
    table.text("QualityApprovedRemarks").nullable();
    table.integer("Invoiced").unsigned().nullable();
    table.timestamp("InvoicedTime").nullable();
    table.string("InvoicedStatus", 255).nullable();
    table.text("InvoicedRemarks").nullable();
    table.integer("Cancel").unsigned().nullable();
    table.timestamp("CancelTime").nullable();
    table.string("CancelStatus", 255).nullable();
    table.text("CancelRemarks").nullable();
    table.string("modifiedBy",255).nullable();
    table.timestamp("created_at").nullable().defaultTo(knex.fn.now());
    table
      .timestamp("updated_at")
      .defaultTo(knex.raw("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"));
  });
}

export function down (knex) {
  return knex.schema.dropTableIfExists("asnStatusTimeline");
}
