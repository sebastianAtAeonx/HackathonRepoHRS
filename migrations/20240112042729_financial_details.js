/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function up(knex) {
  return knex.schema.createTable("financial_details", function (table) {
    table.string("id", 36).notNullable().primary();
    table.string("company_id", 36).nullable().comment("supplierID");
    table.string("currency", 255).nullable();
    table.string("turnover", 255).nullable();
    table.string("turnover2", 255).nullable();
    table.string("turnover3", 255).nullable();
    table.string("first", 255).nullable();
    table.string("second", 255).nullable();
    table.string("third", 255).nullable();
    table.string("afterfirst", 255).nullable();
    table.string("aftersecond", 255).nullable();
    table.string("afterthird", 255).nullable();
    table.string("presentorder", 255).nullable();
    table.string("furtherorder", 255).nullable();
    table.string("market", 255).nullable();
    table.string("networth", 255).nullable();
    table.string("p_bank_name", 255).nullable();
    table.string("p_bank_account_number", 255).nullable();
    table.string("p_bank_account_holder_name", 255).nullable();
    table.string("p_bank_state", 255).nullable();
    table.string("p_bank_address", 255).nullable();
    table.string("p_bank_branch", 255).nullable();
    table.string("p_ifsc_code", 255).nullable();
    table.string("p_micr_code", 255).nullable();
    table.string("p_bank_guarantee_limit", 255).nullable();
    table.string("p_overdraft_cash_credit_limit", 255).nullable();
    table.string("s_bank_name", 255).nullable();
    table.string("s_bank_account_number", 255).nullable();
    table.string("s_bank_account_holder_name", 255).nullable();
    table.string("s_bank_state", 255).nullable();
    table.string("s_bank_address", 255).nullable();
    table.string("s_bank_branch", 255).nullable();
    table.string("s_ifsc_code", 255).nullable();
    table.string("s_micr_code", 255).nullable();
    table.string("s_bank_guarantee_limit", 255).nullable();
    table.string("s_overdraft_cash_credit_limit", 255).nullable();
    table.string("modifiedBy", 255).nullable();
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
  return knex.schema.dropTable("financial_details");
}
