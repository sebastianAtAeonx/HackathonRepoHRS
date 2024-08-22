export function up (knex) {
  return knex.schema.createTable("request_for_quotations", function (table) {
    table.increments("id").primary();
    table.integer("pr_id", 10).unsigned().notNullable();
    table.string("rfq_no", 45).nullable().defaultTo(null);
    table.string("language_id", 36).nullable().defaultTo(null);
    table.date("rfq_date").nullable().defaultTo(null);
    table.date("deadline").nullable().defaultTo(null);
    table.string("purchase_org", 45).nullable().defaultTo(null);
    table.integer("item_category_id", 10).unsigned().notNullable();
    table.text("description").nullable().defaultTo(null);
    table.string("req_tracking_no", 45).nullable().defaultTo(null);
    table.text("attachment").nullable().defaultTo(null);
    table.integer("subscriber_id").unsigned().nullable().defaultTo(null);
    table
      .enum("status", ["open", "closed", "in_review", "approved", "rejected"])
      .notNullable();
      table.string("modifiedBy",255).nullable();
    table.datetime("created_at").notNullable().defaultTo(knex.fn.now());
    table.datetime("updated_at").notNullable().defaultTo(knex.fn.now());
  });
}

export function down (knex) {
  return knex.schema.dropTableIfExists("request_for_quotations");
}
