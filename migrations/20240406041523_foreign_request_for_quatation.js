/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function up (knex) {
  return knex.schema.alterTable("request_for_quotations", function (table) {
    table
      .foreign("item_category_id")
      .references("id")
      .inTable("item_categories")
      .onUpdate("NO ACTION")
      .onDelete("NO ACTION");
    table
      .foreign("subscriber_id")
      .references("id")
      .inTable("subscribers")
      .onUpdate("NO ACTION")
      .onDelete("NO ACTION");
    table
      .foreign("pr_id")
      .references("id")
      .inTable("purchase_requisitions")
      .onUpdate("NO ACTION")
      .onDelete("NO ACTION");
    table
      .foreign("language_id")
      .references("id")
      .inTable("languages")
      .onUpdate("NO ACTION")
      .onDelete("NO ACTION");
  });
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function down (knex) {
  return knex.schema.alterTable("request_for_quotations", function (table) {
    table.dropForeign("pr_id");
    table.dropForeign("language_id");
    table.dropForeign("subscriber_id");
    table.dropForeign("item_category_id");
  });
}
