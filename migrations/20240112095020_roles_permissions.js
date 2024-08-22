/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function up(knex) {
  return knex.schema.createTable("roles_permissions", function (table) {
    table.increments("id").primary();
    table.integer("role_id").unsigned().notNullable();
    table.json("module_permission").notNullable();
    table.string("modifiedBy", 255).nullable();
    table.timestamp("created_at").defaultTo(knex.fn.now());
    table.timestamp("updated_at").defaultTo(knex.fn.now());

    // Add foreign key constraint
    table
      .foreign("role_id")
      .references("id")
      .inTable("users_roles")
      .onUpdate("NO ACTION")
      .onDelete("NO ACTION")
      .withKeyName("FKrole_id");
  });
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function down(knex) {
  return knex.schema.dropTable("roles_permissions");
}
