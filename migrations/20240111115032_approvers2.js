/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function up(knex) {
  return knex.schema.createTable("approvers2", function (table) {
    table.increments("id").primary().index("PRIMARY", "BTREE");
    table.string("department_id", 36).nullable(); //
    table.integer("approval_hierarchy_id", 10).unsigned().nullable(); //
    table.text("level_1_user_id").notNullable();
    table.text("level_2_user_id").notNullable();
    table.text("level_3_user_id");
    table.text("level_4_user_id");
    table.string("portal_code", 255).nullable(); //
    table.enu("status", ["1", "0"]).notNullable().defaultTo("1");
    table.string("modifiedBy",255).nullable();
    table.timestamp("created_at").notNullable().defaultTo(knex.fn.now());
    table
      .timestamp("updated_at")
      .notNullable()
      .defaultTo(knex.raw("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"));
  });
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function down(knex) {
  return knex.schema.dropTableIfExists("approvers2");
}
