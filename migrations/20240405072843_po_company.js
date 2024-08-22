export function up (knex) {
  return knex.schema.createTable("po_company", function (table) {
    table.increments("id").primary();
    table.text("poNo").nullable();
    table.json("poData").nullable();
    table
      .enum("status", [
        "Draft",
        "Pending",
        "Approved",
        "Open",
        "Closed",
        "Cancelled",
        "Allocated",
        "Fulfilled",
      ])
      .defaultTo("Pending")
      .nullable();
    table.text("supplierId").nullable();
    table.string("modifiedBy",255).nullable();
    table.timestamps(true, true);
  });
}

export function down (knex) {
  return knex.schema.dropTableIfExists("po_company");
}
