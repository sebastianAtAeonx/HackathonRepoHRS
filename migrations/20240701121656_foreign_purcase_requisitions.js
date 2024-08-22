/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function up(knex) {
  return knex.schema.alterTable("purchase_requisitions", function (table) {
    table
      .foreign("p_org_id")
      .references("id")
      .inTable("purchase_organization")
      .onUpdate("NO ACTION")
      .onDelete("NO ACTION");
  });
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function down(knex) {
  return knex.schema.alterTable("purchase_requisitions", function (table) {
    table.dropForeign(["p_org_id"]);
  });
}
