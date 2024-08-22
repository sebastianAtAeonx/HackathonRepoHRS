/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function up(knex) {
  return knex.schema.createTable("business_details", function (table) {
    table.string("id", 36).notNullable().primary();
    table.string("company_id", 36).nullable();
    table.string("companyFoundYear", 255).notNullable();
    table.string("msme_no", 255).notNullable().defaultTo('""');
    table.string("promoterName", 255).notNullable();
    table.string("companyType", 50).notNullable();
    table.string("nameOfBusiness", 255).notNullable();
    table.string("businessType", 255).notNullable();
    table.string("msmeType", 255).nullable();
    table.text("addressOfPlant").notNullable();
    table.text("nameOfOtherGroupCompanies").notNullable();
    table.text("listOfMajorCustomers").notNullable();
    table.text("detailsOfMajorLastYear").notNullable();
    table.string("modifiedBy", 50).nullable();
    table.timestamp("created_at").notNullable().defaultTo(knex.fn.now());
    table
      .timestamp("updated_at")
      .notNullable()
      .defaultTo(knex.raw("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"));

    //table.foreign('company_id').references('id').inTable('supplier_details').onDelete('CASCADE').onUpdate('CASCADE');
  });
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function down(knex) {
  return knex.schema.dropTableIfExists("business_details");
}
