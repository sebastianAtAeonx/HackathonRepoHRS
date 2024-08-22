/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function up(knex) {
  return knex.schema.createTable("departments", function (table) {
    table.string("id", 36).notNullable();
    table.integer("company_id", 10).unsigned().notNullable().defaultTo(0);
    table.string("name", 255).notNullable();
    table.string("email", 255).nullable();
    table.string("portal_code_name", 50).nullable();
    table.enum("status", ["1", "0"]).defaultTo("1");
    table.string("modifiedBy", 255).nullable();
    table.timestamp("created_at").notNullable().defaultTo(knex.fn.now());
    table
      .timestamp("updated_at")
      .notNullable()
      .defaultTo(knex.raw("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"));
    table.primary("id");
    //
  });
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  await knex
    .raw("SET FOREIGN_KEY_CHECKS = 0");
  await knex.schema.dropTable("departments");
  return await knex.raw("SET FOREIGN_KEY_CHECKS = 1");
  return knex.schema.dropTable("departments");
}
