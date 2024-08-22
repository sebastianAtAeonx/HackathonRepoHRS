export function up(knex) {
  return knex.schema.createTable("gis", function (table) {
    table.increments("id").primary().unsigned();
    table.string("giUniqueId", 255).notNullable().defaultTo("0");
    table.integer("asnId", 10).unsigned().nullable();
    table.string("poNo", 255).notNullable().defaultTo("");
    table.string("vendor", 255).notNullable().defaultTo("");
    table.json("Item").notNullable();
    table.string("giCode", 255).nullable().defaultTo("");
    table.string("giStatus", 255).nullable().defaultTo("");
    table.timestamp("giTime").notNullable().defaultTo(knex.fn.now());
    table.string("modifiedBy", 255).nullable();
    table.timestamp("createdAt").notNullable().defaultTo(knex.fn.now());
    table
      .timestamp("updatedAt")
      .defaultTo(knex.raw("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"));
  });
}

export function down(knex) {
  return knex.schema.dropTableIfExists("gis");
}
