export function up(knex) {
  return knex.schema.createTable("ses", function (table) {
    table.increments("id").primary().unsigned();
    table.enu("key", ["X", ""]).notNullable().defaultTo("");
    table.text("sesUniqueId").notNullable();
    table.text("poNo").notNullable();
    table.integer("asnId", 10).unsigned().nullable();
    table.json("header").notNullable();
    table.json("item").notNullable();
    table.text("sesCode").nullable().defaultTo(null);
    table.text("sesStatus").nullable().defaultTo(null);
    table.json("serviceActivity").notNullable();
    table.timestamp("sesTime").nullable().defaultTo(knex.fn.now());
    table.string("modifiedBy", 255).nullable();
    table.timestamp("createdAt").nullable().defaultTo(knex.fn.now());
    table
      .timestamp("updatedAt")
      .defaultTo(knex.raw("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"));
  });
}

export function down(knex) {
  return knex.schema.dropTableIfExists("ses");
}
