export function up(knex) {
    return knex.schema.createTable('email_logs', function(table) {
      table.increments('id').primary().unsigned();
      table.string('fromemail', 255).nullable();
      table.string('toemail', 255).nullable();
      table.string('subject', 255).nullable();
      table.text('body').nullable();
      table.timestamp('createdAt').nullable().defaultTo(knex.fn.now());
      table
      .timestamp("updatedAt")
      .defaultTo(knex.raw("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"));
    });
  }
  
  export function down(knex) {
    return knex.schema.dropTableIfExists('email_logs');
  }
  