export function up (knex) {
  return knex.schema.createTable("field_mapping", function (table) {
    table.increments("id").primary();
    table.text("mapId").notNullable();
    table.json("extractedKeys").notNullable();
    table.json("sapKeys").notNullable();
    table.json("mappedKeys").nullable().defaultTo(null);
    table.json("patternKeys").nullable().defaultTo(null);
    table.enum("status", ["0", "1"]).nullable().defaultTo("1");
    table.string("modifiedBy",255).nullable();
    table.timestamp("createdAt").nullable().defaultTo(knex.fn.now());
    table
      .timestamp("updatedAt")
      .defaultTo(knex.raw("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"));
  });
}

export function down (knex) {
  return knex.schema.dropTableIfExists("field_mapping");
}
