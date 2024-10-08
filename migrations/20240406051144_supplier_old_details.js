export function up(knex) {
  return knex.schema.createTable("supplier_old_details", function (table) {
    table.increments("id").primary();
    table.string("supplierId", 50).nullable().defaultTo(null);

    table.string("supplierName", 250).nullable().defaultTo(null);
    table.string("emailId", 100).nullable().defaultTo(null);
    table.string("password", 100).nullable().defaultTo(null);
    table.string("mobile", 15).nullable().defaultTo(null);
    table.string("telephone", 20).nullable().defaultTo(null);
    table.string("designation", 100).nullable().defaultTo(null);
    table.string("contactPersonName", 250).nullable().defaultTo(null);
    table.string("cinNo", 15).nullable().defaultTo(null);
    table.string("aadharNo", 15).nullable().defaultTo(null);
    table.string("officeDetails", 250).nullable().defaultTo(null);
    table.string("paymentMethod", 100).nullable().defaultTo(null);
    table.string("website", 250).nullable().defaultTo(null);
    table.string("phoneNo", 20).nullable().defaultTo(null);
    table.string("pin", 10).nullable().defaultTo(null);
    table.string("city", 100).nullable().defaultTo(null);
    table.string("countryCode", 5).nullable().defaultTo(null);
    table.string("address3", 250).nullable().defaultTo(null);
    table.string("address2", 250).nullable().defaultTo(null);
    table.string("address1", 250).nullable().defaultTo(null);
    table.string("streetNo", 250).nullable().defaultTo(null);
    table.string("source", 100).nullable().defaultTo(null);
    table.string("state", 80).nullable().defaultTo(null);
    table.string("departmentId", 100).nullable().defaultTo(null);
    table.string("department", 250).nullable().defaultTo(null);
    table.string("sapCode", 20).nullable().defaultTo(null);
    table.string("comment", 250).nullable().defaultTo(null);
    table.string("gstNo", 20).nullable().defaultTo(null);
    table.string("panNo", 20).nullable().defaultTo(null);
    table.string("companyFoundYear", 5).nullable().defaultTo(null);
    table.string("msmeNo", 25).nullable().defaultTo(null);
    table.string("msmeType", 20).nullable().defaultTo(null);
    table.string("promoterName", 100).nullable().defaultTo(null);
    table.string("companyType", 50).nullable().defaultTo(null);
    table.string("nameOfBusiness", 250).nullable().defaultTo(null);
    table.string("businessType", 100).nullable().defaultTo(null);
    table.string("addressOfPlant", 250).nullable().defaultTo(null);
    table.string("nameOfOtherGroupCompanies", 250).nullable().defaultTo(null);
    table.string("listOfMajorCustomers", 250).nullable().defaultTo(null);
    table.string("detailsOfMajorLastYear", 20).nullable().defaultTo(null);
    table.string("currency", 20).nullable().defaultTo(null);
    table.string("turnover", 50).nullable().defaultTo(null);
    table.string("turnover2", 50).nullable().defaultTo(null);
    table.string("turnover3", 50).nullable().defaultTo(null);
    table.string("first", 50).nullable().defaultTo(null);
    table.string("second", 50).nullable().defaultTo(null);
    table.string("third", 50).nullable().defaultTo(null);
    table.string("afterFirst", 50).nullable().defaultTo(null);
    table.string("afterSec", 50).nullable().defaultTo(null);
    table.string("afterThird", 50).nullable().defaultTo(null);
    table.string("presentOrder", 50).nullable().defaultTo(null);
    table.string("furtherOrder", 50).nullable().defaultTo(null);
    table.string("market", 50).nullable().defaultTo(null);
    table.string("networth", 50).nullable().defaultTo(null);
    table.string("pBankName", 100).nullable().defaultTo(null);
    table.string("pBankAccNumber", 50).nullable().defaultTo(null);
    table.string("pBankAccHolderName", 250).nullable().defaultTo(null);
    table.string("pBankState", 20).nullable().defaultTo(null);
    table.string("pBankAdd", 250).nullable().defaultTo(null);
    table.string("pBankBranch", 100).nullable().defaultTo(null);
    table.string("pIfscCode", 20).nullable().defaultTo(null);
    table.string("pMicrCode", 20).nullable().defaultTo(null);
    table.string("pBankGuaranteeLimit", 50).nullable().defaultTo(null);
    table.string("pOverdraftCashCreditLimit", 50).nullable().defaultTo(null);
    table.string("sBankName", 100).nullable().defaultTo(null);
    table.string("sBankAccNumber", 50).nullable().defaultTo(null);
    table.string("sBankAccHolderName", 250).nullable().defaultTo(null);
    table.string("sBankState", 20).nullable().defaultTo(null);
    table.string("sBankAdd", 250).nullable().defaultTo(null);
    table.string("sBankBranch", 100).nullable().defaultTo(null);
    table.string("sIfscCode", 20).nullable().defaultTo(null);
    table.string("sMicrCode", 20).nullable().defaultTo(null);
    table.string("sBankGuaranteeLimit", 50).nullable().defaultTo(null);
    table.string("sOverdraftCashCreditLimit", 50).nullable().defaultTo(null);
    table.text("msmeImage").nullable().defaultTo(null);
    table.text("gstImage").nullable().defaultTo(null);
    table.text("cancelledChequeImage").nullable().defaultTo(null);
    table.text("panCardImage").nullable().defaultTo(null);
    table.text("pfAttachment").nullable().defaultTo(null);
    table.text("otherAttachment").nullable().defaultTo(null);
    table.string("regDate", 50).nullable().defaultTo(null);
    table.text("companies").nullable().defaultTo(null);
    table.integer("reconciliationAc").nullable().defaultTo(null);
    table.integer("vendorClass").nullable().defaultTo(null);
    table.integer("vendorSchema").nullable().defaultTo(null);
    table.integer("businessPartnerGroups").nullable().defaultTo(null);
    table.integer("paymentTerms").nullable().defaultTo(null);
    table.integer("purchaseGroup").nullable().defaultTo(null);
    table.text("itWitholding").nullable().defaultTo(null);
    table.string("modifiedBy", 255).nullable();
    table.timestamp("createdAt").defaultTo(knex.fn.now());
    table
      .timestamp("updated_at")
      .defaultTo(knex.raw("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"));
  });
}

export function down(knex) {
  return knex.schema.dropTableIfExists("supplier_old_details");
}
