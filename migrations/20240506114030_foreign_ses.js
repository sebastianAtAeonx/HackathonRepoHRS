/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function up (knex) {
    return knex.schema.alterTable("ses", function (table) {
      table
        .foreign("asnId")
        .references("id")
        .inTable("asns")
        .onDelete("NO ACTION")
        .onUpdate("NO ACTION");
    });
  }
  
  /**
   * @param { import("knex").Knex } knex
   * @returns { Promise<void> }
   */
  export function down (knex) {
    return knex.schema.alterTable("ses", function (table) {
      table.dropForeign("asnId");
    });
  }