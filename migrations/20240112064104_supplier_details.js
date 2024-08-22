/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function up(knex) {
  return knex.schema.createTable("supplier_details", function (table) {
    table.uuid("id").primary();
    table.string("supplier_name", 255).nullable();
    table.string("emailID", 255).nullable();
    table.integer("emailRefKey", 10).unsigned().nullable();
    table.string("password", 255).nullable();
    table.enum("updateByAdmin", ["Y", "N"]).nullable().defaultTo("N");
    table.string("mobile", 255).nullable();
    table.string("telephone", 255).nullable();
    table.string("designation", 255).nullable();
    table.string("contactPersonName", 255).nullable();
    table.string("cinNo", 255).nullable();
    table.string("aadharNo", 255).nullable();
    table.string("officeDetails", 255).nullable();
    table.string("paymentMethod", 50).nullable();
    table.string("website", 255).nullable();
    table.string("phoneNo", 255).nullable();
    table.string("pin", 255).nullable();
    table.string("city", 255).nullable();
    table.string("country", 255).nullable();
    table.string("address3", 255).nullable();
    table.string("address2", 255).nullable();
    table.string("address1", 255).nullable();
    table.string("streetNo", 255).nullable();
    table.string("source", 255).nullable();
    table.integer("add", 10).nullable();
    table.string("state", 50).nullable();
    table.string("department_id", 36).nullable();
    table.string("department", 255).nullable();
    table.string("sap_code", 255).nullable();
    table.text("sap_status").nullable();

    table.timestamp("sap_code_time").nullable();
    table
      .enum("status", [
        "pending",
        "approved",
        "verified",
        "rejected",
        "queried",
        "deactive",
      ])
      .defaultTo("pending");
    table
      .enum("level1status", ["pending", "verified", "rejected", "queried"])
      .defaultTo("pending");
    table
      .enum("level2status", ["pending", "approved", "rejected", "queried"])
      .defaultTo("pending");
    table.timestamp("status_update_date").nullable();
    table.string("comment", 255).nullable();
    table.string("gstNo", 15).nullable();
    table.string("panNo", 10).nullable();
    table.uuid("subscriber_id").nullable();
    table.enum("type", ["goods", "services"]).defaultTo("goods");
    table.string("modifiedBy", 255).nullable();
    table.timestamp("created_at").notNullable().defaultTo(knex.fn.now());
    table
      .timestamp("updated_at")
      .notNullable()
      .defaultTo(knex.raw("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"));
  });
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function down(knex) {
  return knex.schema.dropTable("supplier_details");
}
