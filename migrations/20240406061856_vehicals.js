export function up (knex) {
  return knex.schema.createTable("vehicals", function (table) {
    table.increments("id").primary().unsigned();
    table.integer("asn_id").notNullable().defaultTo(0);
    table.string("vehicalNo", 255).notNullable();
    table.string("modalName", 255).notNullable();
    table.string("arrivalDate", 255).notNullable();
    table.string("arrivalTime", 255).notNullable();
    table.string("comeFrom", 255).notNullable();
    table.string("driverFullName", 255).notNullable();
    table.string("driverLicenceNo", 255).notNullable();
    table
      .enum("vehicalStatus", ["shield", "opened"])
      .notNullable()
      .defaultTo("shield");
    table.string("plant", 255).nullable();
    table.string("logisticCoName", 255).notNullable();
    table.string("gateInwardLocation", 255).notNullable();
    table.string("vehicalInwardPurpose", 255).notNullable();
    table.enum("status", ["Inward", "Outward"]).nullable().defaultTo(null);
    table.timestamp("statusTime").nullable().defaultTo(null);
    table.text("gateInwardNumber").nullable();
    table.string("transporterName", 255).nullable();
    table.string("transporterId", 255).nullable();
    table.string("transDocNo", 255).nullable();
    table.string("transDocDate", 255).nullable();
    table.string("modifiedBy",255).nullable();
    table.timestamp("createdAt").notNullable().defaultTo(knex.fn.now());
    table
      .timestamp("updatedAt")
      .defaultTo(knex.raw("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"));
  });
}

export function down (knex) {
  return knex.schema.dropTableIfExists("vehicals");
}
