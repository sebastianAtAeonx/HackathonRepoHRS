/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function up(knex) {
  return knex.schema.alterTable("supplier_details", function (table) {
    table
      .foreign("emailRefKey")
      .references("id")
      .inTable("users")
      .onDelete("CASCADE")
      .onUpdate("CASCADE");
    // table
    //   .foreign("paymentMethod")
    //   .references("id")
    //   .inTable("payment_types")
    //   .onDelete("NO ACTION")
    //   .onUpdate("NO ACTION");
    // table
    //   .foreign("state")
    //   .references("id")
    //   .inTable("states")
    //   .onDelete("NO ACTION")
    //   .onUpdate("NO ACTION");
  });
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function down(knex) {
  return knex.schema.alterTable("supplier_details", function (table) {
    table.dropForeign("emailRefKey");
  });
}
