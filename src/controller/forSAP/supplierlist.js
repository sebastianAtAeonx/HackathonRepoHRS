import knex from "../../config/mysql_db.js";
import s3 from "../../s3/s3.js";
import ses from "../../helpers/ses.js";
import constants from "../../helpers/constants.js";
import { v4 as uuidv4 } from "uuid";
import md5 from "md5";
import supplierLogs from "../../logs/logs.js";
import emailvalidator from "email-validator";
import functions from "../../helpers/functions.js";
import axios from "axios";
import AWS from "aws-sdk";
import path from "path";
import approverEmail from "../../emails/approverEmail.js";
import ExcelJS from "exceljs";
import moment from "moment-timezone";
import validation from "../../validation/forSap/supplierlist.js";
import notification from "../notification.js";
import jwt from "jsonwebtoken";
const listSupplier = async (req, res) => {
  try {
    let data;
    data = await knex("supplier_details").select("id", "sap_code", "status");

    let newdata = [];
    let srno = 1;
    for (const iterator of data) {
      if (iterator.sap_code == null && iterator.status === "approved") {
        newdata.push(iterator);
        iterator.srno = srno++;
        //iterator.action = "N";
      }
    }

    let businessDetails = [];
    let financialDetails = [];
    let taxDetails = [];
    let additionalDetails = [];

    for (const iterator of newdata) {
      const getBusinessDetails = await knex("business_details")
        .where({ company_id: iterator.id })
        .select();
      const getFinancialDetails = await knex("financial_details")
        .where({ company_id: iterator.id })
        .select();
      const getTaxDetails = await knex("tax_details")
        .where({ company_id: iterator.id })
        .select();
      const getAdditionalDetails = await knex("additional_company_details")
        .where({ supplier_id: iterator.id })
        .select();

      if (getBusinessDetails) {
        iterator.businessDetails = getBusinessDetails;
      }

      if (getFinancialDetails) {
        iterator.financialDetails = getFinancialDetails;
      }

      if (getTaxDetails) {
        iterator.taxDetails = getTaxDetails;
      }

      if (getAdditionalDetails) {
        iterator.additionalDetails = getAdditionalDetails;
        let additionalDetails = iterator.additionalDetails;
        for (const add of additionalDetails) {
          const getReconDetails = await knex("reconciliation_ac")
            .where({ id: add.reconciliation_ac })
            .select();
          add.reconciliation_ac = getReconDetails;

          const vendorClassDetails = await knex("vendor_class")
            .where({ id: add.vendor_class })
            .select();
          add.vendor_class = vendorClassDetails;

          const vendorSchema = await knex("vendor_schemas")
            .where({ id: add.vendor_schema })
            .select();
          add.vendor_schema = vendorSchema;

          const businessPartnerGroup = await knex("business_partner_groups")
            .where({ id: add.business_partner_groups })
            .select();
          add.business_partner_groups = businessPartnerGroup;

          const parsedCompanyIds = JSON.parse(add.companies);

          const temp_data = [];
          for (const idx of parsedCompanyIds) {
            const companiesDetails = await knex("companies")
              .where({ id: idx })
              .select();
            temp_data.push(companiesDetails);
          }
          add.companies = temp_data;
        }
      }
    }

    return res.json({
      error: false,
      message: "Data retrived successfully",
      total: newdata.length,
      data: newdata,
    });
  } catch (error) {
    return res.json({
      error: true,
      message: "Something went wrong",
      data: JSON.stringify(error),
    });
  }
};

const updateToday = async (req, res) => {
  try {
    const data = await knex("supplier_details").select();

    const updatedData = [];

    for (const iterator of data) {
      const id = iterator.id;
      const hasSapCode = iterator.sap_code !== null;

      const getBusinessDetails = await knex("business_details")
        .where({ company_id: id })
        .select();
      const getFinancialDetails = await knex("financial_details")
        .where({ company_id: id })
        .select();
      const getTaxDetails = await knex("tax_details")
        .where({ company_id: id })
        .select();

      const getAdditionalDetails = await knex("additional_company_details")
        .where({ supplier_id: id })
        .select();

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      let updatedToday = false;
      let updatedFields = [];

      for (const detail of getBusinessDetails) {
        if (detail.updated_at instanceof Date && detail.updated_at >= today) {
          updatedToday = true;
          updatedFields.push("business_details");
          break;
        }
      }

      if (!updatedToday) {
        for (const detail of getFinancialDetails) {
          if (detail.updated_at instanceof Date && detail.updated_at >= today) {
            updatedToday = true;
            updatedFields.push("financial_details");
            break;
          }
        }
      }

      if (!updatedToday) {
        for (const detail of getTaxDetails) {
          if (detail.updated_at instanceof Date && detail.updated_at >= today) {
            updatedToday = true;
            updatedFields.push("tax_details");
            break;
          }
        }
      }

      for (const detail of getAdditionalDetails) {
        if (detail.updated_at instanceof Date && detail.updated_at >= today) {
          updatedToday = true;
          updatedFields.push("additional_company_details");
          break;
        }
      }

      if (updatedToday) {
        updatedData.push({
          supplier: {
            ...iterator,
            updatedFields: updatedFields,
            action: hasSapCode ? "U" : "N",
          },
          businessDetails: getBusinessDetails,
          financialDetails: getFinancialDetails,
          taxDetails: getTaxDetails,
          additionalDetails: getAdditionalDetails,
        });
      }
    }

    let srno = 1;
    for (const iterator of updatedData) {
      iterator.srno = srno++;
    }

    if (updatedData.length > 0) {
      return res.json({
        total: updatedData.length,
        data: updatedData,
      });
    } else {
      return res.json({
        error: true,
        message: "No updated records found today.",
      });
    }
  } catch (error) {
    fun.sendErrorLog(req, error);
    return res.json({
      error: true,
      message: "Something went wrong.",
      data: { error: JSON.stringify(error) },
    });
  }
};

const viewSupplier = async (req, res) => {
  try {
    const FixedPath = `${constants.admindetails.homePageUrl}content-server/`;

    const { error, value } = validation.viewSupplier(req.params);

    const { id } = value;

    const getSupplierDetails = await knex("supplier_details").where({ id: id });

    if (getSupplierDetails <= 0) {
      return res.json({
        error: true,
        message: "Supplier does not exist",
      });
    }

    delete getSupplierDetails[0].password;

    if (getSupplierDetails[0].created_at != getSupplierDetails[0].updated_at) {
      getSupplierDetails[0].action = "U";
    } else if (getSupplierDetails[0].sap_code == null) {
      getSupplierDetails[0].action = "N";
    }

    const getBusinessDetails = await knex("business_details").where({
      company_id: id,
    });

    const getFinancialDetails = await knex("financial_details").where({
      company_id: id,
    });

    const getTaxDetails = await knex("tax_details").where({ company_id: id });

    const getAdditionalDetails = await knex("additional_company_details").where(
      {
        supplier_id: id,
      }
    );

    if (getBusinessDetails.length > 0) {
      getSupplierDetails[0].businessDetails = getBusinessDetails;
    } else {
      getSupplierDetails[0].businessDetails = [];
    }

    if (getFinancialDetails.length > 0) {
      getSupplierDetails[0].financialDetails = getFinancialDetails;
    } else {
      getSupplierDetails[0].financialDetails = [];
    }

    if (getTaxDetails.length > 0) {
      for (const iterator of getTaxDetails) {
        if (iterator.msmeImage != "") {
          iterator.msmeImage = FixedPath + iterator.msmeImage;
        }
        if (iterator.gstImage != "") {
          iterator.gstImage = FixedPath + iterator.gstImage;
        }
        if (iterator.cancelledChequeImage != "") {
          iterator.cancelledChequeImage =
            FixedPath + iterator.cancelledChequeImage;
        }
        if (iterator.panCardImage != "") {
          iterator.panCardImage = FixedPath + iterator.panCardImage;
        }

        if (iterator.pfAttachment != "") {
          iterator.pfAttachment = FixedPath + iterator.pfAttachment;
        }

        if (iterator.otherAttachments != "") {
          iterator.otherAttachments = FixedPath + iterator.otherAttachments;
        }
      }

      getSupplierDetails[0].taxDetails = getTaxDetails;
    } else {
      getSupplierDetails[0].taxDetails = [];
    }

    if (getAdditionalDetails.length > 0) {
      getSupplierDetails[0].additionalDetails = getAdditionalDetails;
    } else {
      getSupplierDetails[0].additionalDetails = [];
    }

    return res.json({
      error: false,
      message: "data retrived",
      data: getSupplierDetails,
    });
  } catch (error) {
    fun.sendErrorLog(req, error);
    return res.json({
      error: true,
      message: "Something went wrong.",
      data: { error: JSON.stringify(error) },
    });
  }
};

const sendToSap = async (req, res) => {
  try {
    console.log("url:", constants.admindetails.homePageUrl);
    const FixedPath = `${constants.admindetails.homePageUrl}content-server/`;
    //"https://ashapura.supplierx.aeonx.digital/content-server/";
    //query_1 section 1
    const getData = await knex("supplier_details")
      .select(
        "*",
        "supplier_name as supplierName",
        "department_id as departmentId",
        "sap_code as sapCode",
        "sap_code_time as sapCodeTime",
        "status_update_date as statusUpdateDate",
        "subscriber_id as subscriberId",
        "created_at as createdAt",
        "updated_at as updatedAt",
        "sap_status as sapStatus"
      )
      .whereNull("sap_code")
      .where("status", "=", "approved");

    let srno = 1;
    console.log("getData1 is running");

    for (const iterator of getData) {
      iterator.action = "N";
      iterator.srno = srno++;

      const getPaymentMethod = await knex("payment_types")
        .where("id", iterator.paymentMethod)
        .first()
        .select("code");
      if (getPaymentMethod != undefined) {
        iterator.paymentMethod = getPaymentMethod.code;
      }

      const getSource = await knex("company_source")
        .where("id", iterator.source)
        .first()
        .select("name");
      if (getSource != undefined) {
        iterator.source = getSource.name;
      }

      const getdeapartmentName = await knex("business_partner_groups")
        .where("id", iterator.department_id)
        .select("name")
        .first();

      iterator.department = getdeapartmentName ? getdeapartmentName.name : "";

      // const selectStateCountry = await knex("states").where(
      //   "stateDesc",
      //   iterator.state
      // );

      iterator.countryCode = iterator.country;
      iterator.stateCode = iterator.state;

      //country-state-code settings///start
      const getCountryName = await knex("countries")
        .where("country_key", iterator.countryCode)
        .first()
        .select("name");
      iterator.country = getCountryName ? getCountryName.name : "";

      const getStateName = await knex("states")
        .where("countryKey", iterator.countryCode)
        .where("stateKey", iterator.stateCode)
        .first()
        .select("stateDesc");
      iterator.state = getStateName ? getStateName.stateDesc : "";

      //country-state-code settings///////over

      delete iterator.password;
      delete iterator.supplier_name;
      delete iterator.tds_type;
      delete iterator.tds_code;
      delete iterator.tds_subject;
      delete iterator.tds_receipent;
      delete iterator.departmentId;
      delete iterator.department_id;
      delete iterator.sap_code;
      delete iterator.sap_code_time;
      delete iterator.sap_status;
      delete iterator.status_update_date;
      delete iterator.subscriber_id;
      delete iterator.created_at;
      delete iterator.updated_at;

      const getBusinessDetails = await knex("business_details")
        .where("company_id", iterator.id)
        .select(
          "*",
          "company_id as supplierId",
          "msme_no as msmeNo",
          "created_at as createdAt",
          "updated_at as updatedAt"
        );

      if (getBusinessDetails.length > 0) {
        for (const gbd of getBusinessDetails) {
          delete gbd.company_id;
          delete gbd.msme_no;
          delete gbd.created_at;
          delete gbd.updated_at;
          const getMsmeCode = await knex("minority_indicator")
            .where("id", gbd.msmeType)
            .first();
          if (gbd.msmeType != null || gbd.msmeType != "") {
            if (getMsmeCode) {
              gbd.msmeType = getMsmeCode.min_ind;
            }
          }
        }
      }

      const getFinancialDetails = await knex("financial_details")
        .where("company_id", iterator.id)
        .select(
          "*",
          "company_id as supplierId",
          "p_bank_name as primaryBankName",
          "p_bank_account_number as primaryBankAccountNumber",
          "p_bank_account_holder_name as primaryBankAccountHolderName",
          "p_bank_state as primaryBankState",
          "p_bank_address as primaryBankAddress",
          "p_bank_branch as primaryBankBranch",
          "p_ifsc_code as primaryIfscCode",
          "p_micr_code as primaryMicrCode",
          "p_bank_guarantee_limit as primaryBankGuaranteeLimit",
          "p_overdraft_cash_credit_limit as primaryOverdraftCashCreditLimit",
          "s_bank_name as secondaryBankName",
          "s_bank_account_number as secondaryBankAccountNumber",
          "s_bank_account_holder_name as secondaryBankAccountHolderName",
          "s_bank_state as secondaryBankState",
          "s_bank_address as secondaryBankAddress",
          "s_bank_branch as secondaryBankBranch",
          "s_ifsc_code as secondaryIfscCode",
          "s_micr_code as secondaryMicrCode",
          "s_bank_guarantee_limit as secondaryBankGuaranteeLimit",
          "s_overdraft_cash_credit_limit as secondaryOverdraftCashCreditLimit",
          "created_at as createdAt",
          "updated_at as updatedAt"
        );

      if (getFinancialDetails.length > 0) {
        for (const gfd of getFinancialDetails) {
          delete gfd.company_id;
          delete gfd.p_bank_name;
          delete gfd.p_bank_account_number;
          delete gfd.p_bank_account_holder_name;
          delete gfd.p_bank_state;
          delete gfd.p_bank_address;
          delete gfd.p_bank_branch;
          delete gfd.p_ifsc_code;
          delete gfd.p_micr_code;
          delete gfd.p_bank_guarantee_limit;
          delete gfd.p_overdraft_cash_credit_limit;
          delete gfd.s_bank_name;
          delete gfd.s_bank_account_number;
          delete gfd.s_bank_account_holder_name;
          delete gfd.s_bank_state;
          delete gfd.s_bank_address;
          delete gfd.s_bank_branch;
          delete gfd.s_ifsc_code;
          delete gfd.s_micr_code;
          delete gfd.s_bank_guarantee_limit;
          delete gfd.s_overdraft_cash_credit_limit;
          delete gfd.created_at;
          delete gfd.updated_at;
        }
      }

      const getTaxDetails = await knex("tax_details")
        .where("company_id", iterator.id)
        .select(
          "*",
          "company_id as supplierId",
          "created_at as createdAt",
          "updated_at as updatedAt"
        );

      for (const iterator of getTaxDetails) {
        delete iterator.company_id;
        delete iterator.created_at;
        delete iterator.updated_at;

        if (iterator.msmeImage != "") {
          iterator.msmeImage = FixedPath + iterator.msmeImage;
        }
        if (iterator.gstImage != "") {
          iterator.gstImage = FixedPath + iterator.gstImage;
        }
        if (iterator.cancelledChequeImage != "") {
          iterator.cancelledChequeImage =
            FixedPath + iterator.cancelledChequeImage;
        }
        if (iterator.panCardImage != "") {
          iterator.panCardImage = FixedPath + iterator.panCardImage;
        }

        if (iterator.pfAttachment != "") {
          iterator.pfAttachment = FixedPath + iterator.pfAttachment;
        }

        if (iterator.otherAttachments != "") {
          iterator.otherAttachments = FixedPath + iterator.otherAttachments;
        }
      }

      const getAdditionalDetails = await knex("additional_company_details")
        .where("supplier_id", iterator.id)
        .select(
          "*",
          "supplier_id as supplierId",
          "payment_terms as paymentTerms",
          "reconciliation_ac as reconciliationAc",
          "vendor_class as vendorClass",
          "vendor_schema as vendorSchema",
          "business_partner_groups as businessPartnerGroups",
          "created_at as createdAt",
          "purchase_group as purchaseGroup",
          "updated_at"
        );

      //t2
      for (const iterator of getAdditionalDetails) {
        iterator.itWitholding = JSON.parse(iterator.itWitholding);
        delete iterator.purchase_group;

        const getPurchaseGroupCode = await knex("purchase_groups")
          .where("id", iterator.purchaseGroup)
          .first();
        if (getPurchaseGroupCode != undefined) {
          iterator.purchaseGroup = getPurchaseGroupCode.code;
        }

        const parse = JSON.parse(iterator.companies);
        const companies = await knex("companies")
          .whereIn("id", parse)
          .select("code");

        const companyCodes = companies.map((company) => company.code);
        iterator.companies = companyCodes;
      }

      if (getBusinessDetails.length > 0) {
        iterator.businessDetails = getBusinessDetails;
      } else {
        iterator.businessDetails = [];
      }
      if (getFinancialDetails.length > 0) {
        for (const gfd of getFinancialDetails) {
          const getCurrencyCode = await knex("currencies")
            .where("id", gfd.currency)
            .first()
            .select("code");
          if (getCurrencyCode != undefined) {
            gfd.currency = getCurrencyCode.code;
          }
        }

        iterator.financialDetails = getFinancialDetails;
      } else {
        iterator.financialDetails = [];
      }
      if (getTaxDetails.length > 0) {
        iterator.taxDetails = getTaxDetails;
      } else {
        iterator.taxDetails = [];
      }
      if (getAdditionalDetails.length > 0) {
        for (const gad of getAdditionalDetails) {
          const getVendorClassCode = await knex("vendor_class")
            .where("id", gad.vendorClass)
            .first()
            .select("code");
          if (getVendorClassCode != undefined) {
            gad.vendorClass = getVendorClassCode.code;
          }

          const getReconcilitationAc = await knex("reconciliation_ac")
            .where("id", gad.reconciliationAc)
            .first()
            .select("code");

          if (getReconcilitationAc != undefined) {
            gad.reconciliationAc = getReconcilitationAc.code;
          }

          const getVendorSchemaCode = await knex("vendor_schemas")
            .where("id", gad.vendorSchema)
            .first()
            .select("code");
          if (getVendorSchemaCode != undefined) {
            gad.vendorSchema = getVendorSchemaCode.code;
          }

          const getPaymentTermsCode = await knex("payment_terms")
            .where("id", gad.paymentTerms)
            .first()
            .select("code");
          if (getPaymentTermsCode != undefined) {
            gad.paymentTerms = getPaymentTermsCode.code;
          }

          const getBusinessPartnerGroup = await knex("business_partner_groups")
            .where("id", gad.businessPartnerGroups)
            .first()
            .select("code");
          if (getBusinessPartnerGroup != undefined) {
            gad.businessPartnerGroups = getBusinessPartnerGroup.code;
          }
        }

        iterator.additionalDetails = getAdditionalDetails;
      } else {
        iterator.additionalDetails = [];
      }

      if (getAdditionalDetails.length > 0) {
        for (const gad of getAdditionalDetails) {
          delete gad.supplier_id;
          delete gad.reconciliation_ac;
          delete gad.vendor_class;
          delete gad.vendor_schema;
          delete gad.business_partner_groups;
          delete gad.created_at;
          delete gad.updated_at;
          delete gad.payment_terms;
        }
      }
    }
    //query_2 section 2
    const getData2 = await knex("supplier_details")
      .select(
        "*",
        "supplier_name as supplierName",
        "department_id as departmentId",
        "sap_code as sapCode",
        "sap_code_time as sapCodeTime",
        "status_update_date as statusUpdateDate",
        "subscriber_id as subscriberId",
        "created_at as createdAt",
        "updated_at as updatedAt",
        "sap_status as sapStatus"
      )
      .whereNull("sap_code") //use whereNotNull - todo
      .whereRaw("sap_code_time < updated_at");
    // .whereNotNull("sap_code_time")
    // .where("status", "=", "approved");
    console.log("getData2 is running");

    for (const iterator of getData2) {
      if (iterator.sap_code_time != iterator.updated_at) {
        iterator.action = "U";
      } else {
        continue;
      }
      iterator.srno = srno++;

      const getPaymentMethod = await knex("payment_types")
        .where("id", iterator.paymentMethod)
        .first()
        .select("code");
      if (getPaymentMethod != undefined) {
        iterator.paymentMethod = getPaymentMethod.code;
      }

      const getSource = await knex("company_source")
        .where("id", iterator.source)
        .first()
        .select("name");
      if (getSource != undefined) {
        iterator.source = getSource.name;
      }

      const getdeapartmentName = await knex("business_partner_groups")
        .where("id", iterator.department_id)
        .select("name")
        .first();

      iterator.department = getdeapartmentName ? getdeapartmentName.name : "";

      // const selectStateCountry = await knex("states").where(
      //   "stateDesc",
      //   iterator.state
      // );

      iterator.countryCode = iterator.country;
      iterator.stateCode = iterator.state;
      //country-state-code settings///start
      const getCountryName = await knex("countries")
        .where("country_key", iterator.countryCode)
        .first()
        .select("name");
      iterator.country = getCountryName ? getCountryName.name : "";

      const getStateName = await knex("states")
        .where("countryKey", iterator.countryCode)
        .where("stateKey", iterator.stateCode)
        .first()
        .select("stateDesc");
      iterator.state = getStateName ? getStateName.stateDesc : "";

      //country-state-code settings///////over

      delete iterator.password;
      delete iterator.supplier_name;
      delete iterator.tds_type;
      delete iterator.tds_code;
      delete iterator.tds_subject;
      delete iterator.tds_receipent;
      delete iterator.departmentId;
      delete iterator.department_id;
      delete iterator.sap_code;
      delete iterator.sap_code_time;
      delete iterator.sap_status;
      delete iterator.status_update_date;
      delete iterator.subscriber_id;
      delete iterator.created_at;
      delete iterator.updated_at;

      const getBusinessDetails = await knex("business_details")
        .where("company_id", iterator.id)
        .select(
          "*",
          "company_id as supplierId",
          "msme_no as msmeNo",
          "created_at as createdAt",
          "updated_at as updatedAt"
        );

      if (getBusinessDetails.length > 0) {
        for (const gbd of getBusinessDetails) {
          delete gbd.company_id;
          delete gbd.msme_no;
          delete gbd.created_at;
          delete gbd.updated_at;
          const getMsmeCode = await knex("minority_indicator")
            .where("id", gbd.msmeType)
            .first();
          if (gbd.msmeType != null && gbd.msmeType != "") {
            gbd.msmeType = getMsmeCode.min_ind;
          }
        }
      }

      const getFinancialDetails = await knex("financial_details")
        .where("company_id", iterator.id)
        .select(
          "*",
          "company_id as supplierId",
          "p_bank_name as primaryBankName",
          "p_bank_account_number as primaryBankAccountNumber",
          "p_bank_account_holder_name as primaryBankAccountHolderName",
          "p_bank_state as primaryBankState",
          "p_bank_address as primaryBankAddress",
          "p_bank_branch as primaryBankBranch",
          "p_ifsc_code as primaryIfscCode",
          "p_micr_code as primaryMicrCode",
          "p_bank_guarantee_limit as primaryBankGuaranteeLimit",
          "p_overdraft_cash_credit_limit as primaryOverdraftCashCreditLimit",
          "s_bank_name as secondaryBankName",
          "s_bank_account_number as secondaryBankAccountNumber",
          "s_bank_account_holder_name as secondaryBankAccountHolderName",
          "s_bank_state as secondaryBankState",
          "s_bank_address as secondaryBankAddress",
          "s_bank_branch as secondaryBankBranch",
          "s_ifsc_code as secondaryIfscCode",
          "s_micr_code as secondaryMicrCode",
          "s_bank_guarantee_limit as secondaryBankGuaranteeLimit",
          "s_overdraft_cash_credit_limit as secondaryOverdraftCashCreditLimit",
          "created_at as createdAt",
          "updated_at as updatedAt"
        );

      if (getFinancialDetails.length > 0) {
        for (const gfd of getFinancialDetails) {
          delete gfd.company_id;
          delete gfd.p_bank_name;
          delete gfd.p_bank_account_number;
          delete gfd.p_bank_account_holder_name;
          delete gfd.p_bank_state;
          delete gfd.p_bank_address;
          delete gfd.p_bank_branch;
          delete gfd.p_ifsc_code;
          delete gfd.p_micr_code;
          delete gfd.p_bank_guarantee_limit;
          delete gfd.p_overdraft_cash_credit_limit;
          delete gfd.s_bank_name;
          delete gfd.s_bank_account_number;
          delete gfd.s_bank_account_holder_name;
          delete gfd.s_bank_state;
          delete gfd.s_bank_address;
          delete gfd.s_bank_branch;
          delete gfd.s_ifsc_code;
          delete gfd.s_micr_code;
          delete gfd.s_bank_guarantee_limit;
          delete gfd.s_overdraft_cash_credit_limit;
          delete gfd.created_at;
          delete gfd.updated_at;
        }
      }
      const getTaxDetails = await knex("tax_details")
        .where("company_id", iterator.id)
        .select(
          "*",
          "company_id as companyId",
          "created_at as createdAt",
          "updated_at as updatedAt"
        );

      if (getTaxDetails.length > 0) {
        for (const iterator of getTaxDetails) {
          delete iterator.company_id;
          delete iterator.created_at;
          delete iterator.updated_at;

          if (iterator.msmeImage != "") {
            iterator.msmeImage = FixedPath + iterator.msmeImage;
          }
          if (iterator.gstImage != "") {
            iterator.gstImage = FixedPath + iterator.gstImage;
          }
          if (iterator.cancelledChequeImage != "") {
            iterator.cancelledChequeImage =
              FixedPath + iterator.cancelledChequeImage;
          }

          if (iterator.panCardImage != "") {
            iterator.panCardImage = FixedPath + iterator.panCardImage;
          }

          if (iterator.pfAttachment != "") {
            iterator.pfAttachment = FixedPath + iterator.pfAttachment;
          }

          if (iterator.otherAttachments != "") {
            iterator.otherAttachments = FixedPath + iterator.otherAttachments;
          }
        }
      }
      const getAdditionalDetails = await knex("additional_company_details")
        .where("supplier_id", iterator.id)
        .select(
          "*",
          "supplier_id as supplierId",
          "reconciliation_ac as reconciliationAc",
          "vendor_class as vendorClass",
          "vendor_schema as vendorSchema",
          "business_partner_groups as businessPartnerGroups",
          "created_at as createdAt",
          "updated_at as updatedAt",
          "purchase_group as purchaseGroup",
          "payment_terms as paymentTerms"
        );
      //t1
      for (const iterator of getAdditionalDetails) {
        iterator.itWitholding = JSON.parse(iterator.itWitholding);
        delete iterator.purchase_group;

        const getPurchaseGroupCode = await knex("purchase_groups")
          .where("id", iterator.purchaseGroup)
          .first()
          .select("code");

        iterator.purchaseGroup = getPurchaseGroupCode
          ? getPurchaseGroupCode.code
          : "";

        const parse = JSON.parse(iterator.companies);
        const companies = await knex("companies")
          .whereIn("id", parse)
          .select("code");

        const companyCodes = companies.map((company) => company.code);
        iterator.companies = companyCodes;

        delete iterator.payment_terms;
        delete iterator.supplier_id;

        if (iterator.paymentTerms != "") {
          const getPaymentTerms = await knex("payment_terms")
            .where("id", iterator.paymentTerms)
            .first()
            .select("code");
          iterator.paymentTerms = getPaymentTerms ? getPaymentTerms.code : "";
        }
      }

      if (getBusinessDetails.length > 0) {
        iterator.businessDetails = getBusinessDetails;
      } else {
        iterator.businessDetails = [];
      }
      if (getFinancialDetails.length > 0) {
        for (const gfd of getFinancialDetails) {
          const getCurrencyCode = await knex("currencies")
            .where("id", gfd.currency)
            .first()
            .select("code");
          gfd.currency = getCurrencyCode ? getCurrencyCode.code : "";
        }

        iterator.financialDetails = getFinancialDetails;
      } else {
        iterator.financialDetails = [];
      }
      if (getTaxDetails.length > 0) {
        iterator.taxDetails = getTaxDetails;
      } else {
        iterator.taxDetails = [];
      }
      if (getAdditionalDetails.length > 0) {
        for (const gad of getAdditionalDetails) {
          const getVendorClassCode = await knex("vendor_class")
            .where("id", gad.vendorClass)
            .first()
            .select("code");
          gad.vendorClass = getVendorClassCode ? getVendorClassCode.code : "";

          const getReconcilitationAc = await knex("reconciliation_ac")
            .where("id", gad.reconciliationAc)
            .first()
            .select("code");

          gad.reconciliationAc = getReconcilitationAc
            ? getReconcilitationAc.code
            : "";

          const getVendorSchemaCode = await knex("vendor_schemas")
            .where("id", gad.vendorSchema)
            .first()
            .select("code");
          gad.vendorSchema = getVendorSchemaCode
            ? getVendorSchemaCode.code
            : "";

          const getBusinessPartnerGroup = await knex("business_partner_groups")
            .where("id", gad.businessPartnerGroups)
            .first()
            .select("code");
          gad.businessPartnerGroups = getBusinessPartnerGroup
            ? getBusinessPartnerGroup.code
            : "";

          delete gad.created_at;
          delete gad.updated_at;
          delete gad.reconciliation_ac;
          delete gad.vendor_class;
          delete gad.vendor_schema;
          delete gad.business_partner_groups;
        }

        iterator.additionalDetails = getAdditionalDetails;
      } else {
        iterator.additionalDetails = [];
      }
    }

    const combinedData = [...getData, ...getData2];
    return res.json({
      error: false,
      message: "data retrived",
      data: combinedData,
      total: getData.length + getData2.length,
    });
  } catch (error) {
    return res.json({
      error: true,
      message: "Something went wrong.",
      data: { error: JSON.stringify(error) },
    });
  }
};

const sendToSap2 = async (req, res) => {
  try {
    const FixedPath =
      //"https://ashapura.supplierx.aeonx.digital/content-server/";//path for production server
      "https://supplierx-assets.s3.ap-south-1.amazonaws.com/content-server/"; //path for devlopment server
    const getData = await knex("supplier_details")
      .select(
        "*",
        "supplier_name as supplierName",
        "department_id as departmentId",
        "sap_code as sapCode",
        "sap_code_time as sapCodeTime",
        "status_update_date as statusUpdateDate",
        "subscriber_id as subscriberId",
        "created_at as createdAt",
        "updated_at as updatedAt",
        "sap_status as sapStatus"
      )
      .whereNull("sap_code")
      .andWhere("status", "=", "approved");

    let srno = 1;

    for (const iterator of getData) {
      iterator.action = "N";
      iterator.srno = srno++;

      const getPaymentMethod = await knex("payment_types")
        .where("id", iterator.paymentMethod)
        .first()
        .select("code");
      if (getPaymentMethod != undefined) {
        iterator.paymentMethod = getPaymentMethod.code;
      }

      const getSource = await knex("company_source")
        .where("id", iterator.source)
        .first()
        .select("name");
      if (getSource != undefined) {
        iterator.source = getSource.name;
      }

      const getdeapartmentName = await knex("business_partner_groups")
        .where("id", iterator.department_id)
        .select("name")
        .first();

      iterator.department = getdeapartmentName ? getdeapartmentName.name : "";

      // const selectStateCountry = await knex("states").where(
      //   "stateDesc",
      //   iterator.state
      // );

      iterator.countryCode = iterator.country;
      iterator.stateCode = iterator.state;

      //country-state-code settings///start
      const getCountryName = await knex("countries")
        .where("country_key", iterator.countryCode)
        .first()
        .select("name");
      iterator.country = getCountryName ? getCountryName.name : "";

      const getStateName = await knex("states")
        .where("countryKey", iterator.countryCode)
        .where("stateKey", iterator.stateCode)
        .first()
        .select("stateDesc");
      iterator.state = getStateName ? getStateName.stateDesc : "";

      //country-state-code settings///////over

      delete iterator.password;
      delete iterator.supplier_name;
      delete iterator.tds_type;
      delete iterator.tds_code;
      delete iterator.tds_subject;
      delete iterator.tds_receipent;
      delete iterator.departmentId;
      delete iterator.department_id;
      delete iterator.sap_code;
      delete iterator.sap_code_time;
      delete iterator.sap_status;
      delete iterator.status_update_date;
      delete iterator.subscriber_id;
      delete iterator.created_at;
      delete iterator.updated_at;

      const getBusinessDetails = await knex("business_details")
        .where("company_id", iterator.id)
        .select(
          "*",
          "company_id as supplierId",
          "msme_no as msmeNo",
          "created_at as createdAt",
          "updated_at as updatedAt"
        );

      if (getBusinessDetails.length > 0) {
        for (const gbd of getBusinessDetails) {
          delete gbd.company_id;
          delete gbd.msme_no;
          delete gbd.created_at;
          delete gbd.updated_at;
          const getMsmeCode = await knex("minority_indicator")
            .where("id", gbd.msmeType)
            .first();
          if (gbd.msmeType != null && gbd.msmeType != "") {
            gbd.msmeType = getMsmeCode.min_ind;
          }
        }
      }

      const getFinancialDetails = await knex("financial_details")
        .where("company_id", iterator.id)
        .select(
          "*",
          "company_id as supplierId",
          "p_bank_name as primaryBankName",
          "p_bank_account_number as primaryBankAccountNumber",
          "p_bank_account_holder_name as primaryBankAccountHolderName",
          "p_bank_state as primaryBankState",
          "p_bank_address as primaryBankAddress",
          "p_bank_branch as primaryBankBranch",
          "p_ifsc_code as primaryIfscCode",
          "p_micr_code as primaryMicrCode",
          "p_bank_guarantee_limit as primaryBankGuaranteeLimit",
          "p_overdraft_cash_credit_limit as primaryOverdraftCashCreditLimit",
          "s_bank_name as secondaryBankName",
          "s_bank_account_number as secondaryBankAccountNumber",
          "s_bank_account_holder_name as secondaryBankAccountHolderName",
          "s_bank_state as secondaryBankState",
          "s_bank_address as secondaryBankAddress",
          "s_bank_branch as secondaryBankBranch",
          "s_ifsc_code as secondaryIfscCode",
          "s_micr_code as secondaryMicrCode",
          "s_bank_guarantee_limit as secondaryBankGuaranteeLimit",
          "s_overdraft_cash_credit_limit as secondaryOverdraftCashCreditLimit",
          "created_at as createdAt",
          "updated_at as updatedAt"
        );

      if (getFinancialDetails.length > 0) {
        for (const gfd of getFinancialDetails) {
          delete gfd.company_id;
          delete gfd.p_bank_name;
          delete gfd.p_bank_account_number;
          delete gfd.p_bank_account_holder_name;
          delete gfd.p_bank_state;
          delete gfd.p_bank_address;
          delete gfd.p_bank_branch;
          delete gfd.p_ifsc_code;
          delete gfd.p_micr_code;
          delete gfd.p_bank_guarantee_limit;
          delete gfd.p_overdraft_cash_credit_limit;
          delete gfd.s_bank_name;
          delete gfd.s_bank_account_number;
          delete gfd.s_bank_account_holder_name;
          delete gfd.s_bank_state;
          delete gfd.s_bank_address;
          delete gfd.s_bank_branch;
          delete gfd.s_ifsc_code;
          delete gfd.s_micr_code;
          delete gfd.s_bank_guarantee_limit;
          delete gfd.s_overdraft_cash_credit_limit;
          delete gfd.created_at;
          delete gfd.updated_at;
        }
      }

      const getTaxDetails = await knex("tax_details")
        .where("company_id", iterator.id)
        .select(
          "*",
          "company_id as supplierId",
          "created_at as createdAt",
          "updated_at as updatedAt"
        );

      for (const iterator of getTaxDetails) {
        delete iterator.company_id;
        delete iterator.created_at;
        delete iterator.updated_at;

        if (iterator.msmeImage != "") {
          iterator.msmeImage = FixedPath + iterator.msmeImage;
        }
        if (iterator.gstImage != "") {
          iterator.gstImage = FixedPath + iterator.gstImage;
        }
        if (iterator.cancelledChequeImage != "") {
          iterator.cancelledChequeImage =
            FixedPath + iterator.cancelledChequeImage;
        }
        if (iterator.panCardImage != "") {
          iterator.panCardImage = FixedPath + iterator.panCardImage;
        }

        if (iterator.pfAttachment != "") {
          iterator.pfAttachment = FixedPath + iterator.pfAttachment;
        }

        if (iterator.otherAttachments != "") {
          iterator.otherAttachments = FixedPath + iterator.otherAttachments;
        }
      }

      const getAdditionalDetails = await knex("additional_company_details")
        .where("supplier_id", iterator.id)
        .select(
          "*",
          "supplier_id as supplierId",
          "payment_terms as paymentTerms",
          "reconciliation_ac as reconciliationAc",
          "vendor_class as vendorClass",
          "vendor_schema as vendorSchema",
          "business_partner_groups as businessPartnerGroups",
          "created_at as createdAt",
          "purchase_group as purchaseGroup",
          "updated_at"
        );

      //t2
      for (const iterator of getAdditionalDetails) {
        iterator.itWitholding = JSON.parse(iterator.itWitholding);
        delete iterator.purchase_group;

        const getPurchaseGroupCode = await knex("purchase_groups")
          .where("id", iterator.purchaseGroup)
          .first();
        if (getPurchaseGroupCode != undefined) {
          iterator.purchaseGroup = getPurchaseGroupCode.code;
        }

        const parse = JSON.parse(iterator.companies);
        const companies = await knex("companies")
          .whereIn("id", parse)
          .select("code");

        const companyCodes = companies.map((company) => company.code);
        iterator.companies = companyCodes;
      }

      if (getBusinessDetails.length > 0) {
        iterator.businessDetails = getBusinessDetails;
      } else {
        iterator.businessDetails = [];
      }
      if (getFinancialDetails.length > 0) {
        for (const gfd of getFinancialDetails) {
          const getCurrencyCode = await knex("currencies")
            .where("id", gfd.currency)
            .first()
            .select("code");
          if (getCurrencyCode != undefined) {
            gfd.currency = getCurrencyCode.code;
          }
        }

        iterator.financialDetails = getFinancialDetails;
      } else {
        iterator.financialDetails = [];
      }
      if (getTaxDetails.length > 0) {
        iterator.taxDetails = getTaxDetails;
      } else {
        iterator.taxDetails = [];
      }
      if (getAdditionalDetails.length > 0) {
        for (const gad of getAdditionalDetails) {
          const getVendorClassCode = await knex("vendor_class")
            .where("id", gad.vendorClass)
            .first()
            .select("code");
          if (getVendorClassCode != undefined) {
            gad.vendorClass = getVendorClassCode.code;
          }

          const getReconcilitationAc = await knex("reconciliation_ac")
            .where("id", gad.reconciliationAc)
            .first()
            .select("code");

          if (getReconcilitationAc != undefined) {
            gad.reconciliationAc = getReconcilitationAc.code;
          }

          const getVendorSchemaCode = await knex("vendor_schemas")
            .where("id", gad.vendorSchema)
            .first()
            .select("code");
          if (getVendorSchemaCode != undefined) {
            gad.vendorSchema = getVendorSchemaCode.code;
          }

          const getPaymentTermsCode = await knex("payment_terms")
            .where("id", gad.paymentTerms)
            .first()
            .select("code");
          if (getPaymentTermsCode != undefined) {
            gad.paymentTerms = getPaymentTermsCode.code;
          }

          const getBusinessPartnerGroup = await knex("business_partner_groups")
            .where("id", gad.businessPartnerGroups)
            .first()
            .select("code");
          if (getBusinessPartnerGroup != undefined) {
            gad.businessPartnerGroups = getBusinessPartnerGroup.code;
          }
        }

        iterator.additionalDetails = getAdditionalDetails;
      } else {
        iterator.additionalDetails = [];
      }

      if (getAdditionalDetails.length > 0) {
        for (const gad of getAdditionalDetails) {
          delete gad.supplier_id;
          delete gad.reconciliation_ac;
          delete gad.vendor_class;
          delete gad.vendor_schema;
          delete gad.business_partner_groups;
          delete gad.created_at;
          delete gad.updated_at;
          delete gad.payment_terms;
        }
      }
    }

    const getData2 = await knex("supplier_details")
      .select(
        "*",
        "supplier_name as supplierName",
        "department_id as departmentId",
        "sap_code as sapCode",
        "sap_code_time as sapCodeTime",
        "status_update_date as statusUpdateDate",
        "subscriber_id as subscriberId",
        "created_at as createdAt",
        "updated_at as updatedAt",
        "sap_status as sapStatus"
      )
      .whereNotNull("sap_code")
      .whereNotNull("sap_code_time")
      .andWhere("status", "=", "approved");

    for (const iterator of getData2) {
      if (iterator.sap_code_time) {
        iterator.action = "U";
      } else {
        iterator.action = "N";
      }
      iterator.srno = srno++;

      const getPaymentMethod = await knex("payment_types")
        .where("id", iterator.paymentMethod)
        .first()
        .select("code");
      if (getPaymentMethod != undefined) {
        iterator.paymentMethod = getPaymentMethod.code;
      }

      const getSource = await knex("company_source")
        .where("id", iterator.source)
        .first()
        .select("name");
      if (getSource != undefined) {
        iterator.source = getSource.name;
      }

      const getdeapartmentName = await knex("business_partner_groups")
        .where("id", iterator.department_id)
        .select("name")
        .first();

      iterator.department = getdeapartmentName ? getdeapartmentName.name : "";

      // const selectStateCountry = await knex("states").where(
      //   "stateDesc",
      //   iterator.state
      // );

      iterator.countryCode = iterator.country;
      iterator.stateCode = iterator.state;
      //country-state-code settings///start
      const getCountryName = await knex("countries")
        .where("country_key", iterator.countryCode)
        .first()
        .select("name");
      iterator.country = getCountryName ? getCountryName.name : "";

      const getStateName = await knex("states")
        .where("countryKey", iterator.countryCode)
        .where("stateKey", iterator.stateCode)
        .first()
        .select("stateDesc");
      iterator.state = getStateName ? getStateName.stateDesc : "";

      //country-state-code settings///////over

      delete iterator.password;
      delete iterator.supplier_name;
      delete iterator.tds_type;
      delete iterator.tds_code;
      delete iterator.tds_subject;
      delete iterator.tds_receipent;
      delete iterator.departmentId;
      delete iterator.department_id;
      delete iterator.sap_code;
      delete iterator.sap_code_time;
      delete iterator.sap_status;
      delete iterator.status_update_date;
      delete iterator.subscriber_id;
      delete iterator.created_at;
      delete iterator.updated_at;

      const getBusinessDetails = await knex("business_details")
        .where("company_id", iterator.id)
        .select(
          "*",
          "company_id as supplierId",
          "msme_no as msmeNo",
          "created_at as createdAt",
          "updated_at as updatedAt"
        );

      if (getBusinessDetails.length > 0) {
        for (const gbd of getBusinessDetails) {
          delete gbd.company_id;
          delete gbd.msme_no;
          delete gbd.created_at;
          delete gbd.updated_at;
          const getMsmeCode = await knex("minority_indicator")
            .where("id", gbd.msmeType)
            .first();
          if (gbd.msmeType != null && gbd.msmeType != "") {
            gbd.msmeType = getMsmeCode.min_ind;
          }
        }
      }

      const getFinancialDetails = await knex("financial_details")
        .where("company_id", iterator.id)
        .select(
          "*",
          "company_id as supplierId",
          "p_bank_name as primaryBankName",
          "p_bank_account_number as primaryBankAccountNumber",
          "p_bank_account_holder_name as primaryBankAccountHolderName",
          "p_bank_state as primaryBankState",
          "p_bank_address as primaryBankAddress",
          "p_bank_branch as primaryBankBranch",
          "p_ifsc_code as primaryIfscCode",
          "p_micr_code as primaryMicrCode",
          "p_bank_guarantee_limit as primaryBankGuaranteeLimit",
          "p_overdraft_cash_credit_limit as primaryOverdraftCashCreditLimit",
          "s_bank_name as secondaryBankName",
          "s_bank_account_number as secondaryBankAccountNumber",
          "s_bank_account_holder_name as secondaryBankAccountHolderName",
          "s_bank_state as secondaryBankState",
          "s_bank_address as secondaryBankAddress",
          "s_bank_branch as secondaryBankBranch",
          "s_ifsc_code as secondaryIfscCode",
          "s_micr_code as secondaryMicrCode",
          "s_bank_guarantee_limit as secondaryBankGuaranteeLimit",
          "s_overdraft_cash_credit_limit as secondaryOverdraftCashCreditLimit",
          "created_at as createdAt",
          "updated_at as updatedAt"
        );

      if (getFinancialDetails.length > 0) {
        for (const gfd of getFinancialDetails) {
          delete gfd.company_id;
          delete gfd.p_bank_name;
          delete gfd.p_bank_account_number;
          delete gfd.p_bank_account_holder_name;
          delete gfd.p_bank_state;
          delete gfd.p_bank_address;
          delete gfd.p_bank_branch;
          delete gfd.p_ifsc_code;
          delete gfd.p_micr_code;
          delete gfd.p_bank_guarantee_limit;
          delete gfd.p_overdraft_cash_credit_limit;
          delete gfd.s_bank_name;
          delete gfd.s_bank_account_number;
          delete gfd.s_bank_account_holder_name;
          delete gfd.s_bank_state;
          delete gfd.s_bank_address;
          delete gfd.s_bank_branch;
          delete gfd.s_ifsc_code;
          delete gfd.s_micr_code;
          delete gfd.s_bank_guarantee_limit;
          delete gfd.s_overdraft_cash_credit_limit;
          delete gfd.created_at;
          delete gfd.updated_at;
        }
      }
      const getTaxDetails = await knex("tax_details")
        .where("company_id", iterator.id)
        .select(
          "*",
          "company_id as companyId",
          "created_at as createdAt",
          "updated_at as updatedAt"
        );

      if (getTaxDetails.length > 0) {
        for (const iterator of getTaxDetails) {
          delete iterator.company_id;
          delete iterator.created_at;
          delete iterator.updated_at;

          if (iterator.msmeImage != "") {
            iterator.msmeImage = FixedPath + iterator.msmeImage;
          }
          if (iterator.gstImage != "") {
            iterator.gstImage = FixedPath + iterator.gstImage;
          }
          if (iterator.cancelledChequeImage != "") {
            iterator.cancelledChequeImage =
              FixedPath + iterator.cancelledChequeImage;
          }

          if (iterator.panCardImage != "") {
            iterator.panCardImage = FixedPath + iterator.panCardImage;
          }

          if (iterator.pfAttachment != "") {
            iterator.pfAttachment = FixedPath + iterator.pfAttachment;
          }

          if (iterator.otherAttachments != "") {
            iterator.otherAttachments = FixedPath + iterator.otherAttachments;
          }
        }
      }
      const getAdditionalDetails = await knex("additional_company_details")
        .where("supplier_id", iterator.id)
        .select(
          "*",
          "supplier_id as supplierId",
          "reconciliation_ac as reconciliationAc",
          "vendor_class as vendorClass",
          "vendor_schema as vendorSchema",
          "business_partner_groups as businessPartnerGroups",
          "created_at as createdAt",
          "updated_at as updatedAt",
          "purchase_group as purchaseGroup",
          "payment_terms as paymentTerms"
        );
      //t1
      for (const iterator of getAdditionalDetails) {
        iterator.itWitholding = JSON.parse(iterator.itWitholding);
        delete iterator.purchase_group;

        const getPurchaseGroupCode = await knex("purchase_groups")
          .where("id", iterator.purchaseGroup)
          .first()
          .select("code");

        iterator.purchaseGroup = getPurchaseGroupCode
          ? getPurchaseGroupCode.code
          : "";

        const parse = JSON.parse(iterator.companies);
        const companies = await knex("companies")
          .whereIn("id", parse)
          .select("code");

        const companyCodes = companies.map((company) => company.code);
        iterator.companies = companyCodes;

        delete iterator.payment_terms;
        delete iterator.supplier_id;

        if (iterator.paymentTerms != "") {
          const getPaymentTerms = await knex("payment_terms")
            .where("id", iterator.paymentTerms)
            .first()
            .select("code");
          iterator.paymentTerms = getPaymentTerms ? getPaymentTerms.code : "";
        }
      }

      if (getBusinessDetails.length > 0) {
        iterator.businessDetails = getBusinessDetails;
      } else {
        iterator.businessDetails = [];
      }
      if (getFinancialDetails.length > 0) {
        for (const gfd of getFinancialDetails) {
          const getCurrencyCode = await knex("currencies")
            .where("id", gfd.currency)
            .first()
            .select("code");
          gfd.currency = getCurrencyCode ? getCurrencyCode.code : "";
        }

        iterator.financialDetails = getFinancialDetails;
      } else {
        iterator.financialDetails = [];
      }
      if (getTaxDetails.length > 0) {
        iterator.taxDetails = getTaxDetails;
      } else {
        iterator.taxDetails = [];
      }
      if (getAdditionalDetails.length > 0) {
        for (const gad of getAdditionalDetails) {
          const getVendorClassCode = await knex("vendor_class")
            .where("id", gad.vendorClass)
            .first()
            .select("code");
          gad.vendorClass = getVendorClassCode ? getVendorClassCode.code : "";

          const getReconcilitationAc = await knex("reconciliation_ac")
            .where("id", gad.reconciliationAc)
            .first()
            .select("code");

          gad.reconciliationAc = getReconcilitationAc
            ? getReconcilitationAc.code
            : "";

          const getVendorSchemaCode = await knex("vendor_schemas")
            .where("id", gad.vendorSchema)
            .first()
            .select("code");
          gad.vendorSchema = getVendorSchemaCode
            ? getVendorSchemaCode.code
            : "";

          const getBusinessPartnerGroup = await knex("business_partner_groups")
            .where("id", gad.businessPartnerGroups)
            .first()
            .select("code");
          gad.businessPartnerGroups = getBusinessPartnerGroup
            ? getBusinessPartnerGroup.code
            : "";

          delete gad.created_at;
          delete gad.updated_at;
          delete gad.reconciliation_ac;
          delete gad.vendor_class;
          delete gad.vendor_schema;
          delete gad.business_partner_groups;
        }

        iterator.additionalDetails = getAdditionalDetails;
      } else {
        iterator.additionalDetails = [];
      }
    }

    const combinedData = [...getData, ...getData2];
    return res.json({
      error: false,
      message: "data retrived",
      data: combinedData,
      total: getData.length + getData2.length,
    });
  } catch (error) {
    return res.json({
      error: true,
      message: "Something went wrong.",
      data: { error: JSON.stringify(error) },
    });
  }
};

const getSapCode = async (req, res) => {
  try {
    const token = req.headers["authorization"];
    if (!token) {
      return res.json({
        error: true,
        message: "Token is required.",
      });
    }
    const { jwtConfig } = constants;
    const payload = jwt.decode(token.split(" ")[1], jwtConfig.secret);
    const statusChanger = payload.permissions[0];
    const statusChangerId = payload.id;
    const email = payload.email;
    const { vendor_code, sap_code, sap_status } = req.body;

    const timeis = knex.fn.now();

    const updateSupplierDetails = await knex("supplier_details")
      .update({ sap_code, sap_code_time: timeis, sap_status })
      .where("id", vendor_code);

    if (!updateSupplierDetails) {
      return res.json({
        error: true,
        message: "Supplier does not exist",
      });
    }
    if (vendor_code) {
      const modifiedByTable1 = await functions.SetModifiedBy(
        req.headers["authorization"],
        "supplier_details",
        "id",
        vendor_code
      );
    }

    /////send email of SAP Code (Vendor Code)//////////////////

    const getRecord = await knex("supplier_details").where("id", vendor_code);
    if (getRecord.length <= 0) {
      return res.json({
        error: true,
        message: "Supplier does not exist",
      });
    }

    const getSupplierId = await knex("users")
      .select("id")
      .where("email", getRecord[0].emailID);
    const createSupplierNotification = await notification.createNotification(
      [getSupplierId[0].id],
      "Vendor Code Generated",
      `Your vendor code (${vendor_code}) has been successfully generated in SAP.`,
      "0"
    );

    const createApproverNotification = await notification.createNotification(
      [statusChangerId],
      "Vendor Code Assignment Successful",
      `Vendor code (${vendor_code}) has been successfully assigned to ${getRecord[0].supplier_name} in Portal`,
      "0"
    );

    const emailBody = `<table style="width:100%;border:2px solid orange;"><tr><td style="width:20%;"></td><td><br><br>Hello,<br>${getRecord[0].supplier_name},<br>Congratulations!!!<p>Your VendorCode is: <b>${sap_code}</b></p>Regards,<br><b>SupplierX</b><br><center><br><img style="max-width:80px;" src="${constants.admindetails.companyLogo}"><br>Powered by ${constants.admindetails.companyShortName}<br>Note: Do not reply this email. This is auto-generated email.</center></td><td style="width:20%"></td></tr></table>`;

    ses.sendEmail(
      constants.sesCredentials.fromEmails.emailOtp,
      getRecord[0].emailID,
      "Vendor Code Generated",
      emailBody
    );

    const getSupplierDetails = await knex("supplier_details")
      .where("id", vendor_code)
      .first();
    const timestamp = knex.fn.now();
    const logs = supplierLogs.logFunction(
      getSupplierDetails.id,
      getSupplierDetails.gstNo,
      getSupplierDetails.panNo,
      getSupplierDetails.supplier_name,
      getSupplierDetails.emailID,
      "SapCode",
      timestamp,
      "-",
      "Vendorcode Generated"
    );

    //supplier logs entry over....

    return res.json({
      error: false,
      message: "Supplier updated successfully",
    });
  } catch (error) {
    return res.json({
      error: true,
      message: error.message,
    });
  }
};

const sapToDb = async (req, res) => {
  const { error, value } = validation.sapToDb(req.body);
  if (error) {
    return res
      .json({
        error: true,
        message: error.details[0].message,
      })
      .end();
  }

  const {
    supplierDetails: {
      supplierName,
      emailID,
      password,
      mobile,
      telephone,
      designation,
      contactPersonName,
      cinNo,
      aadharNo,
      officeDetails,
      paymentMethod,
      website,
      phoneNo,
      streetNo,
      address1,
      address2,
      address3,
      city,
      pin,
      state,
      country,
      source,
      add,
      department,
      sapCode,
      sap_status,
      sap_code_time,
      status,
      comment,
      gstNo,
      panNo,
      subscriber_id,
      type,
    },
    businessDetails: {
      companyFoundYear,
      msmeNo,
      promoterName,
      companyType,
      nameOfBusiness,
      businessType,
      msmeType,
      addressOfPlant,
      nameOfOtherGroupCompanies,
      listOfMajorCustomers,
      detailsOfMajorLastYear,
    },
    financialDetails: {
      currency,
      turnover,
      turnover2,
      turnover3,
      first,
      second,
      third,
      afterfirst,
      aftersecond,
      afterthird,
      presentorder,
      furtherorder,
      market,
      networth,
      primaryBankName,
      primaryBankAccountNumber,
      primaryBankAccountHolderName,
      primaryBankState,
      primaryBankAddress,
      primaryBankBranch,
      primaryIfscCode,
      primaryMicrCode,
      primaryBankGuaranteeLimit,
      primaryOverDraftCashCreditLimit,
      secondaryBankName,
      secondaryBankAccountNumber,
      secondaryBankAccountHolderName,
      secondaryBankState,
      secondaryBankAddress,
      secondaryBankBranch,
      secondaryIfscCode,
      secondaryMicrCode,
      secondaryBankGuaranteeLimit,
      secondaryOverDraftCashCreditLimit,
    },
    taxDetails: {
      gstRegDate,
      msmeImage,
      gstImage,
      cancelledChequeImage,
      panCardImage,
      pfAttachment,
      otherAttachments,
    },
    additionalDetails: {
      nameOfCompany,
      businessPartnerGroup,
      reconciliationAccount,
      vendorClass,
      vendorSchema,
      paymentTerms,
      purchaseGroup,
    },
    approvalInfo: { approverEmail, approverRemarks, approvalTime },
  } = value; // Using the validated value object here
  let sapCodeIs;
  if (sapCode == "") {
    sapCodeIs = null;
    return res
      .json({
        error: true,
        message: "Please give SAPCODE",
      })
      .end();
  } else {
    sapCodeIs = sapCode;
  }

  if (gstNo !== "" && panNo !== "") {
    return res
      .json({
        error: true,
        message: "Give either Gst No or Pan No",
      })
      .end();
  }

  if (gstNo.length != 0) {
    if (gstNo.length < 15) {
      return res
        .json({
          error: true,
          message: "Gst Number should be 15 characters long",
        })
        .end();
    }
  }

  if (panNo.length != 0) {
    if (panNo.length < 10) {
      return res
        .json({
          error: true,
          message: "Pan Number should be 10 characters long",
        })
        .end();
    }
  }

  if (panNo === "" && gstNo === "") {
    return res
      .json({
        error: true,
        message: "Please give Gst No OR Pan No",
      })
      .end();
  }

  //validate gst number/pan number with rejex

  if (panNo !== "") {
    // PAN format regex pattern
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]$/;
    const panRegexResult = panRegex.test(panNo);
    if (!panRegexResult) {
      return res
        .json({
          error: true,
          message: "Given Pan No is not in correct format",
        })
        .end();
    }
  }

  if (gstNo !== "") {
    // GST format regex pattern
    const gstRegex =
      /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}[Z]{1}[0-9A-Z]{1}$/;
    const gstRegexResult = gstRegex.test(gstNo);
    if (!gstRegexResult) {
      return res
        .json({
          error: true,
          message: "Given Gst No is not in correct format",
        })
        .end();
    }
  }

  //check gst / pan is already exist in our portal's db
  const checkGstNo = await knex("supplier_details")
    .where("gstNo", gstNo)
    .select("gstNo")
    .first();

  console.log("checkGstNo", checkGstNo);

  if (checkGstNo !== undefined) {
    if (checkGstNo.gstNo !== undefined && checkGstNo.gstNo !== "") {
      return res
        .json({ error: true, message: "GST Number is already exist" })
        .end();
    }
  }
  const checkPanNo = await knex("supplier_details")
    .where("panNo", panNo)
    .select("panNo")
    .first();

  console.log("checkPanNo", checkPanNo);

  if (checkPanNo !== undefined) {
    if (checkPanNo.panNo !== undefined) {
      return res
        .json({ error: true, message: "Pan Number is already exist" })
        .end();
    }
  }

  //check email existance in old db...

  const checkEmail = await knex("users")
    .where("email", emailID)
    .select("id")
    .first();

  if (checkEmail != undefined) {
    return res.json({
      error: true,
      message: "email already exist",
    });
  }

  const emailCheckResult = await emailvalidator.validate(emailID);

  console.log("emailCheckResult:", emailCheckResult);

  if (!emailCheckResult) {
    return res
      .json({ error: true, message: "E-mail is not in proper format" })
      .end();
  }

  //find payment method code....

  const checkPaymentMethod = await knex("payment_types")
    .where("name", paymentMethod)
    .select("id")
    .first();

  if (checkPaymentMethod == undefined) {
    return res.json({
      error: true,
      message: "Payment Method not found",
    });
  }

  const paymentId = checkPaymentMethod.id;

  //find department id from department

  const getDepartmentId = await knex("department_portal_code")
    .where("name", department)
    .select("dept_id")
    .first();

  if (getDepartmentId == undefined) {
    return res.json({
      error: true,
      message: "department not found",
    });
  }

  const dept_id = getDepartmentId.dept_id;

  if (msmeNo) {
    //check msme number - validate
    const msmeRegex = /^UDYAM-[A-Z]{2}-\d{2}-\d{7}$/;
    const checkMsmeNo = msmeRegex.test(msmeNo);

    console.log("checkMsmeNo:", checkMsmeNo);

    if (!checkMsmeNo) {
      return res
        .json({
          error: true,
          message: "MSME number is not in proper format",
        })
        .end();
    }

    const checkMsmeInDb = await knex("business_details")
      .where("msme_no", msmeNo)
      .first();

    if (!checkMsmeInDb) {
      return res
        .json({ error: true, message: "MSME No is already exist" })
        .end();
    }
  }

  //check primary bank account number using ...primaryBankAccountNumber

  const primaryBankAccountNumberRegex = /^[0-9]{8}$/;

  const checkPrimaryBankAccountNumber = primaryBankAccountNumberRegex.test(
    primaryBankAccountNumber
  );

  if (!checkPrimaryBankAccountNumber) {
    return res
      .json({
        error: true,
        message: "Primary Bank A/c No is not in proper format",
      })
      .end();
  }

  //validate ifsc code

  const primaryIfscCodeRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
  const checkPrimaryIfscCode = primaryIfscCodeRegex.test(primaryIfscCode);

  if (!checkPrimaryIfscCode) {
    return res
      .json({
        error: true,
        message: "Primary IFSC Code is not in proper format",
      })
      .end();
  }

  const companyIDs = [];

  for (let iterator of nameOfCompany) {
    iterator = iterator.replace(/-/g, " ");
    // Remove first word
    const words = iterator.split(" ");
    if (words.length > 1) {
      words.shift(); // Remove the first word
      iterator = words.join(" ");
    }

    const checkNameOfCompany = await knex("companies")
      .where("name", iterator)
      .first();
    if (!checkNameOfCompany) {
      return res.json({ error: true, data: iterator + " co. does not exist" });
    }
    companyIDs.push(checkNameOfCompany.id);
  }
  let businessPartnerGroupValue;

  businessPartnerGroupValue = businessPartnerGroup.replace(/-/g, " ");
  // Remove first word
  let words = businessPartnerGroupValue.split(" ");
  if (words.length > 1) {
    words.shift(); // Remove the first word
    businessPartnerGroupValue = words.join(" ");
  }

  const businessPartnerGroupIs = await knex("business_partner_groups")
    .where("name", businessPartnerGroupValue)
    .first();

  if (!businessPartnerGroupIs) {
    return res
      .json({
        error: true,
        message: "Business Partner Group does not exist",
      })
      .end();
  }

  let reconciliationAccountValue = reconciliationAccount.replace(/-/g, " ");
  // Remove first word
  words = reconciliationAccountValue.split(" ");
  if (words.length > 1) {
    words.shift(); // Remove the first word
    reconciliationAccountValue = words.join(" ");
  }

  const reconciliationAccountIs = await knex("reconciliation_ac")
    .where("name", reconciliationAccountValue)
    .first();
  if (!reconciliationAccountIs) {
    return res
      .json({ error: true, message: "Reconciliation Account does not exist" })
      .end();
  }

  const vendorClassIs = await knex("vendor_class")
    .where("name", vendorClass)
    .first();

  if (!vendorClassIs) {
    return res
      .json({
        error: true,
        message: "Vendor class does not exist",
      })
      .end();
  }

  let vendorSchemaValue = vendorSchema.replace(/-/g, " ");
  // Remove first word
  words = vendorSchemaValue.split(" ");
  if (words.length > 1) {
    words.shift(); // Remove the first word
    vendorSchemaValue = words.join(" ");
  }

  const vendorSchemaIs = await knex("vendor_schemas")
    .where("name", vendorSchemaValue)
    .first();

  if (!vendorSchemaIs) {
    return res
      .json({ error: true, message: "Vendor schema does not exist" })
      .end();
  }

  let paymentTermsIs = paymentTerms.replace(/-/g, " ");
  // Remove first word
  words = paymentTermsIs.split(" ");
  if (words.length > 1) {
    words.shift(); // Remove the first word
    paymentTermsIs = words.join(" ");
  }

  const payment_terms = await knex("payment_terms")
    .where("name", paymentTermsIs)
    .first();
  if (!payment_terms) {
    return res
      .json({ error: true, message: "Payment Terms does not exist" })
      .end();
  }

  let purchaseGroupValueIs = purchaseGroup.replace(/-/g, " ");
  // Remove first word
  words = purchaseGroupValueIs.split(" ");
  if (words.length > 1) {
    words.shift(); // Remove the first word
    purchaseGroupValueIs = words.join(" ");
  }

  const purchaseGroupIs = await knex("purchase_groups")
    .where("name", purchaseGroupValueIs)
    .first();

  if (!purchaseGroupIs) {
    return res
      .json({ error: true, message: "Purchase Group does not exist" })
      .end();
  }

  let customId = uuidv4();

  //check images sizes and its validation including approval info

  let msmeImagePath,
    gstImagePath,
    cancelledChequeImagePath,
    panCardImagePath,
    pfAttachmentPath,
    otherAttachmentsPath;

  if (msmeImage) {
    const checkImageSize = await getImageSize(msmeImage);
    if (checkImageSize > 1024) {
      return res
        .json({
          error: true,
          message: "File size of msmeImage must be less than 1 MB",
        })
        .end();
    }
    msmeImagePath = await getFilenameFromUrl(msmeImage);
    await uploadImageFromUrlToS3(
      msmeImage,
      constants.s3Creds.bucket,
      msmeImagePath
    );
  } else {
    msmeImagePath = "";
  }

  if (gstImage) {
    const checkImageSize = await getImageSize(gstImage);
    if (checkImageSize > 1024) {
      return res
        .json({
          error: true,
          message: "File size of gstImage must be less than 1 MB",
        })
        .end();
    }
    gstImagePath = await getFilenameFromUrl(gstImage);
    await uploadImageFromUrlToS3(
      gstImage,
      constants.s3Creds.bucket,
      gstImagePath
    );
  } else {
    gstImagePath = "";
  }

  if (cancelledChequeImage) {
    const checkImageSize = await getImageSize(cancelledChequeImage);
    if (checkImageSize > 1024) {
      return res
        .json({
          error: true,
          message: "File size of cancelled cheque image must be less than 1 MB",
        })
        .end();
    }
    cancelledChequeImagePath = await getFilenameFromUrl(cancelledChequeImage);
    await uploadImageFromUrlToS3(
      cancelledChequeImage,
      constants.s3Creds.bucket,
      cancelledChequeImagePath
    );
  } else {
    cancelledChequeImagePath = "";
  }

  if (panCardImage) {
    const checkImageSize = await getImageSize(panCardImage);
    if (checkImageSize > 1024) {
      return res
        .json({
          error: true,
          message: "File size of panCardImage must be less than 1 MB",
        })
        .end();
    }
    panCardImagePath = await getFilenameFromUrl(panCardImage);
    await uploadImageFromUrlToS3(
      panCardImage,
      constants.s3Creds.bucket,
      panCardImagePath
    );
  } else {
    panCardImagePath = "";
  }

  if (pfAttachment) {
    const checkImageSize = await getImageSize(pfAttachment);
    if (checkImageSize > 1024) {
      return res
        .json({
          error: true,
          message: "File size of pfAttachment must be less than 1 MB",
        })
        .end();
    }
    pfAttachmentPath = await getFilenameFromUrl(pfAttachment);
    await uploadImageFromUrlToS3(
      pfAttachment,
      constants.s3Creds.bucket,
      pfAttachmentPath
    );
  } else {
    pfAttachmentPath = "";
  }

  if (otherAttachments) {
    const checkImageSize = await getImageSize(otherAttachments);
    if (checkImageSize > 1024) {
      return res
        .json({
          error: true,
          message: "File size of otherAttachments must be less than 1 MB",
        })
        .end();
    }
    otherAttachmentsPath = await getFilenameFromUrl(otherAttachments);
    await uploadImageFromUrlToS3(
      otherAttachments,
      constants.s3Creds.bucket,
      otherAttachmentsPath
    );
  } else {
    otherAttachmentsPath = "";
  }

  /////insert values of supplier_details...

  let passwordis = md5(password);

  const insertSupplierDetails = await knex("supplier_details").insert({
    id: customId,
    supplier_name: supplierName,
    emailID: emailID,
    password: passwordis,
    mobile: mobile,
    telephone: telephone,
    designation: designation,
    contactPersonName: contactPersonName,
    cinNo: cinNo,
    aadharNo: aadharNo,
    officeDetails: officeDetails,
    paymentMethod: paymentId,
    website: website,
    phoneNo: phoneNo,
    streetNo: streetNo,
    address1: address1,
    address2: address2,
    address3: address3,
    city: city,
    pin: pin,
    country: country,
    source: source,
    add: add,
    state: state,
    department_id: dept_id,
    department: department,
    sap_code: sapCodeIs,
    sap_status: sap_status,
    sap_code_time: sap_code_time,
    status: status,
    comment: comment,
    gstNo: gstNo,
    panNo: panNo,
    subscriber_id: subscriber_id,
    type: type,
  });

  const businessDetailsId = uuidv4();

  let listOfMajorCustomersCode;
  const majorCustomerCode = await knex("major_customer")
    .where("name", listOfMajorCustomers)
    .first();
  if (majorCustomerCode != undefined) {
    listOfMajorCustomersCode = majorCustomerCode.id;
  } else {
    return res.json({
      error: true,
      message: "list of major customer not found for " + supplierName,
    });
  }

  const getBusinessTypeCode = await knex("business_types")
    .where("name", businessType)
    .first();
  if (getBusinessTypeCode == undefined) {
    return res.json({
      error: true,
      message: "business type not found for " + supplierName,
    });
  }

  const msmeTypeCode = await knex("minority_indicator")
    .where("min_ind", msmeType)
    .first();
  if (msmeTypeCode == undefined) {
    return res.json({
      error: true,
      message: "msme type not found for " + supplierName,
    });
  }

  const insertBusinessDetails = await knex("business_details").insert({
    id: businessDetailsId,
    company_id: customId,
    companyFoundYear: companyFoundYear,
    msme_no: msmeNo,
    promoterName: promoterName,
    companyType: companyType,
    nameOfBusiness: nameOfBusiness,
    businessType: getBusinessTypeCode.id,
    msmeType: msmeTypeCode.id,
    addressOfPlant: addressOfPlant,
    nameOfOtherGroupCompanies: nameOfOtherGroupCompanies,
    listOfMajorCustomers: listOfMajorCustomersCode,
    detailsOfMajorLastYear: detailsOfMajorLastYear,
  });
  const financeId = uuidv4();
  let currencyCodeIs;
  const currencycode = await knex("currencies").where("code", currency).first();
  if (currencycode) {
    currencyCodeIs = currencycode.id;
  } else {
    return res.json({
      error: true,
      message: "currency code not found for " + supplierName,
    });
  }

  const insertFinancialDetails = await knex("financial_details").insert({
    id: financeId,
    company_id: customId,
    currency: currencyCodeIs,
    turnover: turnover,
    turnover2: turnover2,
    turnover3: turnover3,
    first: first,
    second: second,
    third: third,
    afterfirst: afterfirst,
    aftersecond: aftersecond,
    afterthird: afterthird,
    presentorder: presentorder,
    furtherorder: furtherorder,
    market: market,
    networth: networth,
    p_bank_name: primaryBankName,
    p_bank_account_number: primaryBankAccountNumber,
    p_bank_account_holder_name: primaryBankAccountHolderName,
    p_bank_branch: primaryBankBranch,
    p_bank_state: primaryBankState,
    p_bank_address: primaryBankAddress,
    p_ifsc_code: primaryIfscCode,
    p_micr_code: primaryMicrCode,
    p_bank_guarantee_limit: primaryBankGuaranteeLimit,
    p_overdraft_cash_credit_limit: primaryOverDraftCashCreditLimit,
    s_bank_name: secondaryBankName,
    s_bank_account_number: secondaryBankAccountNumber,
    s_bank_account_holder_name: secondaryBankAccountHolderName,
    s_bank_branch: secondaryBankBranch,
    s_bank_state: secondaryBankState,
    s_bank_address: secondaryBankAddress,
    s_ifsc_code: secondaryIfscCode,
    s_micr_code: secondaryMicrCode,
    s_bank_guarantee_limit: secondaryBankGuaranteeLimit,
    s_overdraft_cash_credit_limit: secondaryOverDraftCashCreditLimit,
  });

  //create user for login

  const insertUser = await knex("users").insert({
    username: emailID,
    firstname: supplierName,
    subscriber_id: 1,
    email: emailID,
    password: passwordis,
    status: 1,
    role: 6,
  });

  //store data in additional company details

  const companyIdsString = JSON.stringify(companyIDs);

  const storeData = await knex("additional_company_details").insert({
    supplier_id: customId,
    companies: companyIdsString,
    reconciliation_ac: reconciliationAccountIs.id,
    vendor_class: vendorClassIs.id,
    vendor_schema: vendorSchemaIs.id,
    business_partner_groups: businessPartnerGroupIs.id,
    payment_terms: payment_terms.id,
    itWitholding: JSON.stringify(req.body.itWitholding), //write code for itWitholding
    purchase_group: purchaseGroupIs.id,
  });

  console.log("store data", storeData);
  /*
  //storing images-or-pdfs documents to s3 bucket

  let msmeImagePath,
    gstImagePath,
    cancelledChequeImagePath,
    panCardImagePath,
    pfAttachmentPath,
    otherAttachmentsPath;

  if (msmeImage) {
    const checkImageSize = await getImageSize(msmeImage);
    if(checkImageSize>1024){
      return res.json({error:true, message:"File size of msmeImage must be less than 1 MB"}).end();
    }
    msmeImagePath = await getFilenameFromUrl(msmeImage);
    await uploadImageFromUrlToS3(
      msmeImage,
      constants.s3Creds.bucket,
      msmeImagePath
    );
  } else {
    msmeImagePath = "";
  }

  if (gstImage) {
    const checkImageSize = await getImageSize(gstImage);
    if(checkImageSize>1024){
      return res.json({error:true, message:"File size of gstImage must be less than 1 MB"}).end();
    }
    gstImagePath = await getFilenameFromUrl(gstImage);
    await uploadImageFromUrlToS3(
      gstImage,
      constants.s3Creds.bucket,
      gstImagePath
    );
  } else {
    gstImagePath = "";
  }

  if (cancelledChequeImage) {
    const checkImageSize = await getImageSize(cancelledChequeImage);
    if(checkImageSize>1024){
      return res.json({error:true, message:"File size of cancelled cheque image must be less than 1 MB"}).end();
    }
    cancelledChequeImagePath = await getFilenameFromUrl(cancelledChequeImage);
    await uploadImageFromUrlToS3(
      cancelledChequeImage,
      constants.s3Creds.bucket,
      cancelledChequeImagePath
    );
  } else {
    cancelledChequeImagePath = "";
  }

  if (panCardImage) {
    const checkImageSize = await getImageSize(panCardImage);
    if(checkImageSize>1024){
      return res.json({error:true, message:"File size of panCardImage must be less than 1 MB"}).end();
    }
    panCardImagePath = await getFilenameFromUrl(panCardImage);
    await uploadImageFromUrlToS3(
      panCardImage,
      constants.s3Creds.bucket,
      panCardImagePath
    );
  } else {
    panCardImagePath = "";
  }

  if (pfAttachment) {
    const checkImageSize = await getImageSize(pfAttachment);
    if(checkImageSize>1024){
      return res.json({error:true, message:"File size of pfAttachment must be less than 1 MB"}).end();
    }
    pfAttachmentPath = await getFilenameFromUrl(pfAttachment);
    await uploadImageFromUrlToS3(
      pfAttachment,
      constants.s3Creds.bucket,
      pfAttachmentPath
    );
  } else {
    pfAttachmentPath = "";
  }

  if (otherAttachments) {
    const checkImageSize = await getImageSize(otherAttachments);
    if(checkImageSize>1024){
      return res.json({error:true, message:"File size of otherAttachments must be less than 1 MB"}).end();
    }
    otherAttachmentsPath = await getFilenameFromUrl(otherAttachments);
    await uploadImageFromUrlToS3(
      otherAttachments,
      constants.s3Creds.bucket,
      otherAttachmentsPath
    );
  } else {
    otherAttachmentsPath = "";
  }

  //store values in database of image names...
  const taxId = uuidv4();
  const insertTaxDetails = await knex("tax_details").insert({
    id: taxId,
    company_id: customId,
    gstNo: gstNo,
    msmeImage: msmeImagePath,
    gstImage: gstImagePath,
    cancelledChequeImage: cancelledChequeImagePath,
    panCardImage: panCardImagePath,
    pfAttachment: pfAttachmentPath,
    otherAttachments: otherAttachmentsPath,
  });

  console.log("insertTaxDetails:", insertTaxDetails);

  //add record in approval timeline

  const getApprovalEmail = await knex("users")
    .where("email", approverEmail)
    .first();

  if (!getApprovalEmail) {
    return res
      .json({
        error: true,
        message: "Approver Not Found",
      })
      .end();
  }

  */

  //store values in database of image names...
  const taxId = uuidv4();
  const insertTaxDetails = await knex("tax_details").insert({
    id: taxId,
    company_id: customId,
    gstNo: gstNo,
    msmeImage: msmeImagePath,
    gstImage: gstImagePath,
    cancelledChequeImage: cancelledChequeImagePath,
    panCardImage: panCardImagePath,
    pfAttachment: pfAttachmentPath,
    otherAttachments: otherAttachmentsPath,
  });

  console.log("insertTaxDetails:", insertTaxDetails);

  //add record in approval timeline

  const getApprovalEmail = await knex("users")
    .where("email", approverEmail)
    .first();

  if (!getApprovalEmail) {
    return res
      .json({
        error: true,
        message: "Approver Not Found",
      })
      .end();
  }

  const approvalTimelineInsertRecord = await knex("approval_timeline").insert({
    supplier_id: customId,
    approved: getApprovalEmail.id,
    approvedTime: approvalTime,
    approvedRemarks: approverRemarks,
  });

  //add record over

  return res.json({
    error: false,
    message: "Supplier details added successfully on portal.",
    data: {
      portalId: customId,
      sapCode: sapCode,
    },
  });
};

async function uploadImageFromUrlToS3(url, bucketName, key) {
  try {
    // Download the image from the URL
    const response = await axios.get(url, { responseType: "arraybuffer" });
    AWS.config.update({ region: constants.aws.region });
    const s3 = new AWS.S3();
    // Upload the image to S3
    await s3
      .upload({
        Bucket: bucketName,
        Key: "content-server/" + key,
        Body: Buffer.from(response.data),
        ContentType: response.headers["content-type"],
      })
      .promise();

    console.log("Image uploaded successfully to S3");
  } catch (error) {
    console.error("Error uploading image to S3:", error);
  }
}

async function getFilenameFromUrl(url) {
  // Extract the last part of the URL (filename)
  const filename = path.basename(url);
  const currentTimeStamp = Date.now(); //current timestamp for making unique filename
  return filename + "_" + currentTimeStamp;
}

async function getImageSize(url) {
  try {
    const response = await axios.head(url);
    const contentLength = response.headers["content-length"];
    if (contentLength) {
      const fileSizeInBytes = parseInt(contentLength, 10);
      const fileSizeInKilobytes = fileSizeInBytes / 1024;
      console.log(`File size: ${fileSizeInKilobytes} KB`);
      return fileSizeInKilobytes;
    } else {
      console.log("Content-Length header not found in the response.");
      return 0;
    }
  } catch (error) {
    console.error("Error fetching image size:", error.message);
  }
}

// for excel
async function uploadImageToS3(buffer, bucketName, key, contentType) {
  AWS.config.update({ region: constants.aws.region });
  const s3 = new AWS.S3();
  try {
    await s3
      .upload({
        Bucket: bucketName,
        Key: key,
        Body: buffer,
        ContentType: contentType,
      })
      .promise();

    console.log(`Image uploaded successfully to S3 at ${key}`);
  } catch (error) {
    console.error("Error uploading image to S3:", error);
  }
}

async function saveImages(images, workbook) {
  const imageKeys = {};
  for (const [cellAddress, image] of Object.entries(images)) {
    const imageId = image.imageId;
    const imageFile = workbook.model.media.find(
      (media) => media.index === imageId
    );
    if (imageFile) {
      const buffer = imageFile.buffer;
      const currentTimeStamp = Date.now();
      const filename = `${currentTimeStamp}-${imageFile.name}.${imageFile.extension}`;
      const bucketName = constants.s3Creds.bucket;

      const key = `content-server/${filename}`;
      const contentType = `application/octet-stream`;
      // imageKeys[cellAddress] = filename;
      imageKeys[cellAddress] = {
        filename,
        buffer,
        bucketName,
        key,
        contentType,
      };

    }
  }
  return imageKeys;
}

const processData = async (workbook, worksheet, mappings) => {
  const rows = [];
  let header = [];
  const images = {};

  worksheet.getImages().forEach((image) => {
    const cell = image.range.tl; // top-left cell of the image
    const cellAddress = `${cell.row}:${cell.col}`;
    images[cellAddress] = image;
  });
  let imageKeys = await saveImages(images, workbook);

  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) {
      header = row.values.map((cell) =>
        cell ? cell.toString().trim().toLowerCase() : ""
      );
    } else {
      const rowData = row.values;
      const linkObject = rowData.find(
        (cell) =>
          typeof cell === "object" && "text" in cell && "hyperlink" in cell
      );
      if (linkObject) {
        rowData[rowData.indexOf(linkObject)] = linkObject.hyperlink;
      }
      rows.push(rowData);
    }
  });
  const normalizedHeaderMappings = Object.keys(mappings).map((key) =>
    key.toLowerCase().trim()
  );
  const missingHeaders = normalizedHeaderMappings.filter(
    (essentialHeader) =>
      !header.some(
        (headerItem) => headerItem.toLowerCase().trim() === essentialHeader
      )
  );
  if (missingHeaders.length > 0) {
    throw new Error(
      `Essential headers are missing in the uploaded file: ${missingHeaders.join(
        ", "
      )}`
    );
  }

  const srNoIndex = header.indexOf("sr no");
  const dataToInsert = [];

  for (const row of rows) {
    if (
      srNoIndex !== -1 &&
      row[srNoIndex].toString().trim().toLowerCase() === "sr no"
    ) {
      continue;
    }
    const rowData = {};
    header.forEach((column, index) => {
      const databaseColumn = mappings[column];
      if (databaseColumn) {
        const cellValue = row[index] ? row[index].toString().trim() : "";
        rowData[databaseColumn] = cellValue;
      }
    });

    Object.entries(images).forEach(([cellAddress, image]) => {
      let [rowIndex, colIndex] = cellAddress.split(":").map(Number);
      colIndex = Math.floor(colIndex);
      rowIndex = Math.floor(rowIndex);
      if (rowIndex - 1 === rows.indexOf(row)) {
        const headerName = header[colIndex + 1];
        const databaseColumn = mappings[headerName];
        if (databaseColumn && imageKeys[cellAddress]) {
          rowData[databaseColumn] = imageKeys[cellAddress].filename;
        }
      }
    });
    if (rowData.paymentMethod !== undefined && rowData.paymentMethod !== "") {
      const paymentMethod = rowData["paymentMethod"];
      const checkPaymentMethod = await knex("payment_types")
        .where("name", paymentMethod)
        .select("id")
        .first();
      if (!checkPaymentMethod) {
        throw new Error("Payment Method not found");
      }
      rowData["paymentMethod"] = checkPaymentMethod.id;
    }
    dataToInsert.push(rowData);
  }
  return { dataToInsert, imageKeys };
};

const importExcel = async (req, res) => {
  try {
    console.log("here");

    // table names
    const supplier_details = "supplier_details";
    const business_details = "business_details";
    const financial_details = "financial_details";
    const tax_details = "tax_details";
    const additional_details = "additional_company_details";

    if (req.files === undefined) {
      return res.status(400).json({error : true, message: "No file uploaded" });
    }

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(req.files.excelfile.data);

    // headers mapping with table's fields
    const headerMappings = {
      supplierDetails: {
        "supplier name": "supplier_name",
        "email id": "emailID",
        // password: "password",
        mobile: "mobile",
        telephone: "telephone",
        designation: "designation",
        "contact person name": "contactPersonName",
        "cin no": "cinNo",
        "aadhar no": "aadharNo",
        "office details": "officeDetails",
        "payment method": "paymentMethod",
        website: "website",
        "phone no": "phoneNo",
        "street no": "streetNo",
        "address 1": "address1",
        "address 2": "address2",
        "address 3": "address3",
        pin: "pin",
        city: "city",
        state: "state",
        country: "country",
        source: "source",
        department: "department",
        "sap code": "sap_code",
        // status: "status",
        // comment: "comment",
        "gst no": "gstNo",
        "pan no": "panNo",
        // "subscriber id": "subscriber_id",
        // type: "type",
      },
      businessDetails: {
        "company found year": "companyFoundYear",
        "msme no": "msme_no",
        "promoter name": "promoterName",
        "company type": "companyType",
        "name of business": "nameOfBusiness",
        "business type": "businessType",
        "msme type": "msmeType",
        "address of plant": "addressOfPlant",
        "name of other group companies": "nameOfOtherGroupCompanies",
        "list of major customers": "listOfMajorCustomers",
        "details of major last year": "detailsOfMajorLastYear",
      },
      financialDetails: {
        currency: "currency",
        turnover: "turnover",
        "turnover 2": "turnover2",
        "turnover 3": "turnover3",
        first: "first",
        second: "second",
        third: "third",
        "after first": "afterfirst",
        "after second": "aftersecond",
        "after third": "afterthird",
        "present order": "presentorder",
        "further order": "furtherorder",
        market: "market",
        networth: "networth",
        "primary bank name": "p_bank_name",
        "primary bank account number": "p_bank_account_number",
        "primary bank account holder name": "p_bank_account_holder_name",
        "primary bank state": "p_bank_state",
        "primary bank address": "p_bank_address",
        "primary bank branch": "p_bank_branch",
        "primary ifsc code": "p_ifsc_code",
        "primary micr code": "p_micr_code",
        "primary bank guarantee limit": "p_bank_guarantee_limit",
        "primary overdraft cash credit limit": "p_overdraft_cash_credit_limit",
        "secondary bank name": "s_bank_name",
        "secondary bank account number": "s_bank_account_number",
        "secondary bank account holder name": "s_bank_account_holder_name",
        "secondary bank state": "s_bank_state",
        "secondary bank address": "s_bank_address",
        "secondary bank branch": "s_bank_branch",
        "secondary ifsc code": "s_ifsc_code",
        "secondary micr code": "s_micr_code",
        "secondary bank guarantee limit": "s_bank_guarantee_limit",
        "secondary overdraft cash credit limit":
          "s_overdraft_cash_credit_limit",
      },
      taxDetails: {
        "gst reg date": "gstRegDate",
        "msme image": "msmeImage",
        "gst image": "gstImage",
        "cancelled cheque image": "cancelledChequeImage",
        "pan card image": "panCardImage",
        "pf attachment": "pfAttachment",
        "other attachments": "otherAttachments",
      },
      additionalDetails: {
        "name of company": "companies",
        "business partner group": "business_partner_groups",
        "reconciliation account": "reconciliation_ac",
        "vendor class": "vendor_class",
        "vendor schema": "vendor_schema",
        "payment terms": "payment_terms",
        "purchase group": "purchase_group",
      },
      itWitholding: {
        "tax type": "taxType",
        "tax code": "taxCode",
        "recipient type": "recipientType",
        "wt subjct": "wtSubjct",
      },
    };

    const sheets = [
      {
        data: "supplierData",
        sheet: 0,
        mapping: headerMappings.supplierDetails,
      },
      {
        data: "businessData",
        sheet: 1,
        mapping: headerMappings.businessDetails,
      },
      {
        data: "financialData",
        sheet: 2,
        mapping: headerMappings.financialDetails,
      },
      { data: "taxData", sheet: 3, mapping: headerMappings.taxDetails },
      {
        data: "additionalData",
        sheet: 4,
        mapping: headerMappings.additionalDetails,
      },
      {
        data: "itWitholdingData",
        sheet: 5,
        mapping: headerMappings.itWitholding,
      },
    ];
    const data = {};
    for (const { data: key, sheet, mapping } of sheets) {
      data[key] = await processData(
        workbook,
        workbook.worksheets[sheet],
        mapping
      );
    }
    let {
      supplierData,
      businessData,
      financialData,
      taxData,
      additionalData,
      itWitholdingData,
    } = data;

    let images = taxData.imageKeys;
    supplierData = supplierData.dataToInsert;
    businessData = businessData.dataToInsert;
    financialData = financialData.dataToInsert;
    taxData = taxData.dataToInsert;
    additionalData = additionalData.dataToInsert;
    itWitholdingData = itWitholdingData.dataToInsert;

    const errors = [];
    const errorDetails = {};
    const suppliersWithErrorsIds = [];

    await knex.transaction(async (trx) => {
      for (const supplier of supplierData) {
        const { error } = validation.supplierSchema(supplier);
        if (error) {
          error.details.forEach((d) => {
            errors.push({
              supplierName: supplier.supplier_name,
              error: d.message,
            });
          });
          // continue;
        }

        const customId = uuidv4();
        supplier.id = customId;

        if (supplier.panNo === "" && supplier.gstNo === "") {
          errors.push({
            supplierName: supplier.supplier_name,
            error: "Please provide GST No OR Pan No",
          });
          continue;
        }

        const checkGstNo = await knex("supplier_details")
          .where("gstNo", supplier.gstNo)
          .select("gstNo")
          .first();
        if (checkGstNo) {
          errors.push({
            supplierName: supplier.supplier_name,
            error: "GST Number already exists",
          });
          continue;
        }

        const checkPanNo = await knex("supplier_details")
          .where("panNo", supplier.panNo)
          .select("panNo")
          .first();
        if (checkPanNo) {
          errors.push({
            supplierName: supplier.supplier_name,
            error: "Pan Number already exists",
          });
          continue;
        }

        const checkEmail = await knex("users")
          .where("email", supplier.emailID)
          .select("id")
          .first();
        if (checkEmail) {
          errors.push({
            supplierName: supplier.supplier_name,
            error: "Email already exists",
          });
          continue;
        }

        const emailCheckResult = await emailvalidator.validate(
          supplier.emailID
        );
        if (!emailCheckResult) {
          errors.push({
            supplierName: supplier.supplier_name,
            error: "Invalid email format",
          });
          continue;
        }

        const getDepartmentId = await knex("department_portal_code")
          .where("name", supplier.department)
          .select("dept_id")
          .first();
        if (!getDepartmentId) {
          errors.push({
            supplierName: supplier.supplier_name,
            error: "Department not found",
          });
          continue;
        }

        supplier.department_id = getDepartmentId.dept_id;
      }

      // Business Details
      for (const bd of businessData) {
        for (let i = 0; i < businessData.length; i++) {
          businessData[i].company_id = supplierData[i].id;
        }
        const correspondingSupplier = supplierData.find(
          (supplier) => supplier.id === bd.company_id
        );
        const { error } = validation.businessSchema(bd);
        if (error) {
          error.details.forEach((d) => {
            errors.push({
              supplierName: correspondingSupplier.supplier_name,
              error: d.message,
            });
          });
          // continue;
        }
        const businessDetailsId = uuidv4();
        bd.id = businessDetailsId;

        let listOfMajorCustomersCode;

        if (bd.msme_no) {
          //check msme number - validate
          // const msmeRegex = /^UDYAM-[A-Z]{2}-\d{2}-\d{7}$/;
          // const checkMsmeNo = msmeRegex.test(bd.msme_no);

          // if (!checkMsmeNo) {
          //   errors.push({
          //     supplierName: correspondingSupplier.supplier_name,
          //     error: "MSME number is not in proper format",
          //   });
          //   continue;
          // }

          const checkMsmeInDb = await knex("business_details")
            .where("msme_no", bd.msme_no)
            .first();
          // console.log("checkMsmeInDb :", checkMsmeInDb);
          if (checkMsmeInDb && checkMsmeInDb !== undefined) {
            errors.push({
              supplierName: correspondingSupplier.supplier_name,
              error: "MSME No is already exist",
            });
            continue;
          }
        }
        if (bd.listOfMajorCustomers !== "") {
          const majorCustomerCode = await knex("major_customer")
            .where("name", bd.listOfMajorCustomers)
            .first();
          if (majorCustomerCode != undefined) {
            listOfMajorCustomersCode = majorCustomerCode.id;
          } else {
            errors.push({
              supplierName: correspondingSupplier.supplier_name,
              error: "list of major customer not found",
            });
            continue;
          }
        }
        if (bd.businessType !== "") {
          const getBusinessTypeCode = await knex("business_types")
            .where("name", bd.businessType)
            .first();

            if (getBusinessTypeCode == undefined) {
              errors.push({
                supplierName: correspondingSupplier.supplier_name,
                error: "business type not found",
              });
              continue;
            }
            bd.businessType = getBusinessTypeCode?.id;
        }
        if (bd.msmeType !== "") {
          const msmeTypeCode = await knex("minority_indicator")
            .where("min_ind", bd.msmeType)
            .first();
            if (msmeTypeCode == undefined) {
              errors.push({
                supplierName: correspondingSupplier.supplier_name,
                error: "msme type not found",
              });
              continue;
            }
            bd.msmeType = msmeTypeCode?.id;
        }
        const companyType = await knex("company_types")
          .where("name", bd.companyType)
          .first();
        bd.companyType = companyType ? companyType.id : "";
        bd.listOfMajorCustomers = listOfMajorCustomersCode;
      }

      // Financial Detais
      for (const fd of financialData) {
        for (let i = 0; i < financialData.length; i++) {
          financialData[i].company_id = supplierData[i].id;
        }
        const correspondingSupplier = supplierData.find(
          (supplier) => supplier.id === fd.company_id
        );
        const { error } = validation.financialSchema(fd);
        if (error) {
          error.details.forEach((d) => {
            errors.push({
              supplierName: correspondingSupplier.supplier_name,
              error: d.message,
            });
          });
          // continue;
        }
        const Id = uuidv4();
        fd.id = Id;
        const currencycode = await knex("currencies")
          .where("code", fd.currency)
          .first();
        if (currencycode) {
          fd.currency = currencycode.id;
        } else {
          errors.push({
            supplierName: correspondingSupplier.supplier_name,
            error: "currency code not found",
          });
          continue;
        }
      }

      for (const td of taxData) {
        for (let i = 0; i < taxData.length; i++) {
          taxData[i].company_id = supplierData[i].id;
        }
        const correspondingSupplier = supplierData.find(
          (supplier) => supplier.id === td.company_id
        );
        const { error } = validation.taxSchema(td);
        if (error) {
          error.details.forEach((d) => {
            errors.push({
              supplierName: correspondingSupplier.supplier_name,
              error: d.message,
            });
          });
        }
        const Id = uuidv4();
        td.id = Id;
        td.gstRegDate = td.gstRegDate ? moment(td.gstRegDate).format("YYYY-MM-DD") :"";
      }

      // itWitholding
      for (const itw of itWitholdingData) {
        for (let i = 0; i < itWitholdingData.length; i++) {
          itWitholdingData[i].company_id = supplierData[i].id;
        }
        const taxTypes = itw.taxType ? itw.taxType.split(",") : [];
        const taxCodes = itw.taxCode ? itw.taxCode.split(",") : [];
        const recipientTypes = itw.recipientType
          ? itw.recipientType.split(",")
          : [];
        const wtSubjcts = itw.wtSubjct ? itw.wtSubjct.split(",") : [];

        const maxLength = Math.max(
          taxTypes.length,
          taxCodes.length,
          recipientTypes.length,
          wtSubjcts.length
        );

        // Mapping based on the maximum length
        const itWitholding = [];
        for (let index = 0; index < maxLength; index++) {
          itWitholding.push({
            tax_type: taxTypes[index] || null,
            tax_code: taxCodes[index] || null,
            recipient_type: recipientTypes[index] || null,
            wt_subjct: wtSubjcts[index] || null,
          });
        }

        delete itw.taxType;
        delete itw.taxCode;
        delete itw.recipientType;
        delete itw.wtSubjct;
        itw.itWitholding = itWitholding;
      }
      // Addition Info
      for (const ad of additionalData) {
        for (let i = 0; i < additionalData.length; i++) {
          additionalData[i].supplier_id = supplierData[i].id;
        }
        const correspondingSupplier = supplierData.find(
          (supplier) => supplier.id === ad.supplier_id
        );
        const vendorSchemaIs = await knex("vendor_schemas")
          .where("code", ad.vendor_schema)
          .first();
        const payment_terms = await knex("payment_terms")
          .where("code", ad.payment_terms)
          .first();
        const vendorClassIs = await knex("vendor_class")
          .where("name", ad.vendor_class)
          .first();
        const purchaseGroupIs = await knex("purchase_groups")
          .where("code", ad.purchase_group)
          .first();
        const reconciliationAccountIs = await knex("reconciliation_ac")
          .where("code", ad.reconciliation_ac)
          .first();
        const businessPartnerGroupIs = await knex("business_partner_groups")
          .where("code", ad.business_partner_groups)
          .first();

        let companiesArray = ad.companies ? JSON.parse(ad.companies) : "";
        let companyIDs = [];
        if (companiesArray.length > 0) {
          for (let iterator of companiesArray) {
            const checkNameOfCompany = await knex("companies")
              .where("code", iterator)
              .first();
            if (!checkNameOfCompany) {
              errors.push({
                supplierName: correspondingSupplier.supplier_name,
                error: iterator + " co. does not exist",
              });
              continue;
            }
            companyIDs.push(checkNameOfCompany.id);
          }
        }
        ad.vendor_schema = vendorSchemaIs ? vendorSchemaIs.id : "";
        ad.payment_terms = payment_terms ? payment_terms.id : "";
        ad.vendor_class = vendorClassIs ? vendorClassIs.id : "";
        ad.purchase_group = purchaseGroupIs ? purchaseGroupIs.id : "";
        ad.reconciliation_ac = reconciliationAccountIs
          ? reconciliationAccountIs.id
          : "";
        ad.business_partner_groups = businessPartnerGroupIs
          ? businessPartnerGroupIs.id
          : "";
        ad.companies = JSON.stringify(companyIDs);
        ad.itWitholding = [];
        for (const itw of itWitholdingData) {
          if (itw.company_id === ad.supplier_id) {
            ad.itWitholding = itw.itWitholding;
          }
        }
        if (ad.itWitholding.length === 0) {
          ad.itWitholding = [
            {
              tax_type: null,
              tax_code: null,
              recipient_type: null,
              wt_subjct: null,
            },
          ];
        }
        ad.itWitholding = JSON.stringify(ad.itWitholding);
        const { error } = validation.additionalSchema(ad);
        if (error) {
          error.details.forEach((d) => {
            errors.push({
              supplierName: correspondingSupplier.supplier_name,
              error: d.message,
            });
          });
          // continue;
        }
      }

      const suppliersToInsert = [];
      const businessToInsert = [];
      const financeToInsert = [];
      const taxToInsert = [];
      const add_infoToInsert = [];
      let uniqueSupplierIdsArray = [];

      if (errors.length > 0) {
        errors.forEach((error) => {
          const { supplierName, error: errorMessage } = error;

          if (!errorDetails.hasOwnProperty(supplierName)) {
            errorDetails[supplierName] = [errorMessage];
          } else {
            errorDetails[supplierName].push(errorMessage);
          }

          let a = supplierData.find(
            (supplier) => supplier.supplier_name === supplierName
          );
          if (a) {
            suppliersWithErrorsIds.push(a.id);
          }
        });
        const uniqueSupplierIds = new Set(suppliersWithErrorsIds);
        uniqueSupplierIdsArray = Array.from(uniqueSupplierIds);
      }
      supplierData.forEach((supplier) => {
        if (!uniqueSupplierIdsArray.includes(supplier.id)) {
          suppliersToInsert.push(supplier);
        }
      });
      businessData.forEach((bd) => {
        if (!uniqueSupplierIdsArray.includes(bd.company_id)) {
          businessToInsert.push(bd);
        }
      });
      financialData.forEach((fd) => {
        if (!uniqueSupplierIdsArray.includes(fd.company_id)) {
          financeToInsert.push(fd);
        }
      });
      taxData.forEach((td) => {
        if (!uniqueSupplierIdsArray.includes(td.company_id)) {
          taxToInsert.push(td);
        }
      });

      additionalData.forEach((ad) => {
        if (!uniqueSupplierIdsArray.includes(ad.supplier_id)) {
          add_infoToInsert.push(ad);
        }
      });

      // for image upload to s3
      const imageFields = [
        "msmeImage",
        "gstImage",
        "cancelledChequeImage",
        "panCardImage",
        "pfAttachment",
        "otherAttachments",
      ];
console.log("images :",images)
console.log("taxToInsert :",taxToInsert)
      Object.entries(images).forEach(([key, img]) => {
        let found = false;
        taxToInsert.forEach((data) => {
          console.log(data);
          imageFields.forEach(async (field) => {
            console.log(data[field])
            if (data[field] === img.filename) {
              found = true;
              // console.log(`Match found in field ${field} of taxData with company_id ${data.company_id}`);
              await uploadImageToS3(
                img.buffer,
                img.bucketName,
                img.key,
                img.contentType
              );
            }
          });
        });
      });
      if (suppliersToInsert.length === 0) {
        if (errorDetails && Object.keys(errorDetails).length > 0) {
          // If errorDetails is not empty
          return res.status(400).json({
            error: true,
            message: "Some records failed to insert",
            data: errorDetails,
          });
        } else {
          return res.json({
            error: true,
            message: "All Data Already exists.",
            data: [],
          });
        }
      } else {
        await trx(supplier_details).insert(suppliersToInsert);
        await trx(business_details).insert(businessToInsert);
        await trx(financial_details).insert(financeToInsert);
        await trx(tax_details).insert(taxToInsert);
        await trx(additional_details).insert(add_infoToInsert);

        if (errorDetails && Object.keys(errorDetails).length > 0) {
          // If errorDetails is not empty
          return res.status(400).json({
            error: true,
            message: "Some records failed to insert",
            data: errorDetails,
          });
        } else {
          // If errorDetails is empty
          return res.json({
            error: false,
            message: "Data inserted successfully",
          });
        }
      }
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      error: true,
      message: "Something Went Wrong!",
      data: error.message,
    });
  }
};


// mail send test 

// const emailContent = `
//   Hello,<br>Hemangini,<br>Congratulations!!!
//   <p>Your VendorCode is: <b>96000292</b></p>
// `;

// // Generate the email body
// const emailBody = functions.generateEmailBody(emailContent);

// Send the email
// ses.sendEmail(
//   constants.sesCredentials.fromEmails.emailOtp,
//   "hemangini.chavda@aeonx.digital",
//   "Vendor Code Generated",
//   emailBody
// );

export default {
  listSupplier,
  updateToday,
  sendToSap,
  viewSupplier,
  getSapCode,
  sapToDb,
  importExcel,
};
