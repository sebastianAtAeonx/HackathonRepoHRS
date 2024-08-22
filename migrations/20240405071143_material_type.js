export function up (knex) {
  return knex.schema.createTable("material_type", function (table) {
    table.increments("id").primary();
    table.string("name", 50);
    table.text("description");
    table.enum("status", ["1", "0"]).defaultTo("1");
    table.string("modifiedBy",255).nullable();
    table.timestamps(true, true);
  });
}

export function down (knex) {
  return knex.schema.dropTableIfExists("material_type");
}
