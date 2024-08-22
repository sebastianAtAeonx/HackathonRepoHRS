export function up(knex) {
    return knex.schema.createTable('asn_print_settings', function(table) {
      table.increments('id').primary();
      table.string('supplier_id', 255).nullable();
      table.enum('gstHide', ['1','0']).notNullable().defaultTo('0');
      table.enum('asnHide', ['1','0']).notNullable().defaultTo('0');
      table.enum('supplierHide', ['1','0']).notNullable().defaultTo('0');
      table.enum('emailHide', ['1','0']).notNullable().defaultTo('0');
      table.enum('addressHide', ['1','0']).notNullable().defaultTo('0');
      table.enum('panHide', ['1','0']).nullable().defaultTo('0');
      table.enum('orderLineHide', ['1','0']).nullable().defaultTo('0');
      table.enum('billaddressHide', ['1','0']).nullable().defaultTo('0');
      table.enum('supplieraddressHide', ['1','0']).nullable().defaultTo('0');
      table.enum('inrHide', ['1','0']).nullable().defaultTo('0');
      table.enum('ewayHide', ['1','0']).nullable().defaultTo('0');
      table.enum('invoiceHide', ['1','0']).nullable().defaultTo('0');
      table.string("modifiedBy",255).nullable();
      table.timestamp("created_at").notNullable().defaultTo(knex.fn.now());
    table
      .timestamp("updated_at")
      .defaultTo(knex.raw("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"));
    });
  }
  
  export function down(knex) {
    return knex.schema.dropTableIfExists('asn_print_settings');
  }
  