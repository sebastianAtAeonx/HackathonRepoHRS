export function up(knex) {
  return knex.schema.createTable(
    "purchase_requisition_items",
    function (table) {
      table.increments("id").primary();
      table.integer("pr_id").notNullable();
      table.integer("material_id", 10).unsigned().nullable();
      table.integer("matl_group_id", 10).unsigned().nullable();
      table.string("item_text", 45).notNullable();
      table
        .text("short_text")

        .nullable()
        .defaultTo(null);
      table.integer("quantity").notNullable();
      table.integer("uom_id", 10).unsigned().nullable();
      table.date("delivery_date").notNullable();
      table
        .string("plant_id", 36)

        .nullable()
        .defaultTo(null);
      table.integer("stor_loc_id", 10).unsigned().nullable();
      // table
      //   .string("requisitioner", 100)

      //   .notNullable();
      table.string("vendor_id", 36).notNullable();
      table.float("price").notNullable();
      table.integer("subtotal", 10).nullable().defaultTo(null);
      // table
      //   .string("sub_number", 45)

      //   .nullable()
      //   .defaultTo(null);
      table
        .enum("is_deleted", ["0", "1"])

        .nullable()
        .defaultTo("0")
        .comment("0 - not deleted, 1 - deleted");
      table.integer("item_id").notNullable();
      table
        .enum("status", ["pending", "processing", "cancelled", "onhold"])

        .notNullable();
      table.string("modifiedBy", 255).nullable();
      table.datetime("created_at").notNullable().defaultTo(knex.fn.now());
      table
        .timestamp("updated_at")
        .defaultTo(knex.raw("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"));
    }
  );
}

export function down(knex) {
  return knex.schema.dropTableIfExists("purchase_requisition_items");
}
