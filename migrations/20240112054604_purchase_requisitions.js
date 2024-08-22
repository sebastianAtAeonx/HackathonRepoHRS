export function up(knex) {
  return knex.schema.createTable("purchase_requisitions", function (table) {
    table.increments("id").primary();
    table.string("document_type", 50).nullable().defaultTo(null);
    table.string("header_text", 50).nullable().defaultTo(null);
    table.enum("pr_type", ["item", "service"]).nullable().defaultTo(null);
    table.string("pr_no", 45).nullable().defaultTo(null);
    table.integer("requisitioner", 10).nullable().defaultTo(null);
    table.integer("total", 10).nullable().defaultTo(null);
    table.string("sub_number", 45).nullable().defaultTo(null);
    table.integer("p_org_id", 10).unsigned().nullable();
    table.string("attachment", 255).nullable();
    table.text("pr_data").nullable().defaultTo(null);
    table.integer("subscriber_id", 10).notNullable();
    table.datetime("requisition_date").notNullable().defaultTo(knex.fn.now());
    table.datetime("deadline").notNullable().defaultTo(knex.fn.now());
    table
      .enum("status", [
        "draft",
        "submitted",
        "approved",
        "rejected",
        "processing",
        "closed",
      ])
      .notNullable()
      .defaultTo("draft");
    table.string("modifiedBy", 255).nullable();
    table.datetime("created_at").notNullable().defaultTo(knex.fn.now());
    table
      .timestamp("updated_at")
      .defaultTo(knex.raw("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"));
    table.enum("is_deleted", ["0", "1"]).nullable().defaultTo("0");
    // table
    //   .foreign("p_org_id")
    //   .references("id")
    //   .inTable("purchase_organization")
    //   .onUpdate("NO ACTION")
    //   .onDelete("NO ACTION");
  });
}

export function down(knex) {
  return knex.schema.dropTableIfExists("purchase_requisitions");
}
