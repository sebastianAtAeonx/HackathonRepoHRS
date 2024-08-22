/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function up (knex) {
  return knex.schema.alterTable("purchase_requisition_items", function (table) {
    table
      .foreign("material_id")
      .references("id")
      .inTable("materials")
      .onDelete("NO ACTION")
      .onUpdate("NO ACTION");
    table
      .foreign("matl_group_id")
      .references("id")
      .inTable("material_group")
      .onDelete("NO ACTION")
      .onUpdate("NO ACTION");
    table
      .foreign("stor_loc_id")
      .references("id")
      .inTable("storage_locations")
      .onDelete("NO ACTION")
      .onUpdate("NO ACTION");
    table
      .foreign("uom_id")
      .references("id")
      .inTable("units")
      .onDelete("NO ACTION")
      .onUpdate("NO ACTION");
  });
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function down (knex) {
  return knex.schema.alterTable("purchase_requisition_items", function (table) {
    table.dropForeign("material_id");
    table.dropForeign("matl_group_id");
    table.dropForeign("stor_loc_id");
    table.dropForeign("uom_id");
  });
}
