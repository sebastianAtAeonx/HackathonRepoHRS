export function up (knex) {
  return knex.schema.createTable("users", function (table) {
    table.increments("id").primary().unsigned();
    table.string("username", 255).nullable();
    table.string("firstname", 255).notNullable();
    table
      .integer("subscriber_id")
      .unsigned()
      .nullable()
      .references("id")
      .inTable("subscribers")
      .onDelete("NO ACTION")
      .onUpdate("NO ACTION");
    table.string("lastname", 255).notNullable();
    table.string("email", 255).notNullable();
    table.string("password", 35).notNullable();
    table
      .enum("status", ["1", "0"])
      .notNullable()
      .defaultTo("1")
      .comment("1=active,0=inactive");
    table.string("role", 255).notNullable().defaultTo("1");
    table.integer("level").nullable();
    table.string("approverofdept", 255).nullable();
    table.string("location", 255).nullable();
    table.string("token", 255).nullable();
    table.timestamp("token_expiry").nullable();
    table.string("modifiedBy",255).nullable();
    table.timestamp("created").nullable().defaultTo(knex.fn.now());
    table
      .timestamp("updated")
      .defaultTo(knex.raw("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"));
    table.index(["subscriber_id"], "FK_users_subscribers");
  });
}

export function down (knex) {
  return knex.schema.dropTableIfExists("users");
}
