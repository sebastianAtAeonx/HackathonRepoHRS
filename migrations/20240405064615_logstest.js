export function up (knex) {
  return knex.schema.createTable("logstest", function (table) {
    table.increments("id").primary().unsigned().notNullable();
    table.integer("user_id").nullable().defaultTo(null);
    table.string("activity_type", 255).nullable();
    table.string("method", 255).nullable();
    table.string("route", 255).nullable();
    table.text("response").nullable();
    table.timestamp("timestamp").nullable().defaultTo(knex.fn.now());
    table.string("ip_address", 45).nullable();
    table.string("device", 255).nullable();
    table.string("browser", 255).nullable();
    
  });
}

export function down (knex) {
  return knex.schema.dropTableIfExists("logstest");
}
