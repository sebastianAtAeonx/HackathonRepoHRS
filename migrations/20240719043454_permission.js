/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function up(knex) {
  return knex.schema.createTable("permission", function (table) {
    table.increments("id").primary();
    table.integer("module_id").unsigned();
    table.integer("role_id").unsigned().defaultTo(0);
    table.tinyint("createP").nullable().defaultTo(0);
    table.tinyint("readP").nullable().defaultTo(0);
    table.tinyint("updateP").nullable().defaultTo(0);
    table.tinyint("deleteP").nullable().defaultTo(0);
    table.timestamp("created_at").defaultTo(knex.fn.now()).nullable();
    table
      .timestamp("updated_at")
      .defaultTo(knex.raw("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"));

    table.index("module_id");
    table.index("role_id");

    table
      .foreign("module_id")
      .references("id")
      .inTable("module")
      .onDelete("NO ACTION")
      .onUpdate("NO ACTION");
    table
      .foreign("role_id")
      .references("id")
      .inTable("role")
      .onDelete("SET NULL")
      .onUpdate("SET NULL");
  });
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function down(knex) {
  return knex.schema.dropTable("permission");
}
