/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function up(knex) {
  return knex.schema.alterTable("business_details", function (table) {
    table
      .foreign("company_id")
      .references("id")
      .inTable("supplier_details")
      .onDelete("CASCADE")
      .onUpdate("CASCADE");
    // table
    //   .foreign("msmeType")
    //   .references("id")
    //   .inTable("minority_indicator")
    //   .onDelete("NO ACTION")
    //   .onUpdate("NO ACTION");
    // table
    //   .foreign("companyType")
    //   .references("id")
    //   .inTable("company_types")
    //   .onDelete("NO ACTION")
    //   .onUpdate("NO ACTION");
    // table
    //   .foreign("businessType")
    //   .references("id")
    //   .inTable("business_types")
    //   .onDelete("NO ACTION")
    //   .onUpdate("NO ACTION");
    // table
    //   .foreign("listOfMajorCustomers")
    //   .references("id")
    //   .inTable("major_customer")
    //   .onDelete("NO ACTION")
    //   .onUpdate("NO ACTION");
    // table
    //   .foreign("detailsOfMajorLastYear")
    //   .references("id")
    //   .inTable("major_order")
    //   .onUpdate("NO ACTION")
    //   .onUpdate("NO ACTION");
  });
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function down(knex) {
  return knex.schema.alterTable("business_details", function (table) {
    table.dropForeign(["company_id"]);
    // table.dropForeign(["msmeType"]);
    // table.dropForeign(["companyType"]);
    // table.dropForeign(["businessType"]);
    // table.dropForeign(["listOfMajorCustomers"]);
    // table.dropForeign(["detailsOfMajorLastYear"]);
    table.dropColumn("company_id");
  });
}
