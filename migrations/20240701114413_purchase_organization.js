export function up(knex) {
  return knex.schema.createTable("purchase_organization", function (table) {
    table.integer("id", 10).primary().unsigned();
    table.string("code", 45).nullable();
    table.string("description", 255).nullable();
    table.integer("company_id", 10).unsigned().nullable();
    table.integer("purchase_group_id", 10).unsigned().nullable();
    table.timestamp("created_at").defaultTo(knex.fn.now()).nullable();
    table
      .timestamp("updated_at")
      .defaultTo(knex.raw("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"));

    table
      .foreign("company_id")
      .references("id")
      .inTable("companies")
      .onUpdate("NO ACTION")
      .onDelete("NO ACTION");
    table
      .foreign("purchase_group_id")
      .references("id")
      .inTable("purchase_groups")
      .onUpdate("NO ACTION")
      .onDelete("CASCADE");
  });
}

export function down(knex) {
  return knex.schema.dropTable("purchase_organization");
}
