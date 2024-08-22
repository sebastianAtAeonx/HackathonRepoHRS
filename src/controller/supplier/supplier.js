import Joi from "joi";
import knex from "../../config/mysql_db.js";
import otp from "../../emails/otp.js";
import jwt from "jsonwebtoken";

import { v4 as uuidv4 } from "uuid";
import constants from "../../helpers/constants.js";
import passwordEmail from "../../emails/passwordEmail.js";
import functions from "../../helpers/functions.js";
import ses from "../../helpers/ses.js";
import md5 from "md5";
import sap from "../../services/sap.js";
import { error, log } from "console";
import AWS from "aws-sdk";
import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import moment from "moment-timezone";

import s3 from "../../s3/s3.js";
import path from "path";
import approveremail from "../../emails/approverEmail.js";
import queriedemail from "../../emails/queriedEmail.js";
import { loadavg } from "os";
import e from "cors";
import { get } from "https";
import { join } from "path";
import supplierLogs from "../../logs/logs.js";
import notifications from "../notification.js";
import validation from "../../validation/supplier/supplier.js";

async function trackSupplierNewData(oldData, newData) {
  //function to compare oldvalues of field with new values
  const changedFields = {};
  for (const key of Object.keys(newData)) {
    if (oldData[key] !== newData[key]) {
      changedFields[key] = newData[key];
    }
  }

  return changedFields;
}

async function trackSupplierOldData(oldData, newData) {
  //function to compare oldvalues of field with new values
  const changedFields = {};
  for (const key of Object.keys(newData)) {
    if (oldData[key] !== newData[key]) {
      changedFields[key] = oldData[key];
    }
  }

  return changedFields;
}
const registerSupplier = async (req, res) => {
  var trx = await knex.transaction();
  try {
    const typeOfSupplier = req.body.typeOfSupplier;
    // const typeOfSupplier = "domestic";

    let fieldsConfig;
    //domestic
    if (typeOfSupplier == "domestic") {
      fieldsConfig = await functions.getFieldConfig("supplier_registration", 1);
    }
    //international
    else if (typeOfSupplier == "international") {
      fieldsConfig = await functions.getFieldConfigInternational(
        "supplier_registration",
        1
      );
    }

    // const conditionalValidation = (object, condition) =>
    //   condition === true ? object.required() : object.optional().allow("", {});

    const conditionalValidation = (object, condition) =>
      condition === true ? object.required() : object.optional().allow("");

    const { error, value } = validation.registerSupplier(
      req.body,
      fieldsConfig
    );
    if (error) {
      return res.status(400).json({
        error: true,
        message: error.details[0].message,
        data: error,
      });
    }
    let id = uuidv4();

    const supplierId = id;

    const timestampis = knex.fn.now();

    let {
      companyDetails: {
        emailID = "",
        mobile = "",
        telephone = "",
        designation = "",
        contactPersonName = "",
        cinNo = "",
        aadharNo = "",
        officeDetails = "",
        paymentMethod = "",
        website = "",
        phoneNo = "",
        pin = "",
        city = "",
        country = "",
        address3 = "",
        address2 = "",
        address1 = "",
        streetNo = "",
        source = "",
        supplier_name = "",
        add = "",
        state = "",
        department = "",
        gstNo = "",
        panNo = "",
      },
    } = value;

    if (gstNo === undefined || gstNo == "") {
      //not required to do anything
    } else {
      const check_pan_no = gstNo.substring(2, 12);

      if (check_pan_no != panNo) {
        return res.status(400).json({
          error: true,
          message: "Please provide correct Pan No",
        });
      }
    }

    paymentMethod = paymentMethod?.value;
    country = country?.value;
    source = source?.value;
    state = state?.value;
    const [password] = await Promise.all([functions.genratePassword()]);

    ////////////////////////////////////
    // user details
    ///////////////////////////////////

    const checkApproverEmail = await knex("users")
      .where("email", "=", emailID)
      .first();

    if (checkApproverEmail) {
      return res
        .status(403)
        .json({
          error: "true",
          message:
            "Email is already in use. Please use different email address.",
        })
        .end();
    }

    const getSupplierRole = await knex("role")
      .select("id")
      .where("name", "Supplier")
      .first();

    //check weather supplier_name exist in DB or not
    const checkSupplierName = await knex("supplier_details")
      .where("supplier_name", supplier_name)
      .first();

    // if (checkSupplierName) {
    //   return res.status(500).json({
    //     error: true,
    //     message: "Supplier Name Already Exist",
    //   });
    // }

    const createSupplierUser = await trx("users").insert({
      password: md5(password),
      email: emailID,
      role: getSupplierRole.id, //old
      role_id: getSupplierRole.id, //new
      status: 1,
      firstname: supplier_name,
      username: emailID,
      subscriber_id: 1, //1 - for Aashapura
    });

    if (!createSupplierUser) {
      return res.status(500).json({
        error: true,
        message: "Creating Supplier User Failed",
      });
    }

    ////////////////////////////////////////////////////////

    const insertId = await trx("supplier_details").insert({
      password: md5(password),
      created_at: timestampis,
      id: id,
      emailID,
      emailRefKey: createSupplierUser[0],
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
      pin,
      city,
      country,
      address3,
      address2,
      address1,
      streetNo,
      source,
      supplier_name,
      add,
      state,
      department_id: department.value,
      department: department.label,
      department: department.label,
      gstNo,
      panNo,
      typeOfSupplier,
    });

    if (!insertId) {
      return res.status(500).json({
        error: true,
        message: "Inserting Company Details Failed",
      });
    }

    /////////////////////////////////////
    //// business details
    /////////////////////////////////////

    let {
      businessDetails: {
        companyFoundYear,
        promoterName,
        companyType,
        nameOfBusiness,
        businessType,
        msmeType,
        addressOfPlant,
        nameOfOtherGroupCompanies,
        listOfMajorCustomers,
        detailsOfMajorLastYear,
        msme_no,
      },
    } = value;
    businessType = businessType.value;
    ////////////////////////////////msme type logic
    let msmeTypeValue = "";
    if (msmeType?.value == "Small") {
      msmeTypeValue = 3;
    }
    if (msmeType?.value == "Micro") {
      msmeTypeValue = 2;
    }
    if (msmeType?.value == "Medium") {
      msmeTypeValue = 1;
    }
    if (msmeType?.value == undefined) {
      msmeTypeValue = null;
    }
    if (msmeType?.value == "") {
      msmeTypeValue = "";
    }
    msmeType = msmeTypeValue;
    // msmeType = msmeType.value;
    ///////////////////////////////msme type logic over

    detailsOfMajorLastYear = detailsOfMajorLastYear.value;
    listOfMajorCustomers = listOfMajorCustomers.value;
    companyType = companyType.value;
    id = uuidv4();
    const insert_businessDetails = await trx("business_details").insert({
      created_at: timestampis,
      company_id: supplierId,
      id,
      companyFoundYear,
      promoterName,
      companyType,
      nameOfBusiness,
      businessType,
      msmeType,
      addressOfPlant,
      nameOfOtherGroupCompanies,
      listOfMajorCustomers,
      detailsOfMajorLastYear,
      msme_no,
    });

    if (!insert_businessDetails) {
      return res.status(500).json({
        error: true,
        message: "Inserting Business Details failed",
      });
    }

    //////////////////////////////////////////////
    // financial details
    //////////////////////////////////////////////

    let {
      financialDetails: {
        currency,
        Turnover,
        Turnover2,
        Turnover3,
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
        p_bank_name,
        p_bank_account_number,
        p_bank_account_holder_name,
        p_bank_state,
        p_bank_address,
        p_bank_branch,
        p_ifsc_code,
        p_micr_code,
        p_bank_guarantee_limit,
        p_overdraft_cash_credit_limit,
        s_bank_name,
        s_bank_account_number,
        s_bank_account_holder_name,
        s_bank_state,
        s_bank_address,
        s_bank_branch,
        s_ifsc_code,
        s_micr_code,
        s_bank_guarantee_limit,
        s_overdraft_cash_credit_limit,
      },
    } = value;

    currency = currency.value;
    id = uuidv4();
    const insertFinancialDetails = await trx("financial_details").insert({
      created_at: timestampis,
      company_id: supplierId,
      id,
      currency: currency,
      turnover: Turnover,
      turnover2: Turnover2,
      turnover3: Turnover3,
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
      p_bank_name,
      p_bank_account_number,
      p_bank_account_holder_name,
      p_bank_state,
      p_bank_address,
      p_bank_branch,
      p_ifsc_code,
      p_micr_code,
      p_bank_guarantee_limit,
      p_overdraft_cash_credit_limit,
      s_bank_name,
      s_bank_account_number,
      s_bank_account_holder_name,
      s_bank_state,
      s_bank_address,
      s_bank_branch,
      s_ifsc_code,
      s_micr_code,
      s_bank_guarantee_limit,
      s_overdraft_cash_credit_limit,
    });

    if (!insertFinancialDetails) {
      return res.status(500).json({
        error: true,
        message: "Inserting Financial Details failed",
      });
    }

    ///////////////////////////////////////////////////////
    //tax details
    ///////////////////////////////////////////////////////

    id = uuidv4();
    const {
      taxDetails: {
        gstRegDate,
        msmeImage,
        gstImage,
        cancelledChequeImage,
        panCardImage,
        pfAttachment,
        otherAttachments,
      },
    } = value;

    /////////////////////////////
    //stirng to date conversion
    /////////////////////////////

    var dateString = gstRegDate;

    const [year, month, day] = dateString.split("-").map(Number);
    // Months in JavaScript Date are zero-indexed, so we need to subtract 1 from the month.
    const javascriptDate = new Date(year, month - 1, day);
    const gstRegDateIs = javascriptDate;

    ////////////////////// date conversion over

    const insertTaxDetailsId = await trx("tax_details").insert({
      created_at: timestampis,
      id,
      company_id: supplierId,
      gstNo: gstNo,
      gstRegDate: gstRegDateIs,
      msmeImage,
      gstImage,
      cancelledChequeImage,
      panCardImage,
      pfAttachment,
      otherAttachments,
    });

    if (!insertTaxDetailsId) {
      return res.status(500).json({
        error: true,
        message: "Inserting Tax Details failed",
      });
    }

    //////////////additionalDetails store to dynamodb//////////////////////

    let { additionalDetails } = value;

    additionalDetails.supplier_id = supplierId;
    additionalDetails.created_at = "123";
    const tableName = "supplier_additional_fields";
    const items = additionalDetails;
    const insertParams = {
      TableName: tableName,
      Item: items,
    };

    const result = await functions.insertData(insertParams);
    if (!result) {
      return res.status(500).json({
        error: true,
        message: "Inserting in the database failed",
      });
    }
    ///////////additionalDetails store to dynamodb over //////////////////

    const getUserIds = await knex("approvers2")
      .where("portal_code", department.label)
      .first();

    console.log("ids", department.value);

    const getUserIds2 = await knex("approverTest")
      .where({
        departmentId: department.value,
      })
      .andWhere("level", "1")
      .select("userId")
      .first();

    console.log("userId:-", getUserIds2);

    if (!getUserIds2) {
      return res.status(500).json({
        error: true,
        message: "No approver found for the selected department",
      });
    }

    const getApproverEmail = await knex("users")
      .where({ id: getUserIds2.userId })
      .select()
      .first();
    console.log("this is mail", getApproverEmail);

    // console.log(
    //   "getUserId",
    //   getUserIds.level_1_user_id.replace(/^\[|\]$/g, "")
    // );

    //process.exit();
    /*
  const getApproverEmail = await knex("users")
    .where("id", getUserIds.level_1_user_id.replace(/^\[|\]$/g, ""))
    .first();
  */

    const firstName = getApproverEmail.firstname;

    const ApproversEmailis = getApproverEmail.email;

    //send email to approver also to inform him/her regarding new supplier registration

    if (ApproversEmailis != "") {
      const emailBody =
        ` <table style="border:0.5px solid orange; border-radius:5px;">
      <tr><td style="width:15%;"></td>
      <td style="padding:25px;"><b>Dear ` +
        firstName +
        `,</b><br><br><br>
      <b>` +
        supplier_name +
        `</b> has registered on our <b><a href="${constants.admindetails.homePageUrl}">portal</a></b>.Please login and check the details. <br><br>Regards, <br>
      <b>${constants.admindetails.companyFullName}</b><br><br>
    
      <br><br> <center>` +
        constants.admindetails.address1 +
        `
        ,<br> ` +
        constants.admindetails.address2 +
        `, ` +
        constants.admindetails.state +
        `,` +
        constants.admindetails.country +
        `<br>
        <center><br><img style="width:80px" src="${constants.admindetails.companyLogo}"></center>
  Powered by ${constants.admindetails.companyShortName}<br>
  Note: Do not reply this email. This is auto-generated email.
        </center>
      
      </td>
      
      <td style="width:15%"></td></tr></table>`;

      const sendEmailToApprover = await ses.sendEmail(
        "noreply@supplierx.aeonx.digital",
        ApproversEmailis,
        "New Vendor Registered",
        emailBody
      );
    }

    if (emailID != "") {
      const emailResponse = await passwordEmail.sendPassViaEmail(
        emailID,
        "Supplier Registeration",
        password
      );
      if (emailResponse.error) return res.status(500).json(emailResponse);
      const timeStamp = knex.fn.now();

      const createNotification = await notifications.createNotification(
        [createSupplierUser[0]],
        "Welcome Aboard!",
        "Welcome to SupplierX! We're thrilled to have you on board. 🎉",
        "0"
      );

      const logSupplier = await supplierLogs.logFunction(
        supplierId,
        gstNo,
        panNo,
        supplier_name,
        emailID,
        "registered",
        timeStamp
      );

      // const getGST = await knex("validateGST_PAN").where("gst", gstNo);
      // if (getGST.length <= 0) {
      //   const gstPanMsme = await knex("validateGST_PAN").insert({
      //     supplierId: id,
      //     supplierName: supplier_name,
      //     gst: gstNo,
      //     gstStatus: "Valid",
      //     gstTime: timestampis,
      //     pan: panNo,
      //     panStatus: "Valid",
      //     panTime: timestampis,
      //     msmeNo: msme_no,
      //     msmeStatus: "Valid",
      //     msmeTime: timestampis,
      //   });

      //   if (!gstPanMsme) {
      //     return res.json({
      //       error: true,
      //       message: "Supplier created successfully",
      //     });
      //   }
      // }

      await trx.commit();
      return res.status(201).json({
        error: false,
        message:
          "Supplier created successfully. Password is sent to the registered email.",
        data: {
          insertId: supplierId,
        },
      });
    }
  } catch (error) {
    console.log(error);
    await trx.rollback();
    return res.status(500).json({
      error: true,
      message: "Can't register Supplier",
      data: JSON.stringify(error),
      body: req.body,
    });
  }
};

const updateSupplier = async (req, res) => {
  const modifiedBy = await functions.getRollNameByHeader(
    req.headers["authorization"]
  );

  console.log("modifiedBy:-", modifiedBy);

  try {
    const typeOfSupplier = req.body.typeOfSupplier;
    // const typeOfSupplier = "domestic";

    let fieldsConfig;
    //domestic
    if (typeOfSupplier == "domestic") {
      fieldsConfig = await functions.getFieldConfig("supplier_registration", 1);
    }
    //international
    else if (typeOfSupplier == "international") {
      fieldsConfig = await functions.getFieldConfigInternational(
        "supplier_registration",
        1
      );
    }

    const conditionalValidation = (object, condition) =>
      condition === true ? object.required() : object.optional().allow("");

    const { error, value } = validation.updateSupplier(req.body, fieldsConfig);
    if (error) {
      return res.status(400).json({
        error: true,
        message: error.details[0].message,
        data: error,
      });
    }

    let {
      id = "",
      companyDetails: {
        emailID = "",
        mobile = "",
        telephone = "",
        designation = "",
        contactPersonName = "",
        cinNo = "",
        aadharNo = "",
        officeDetails = "",
        paymentMethod = "",
        website = "",
        phoneNo = "",
        pin = "",
        city = "",
        country = "",
        address3 = "",
        address2 = "",
        address1 = "",
        streetNo = "",
        source = "",
        supplier_name = "",
        add = "",
        state = "",
        department = "",
        gstNo = "",
        panNo = "",
      },
    } = value;
    if (gstNo === undefined || gstNo == "") {
      //not required to do anything
    } else {
      const check_pan_no = gstNo.substring(2, 12);

      if (check_pan_no != panNo) {
        return res.status(400).json({
          error: true,
          message: "Please provide correct Pan No",
        });
      }
    }

    const getSupplierDropDownValues = await knex("supplier_details")
      .where("id", id)
      .first();

    if (country.value) {
      country = country.value;
    } else {
      country = getSupplierDropDownValues.country;
    }

    if (source.value) {
      source = source.value;
    } else {
      source = getSupplierDropDownValues.source;
    }

    if (state.value) {
      state = state.value;
    } else {
      state = getSupplierDropDownValues.state;
    }

    if (paymentMethod.value) {
      paymentMethod = paymentMethod.value;
    } else {
      paymentMethod = getSupplierDropDownValues.paymentMethod;
    }

    const supplierId = id;

    const checkSupplierId = await knex("supplier_details")
      .where({
        id: supplierId,
      })
      .where({ status: "queried" });
    if (checkSupplierId.length <= 0) {
      return res.status(409).json({
        error: true,
        message: "Supplier yet not Queried",
      });
    }

    //get old values from table and store in object for checking changes...
    await functions.takeSnapShot("supplier_details", supplierId);

    const updateSupplierDetails = await knex("supplier_details")
      .update({
        // emailID,
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
        pin,
        city,
        country,
        address3,
        address2,
        address1,
        streetNo,
        source,
        //  supplier_name,
        add: add.value,
        state,
        department_id: department.value,
        department: department.label,
        //  gstNo,
        //  panNo,
        modifiedBy,
      })
      .where({ id: supplierId });

    if (!updateSupplierDetails) {
      return res.status(500).json({
        error: true,
        message: "Updating Supplier Details Failed",
      });
    }

    /////////////////////////////////////
    //// business details
    /////////////////////////////////////

    let {
      businessDetails: {
        companyFoundYear,
        promoterName,
        companyType,
        nameOfBusiness,
        businessType,
        msmeType,
        addressOfPlant,
        nameOfOtherGroupCompanies,
        listOfMajorCustomers,
        detailsOfMajorLastYear,
        msme_no,
      },
    } = value;

    const getBusinessDropDownValues = await knex("business_details")
      .where("company_id", id)
      .first();

    if (msmeType.value) {
      msmeType = msmeType.value;
    } else {
      msmeType = getBusinessDropDownValues.msmeType;
    }

    if (companyType.value) {
      companyType = companyType.value;
    } else {
      companyType = getBusinessDropDownValues.companyType;
    }

    if (businessType.value) {
      businessType = businessType.value;
    } else {
      businessType = getBusinessDropDownValues.businessType;
    }

    if (listOfMajorCustomers.value) {
      listOfMajorCustomers = listOfMajorCustomers.value;
    } else {
      listOfMajorCustomers = getBusinessDropDownValues.listOfMajorCustomers;
    }

    if (detailsOfMajorLastYear.value) {
      detailsOfMajorLastYear = detailsOfMajorLastYear.value;
    } else {
      detailsOfMajorLastYear = getBusinessDropDownValues.detailsOfMajorLastYear;
    }

    //get old values from table and store in object for checking changes...

    const businessDetailsOld = await knex("business_details")
      .where({ company_id: supplierId })
      .first();

    //get old values from table and store in object... over ...

    const getIdIs = await knex("business_details")
      .where({ company_id: supplierId })
      .first();
    await functions.takeSnapShot("financial_details", getIdIs.id);
    const insert_businessDetails = await knex("business_details")
      .update({
        companyFoundYear,
        promoterName,
        companyType,
        nameOfBusiness,
        businessType,
        msmeType,
        addressOfPlant,
        nameOfOtherGroupCompanies,
        listOfMajorCustomers,
        detailsOfMajorLastYear,
        msme_no,
        modifiedBy,
      })
      .where({ company_id: supplierId });

    if (!insert_businessDetails) {
      return res.status(500).json({
        error: true,
        message: "Updating Business Details failed",
      });
    }

    //////////////////////////////////////////////
    // financial details
    //////////////////////////////////////////////

    let {
      financialDetails: {
        currency,
        Turnover,
        Turnover2,
        Turnover3,
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
        p_bank_name,
        p_bank_account_number,
        p_bank_account_holder_name,
        p_bank_state,
        p_bank_address,
        p_bank_branch,
        p_ifsc_code,
        p_micr_code,
        p_bank_guarantee_limit,
        p_overdraft_cash_credit_limit,
        s_bank_name,
        s_bank_account_number,
        s_bank_account_holder_name,
        s_bank_state,
        s_bank_address,
        s_bank_branch,
        s_ifsc_code,
        s_micr_code,
        s_bank_guarantee_limit,
        s_overdraft_cash_credit_limit,
      },
    } = value;

    const getDropDownValues = await knex("financial_details")
      .where("company_id", id)
      .first();

    if (currency.value) {
      currency = currency.value;
    } else {
      currency = getDropDownValues.currency;
    }

    //get old values from table and store in object for checking changes...

    const financialDetailsOld = await knex("financial_details")
      .where({ company_id: supplierId })
      .first();

    //get old values from table and store in object...over...

    id = uuidv4();

    const getIdIs2 = await knex("financial_details")
      .where({ company_id: supplierId })
      .first();

    await functions.takeSnapShot("financial_details", getIdIs2.id);

    const insertFinancialDetails = await knex("financial_details")
      .update({
        currency: currency,
        turnover: Turnover,
        turnover2: Turnover2,
        turnover3: Turnover3,
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
        p_bank_name,
        p_bank_account_number,
        p_bank_account_holder_name,
        p_bank_state,
        p_bank_address,
        p_bank_branch,
        p_ifsc_code,
        p_micr_code,
        p_bank_guarantee_limit,
        p_overdraft_cash_credit_limit,
        s_bank_name,
        s_bank_account_number,
        s_bank_account_holder_name,
        s_bank_state,
        s_bank_address,
        s_bank_branch,
        s_ifsc_code,
        s_micr_code,
        s_bank_guarantee_limit,
        s_overdraft_cash_credit_limit,
        modifiedBy,
      })
      .where({ company_id: supplierId });

    if (!insertFinancialDetails) {
      return res.status(500).json({
        error: true,
        message: "Updating Financial Details failed",
      });
    }

    //////////////additionalDetails store to dynamodb//////////////////////

    let { additionalDetails } = value;

    additionalDetails.supplier_id = supplierId;
    additionalDetails.created_at = "123";
    const tableName = "supplier_additional_fields";
    const items = additionalDetails;
    const insertParams = {
      TableName: tableName,
      Item: items,
    };

    const result = await functions.insertData(insertParams);
    if (!result) {
      return res.status(500).json({
        error: true,
        message: "Inserting in the database failed",
      });
    }
    ///////////additionalDetails store to dynamodb over //////////////////
    let { approverComment, supplierComment } = value;

    // send email

    const getEmailOfStatusChanger = await knex("approversLogsTest")
      .where({ supplierId: supplierId })
      .where("status", "queried")
      .select("approverId");
    const checkId = getEmailOfStatusChanger[0].approverId;

    const getUserMail = await knex("users")
      .where({ id: checkId })
      .select("email");
    const userMail = getUserMail[0].email;

    const getSupplierName = await knex("supplier_details")
      .where({ id: supplierId })
      .select("supplier_name", "emailID", "status");

    if (getSupplierName[0].status === "approved") {
      return res.status(409).json({
        erro: true,
        message: "Approved supplier can not be updated",
      });
    }
    if (getSupplierName[0].status === "approved") {
      return res.status(409).json({
        erro: true,
        message: "Approved supplier can not be updated",
      });
    }

    const supplierName = getSupplierName[0].supplier_name;
    const supplierEmail = getSupplierName[0].emailID;

    let emailTemplate =
      "<table style='border:2px solid orange; width:100%; padding:10px;'><td style='width:20%'></td><td><br><br><br>" +
      "Hello,<br><br> You made query towards: <b>" +
      supplierName +
      "</b><br> having e-mail :- " +
      supplierEmail +
      "<br> has given respond. <br>" +
      "<br><i>Query:</i> " +
      approverComment +
      "<br><br><i>Respond:</i> " +
      supplierComment +
      `.<br><br> Please check it on our portal <a href='${constants.admindetails.homePageUrl}' target='_blank'>${constants.admindetails.homePageUrl}</a>.` +
      "<br><br>Regards, <br>" +
      `<B>${constants.admindetails.companyFullName}</B> <br><br><br>` +
      `<center>${constants.admindetails.address1},<br>${constants.admindetails.address2}, ${constants.admindetails.state},${constants.admindetails.country}<br><br><img style='width:80px;' src='${constants.admindetails.companyLogo}'/><br>Powered by ${constants.admindetails.companyShortName}<br>Note: Do not reply this email. This is auto-generated email.</center></td><td style='width:20%'></td></table>`;
    ////////////////////////////////
    // store comments in a table
    //////////////////////////////////////////////////////////////////////////////

    const getIdIs3 = await knex("supplier_query_respond")
      .where({ supplierId: supplierId })
      .first();

    const updateQueryRespond = await knex("queriedTimeline")
      .update({ queryAnswer: supplierComment })
      .where("supplierId", supplierId)
      .where("query", approverComment);

    const getId = await knex("supplier_query_respond")
      .where("supplierId", supplierId)
      .where("query", approverComment)
      .first();

    /////////////////////////////////////////////////////////////////
    // send email
    /////////////////////////////////////////////////////////////////
    const send_email = await ses.sendEmail(
      constants.sesCredentials.fromEmails.emailOtp,
      userMail,
      supplierName + " has given Answer of query",
      emailTemplate
    );

    const updationDataIs = await functions.takeSnapShot(
      "supplier_details",
      supplierId
    );

    const changeStatusSupplier = await knex("supplier_details")
      .where({
        id: supplierId,
      })
      .update({
        status: "pending",
        modifiedBy,
      });

    if (!changeStatusSupplier) {
      return res.status(500).json({
        error: true,
        message: "Can't change status of Supplier",
      });
    }
    return res.status(200).json({
      error: false,
      message: "Information updated successfully",
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: "Could not update record.",
      data: error,
    });
  }
};

const updateSupplierByAdmin = async (req, res) => {
  var trx = await knex.transaction();
  try {
    const { error, value } = validation.updateSupplierByAdmin(req.body);

    if (error) {
      return res
        .status(400)
        .json({ error: true, message: error.details[0].message })
        .end();
    }

    const { id, additionalDetails, itWitholding } = value;

    const checkId = await knex("supplier_details").where({
      id: id,
    });

    if (!checkId) {
      return res
        .status(404)
        .json({ error: true, message: "Supplier does not exist" })
        .end();
    }

    //if sapcode exist then admin can not update data

    const getSapCode = await knex("supplier_details")
      .where("id", id)
      .select("sap_code")
      .first();

    if (getSapCode.sap_code) {
      return res.status(409).json({
        error: true,
        message: "SAPCODE is already there, we can't update data of supplier",
      });
    }

    //store snapshot of additional_company_details's record, before updating

    const getData = await knex("additional_company_details")
      .where("supplier_id", id)
      .first();

    if (!getData) {
      return res
        .status(500)
        .json({ error: true, message: "Can't get data of supplier" });
    }

    const storeData = await trx("supplier_old_details").insert({
      supplierId: id,
      companies: getData.companies,
      reconciliationAc: getData.reconciliation_ac,
      vendorClass: getData.vendor_class,
      vendorSchema: getData.vendor_schema,
      businessPartnerGroups: getData.business_partner_groups,
      paymentTerms: getData.payment_terms,
      itWitholding: getData.itWitholding,
      purchaseGroup: getData.purchase_group,
    });

    //store snapshot of additional_company_details's record, is over...

    const modifiedBy = await functions.getRollNameByHeader(
      req.headers["authorization"]
    );

    const updateData = await trx("additional_company_details")
      .where("supplier_id", id)
      .update({
        companies: JSON.stringify(additionalDetails.nameOfCompany),
        reconciliation_ac: additionalDetails.reconciliationAccount,
        vendor_class: additionalDetails.vendorClass,
        vendor_schema: additionalDetails.vendorSchema,
        business_partner_groups: additionalDetails.businessPartnerGroup,
        payment_terms: additionalDetails.paymentTerms,
        itWitholding: JSON.stringify(itWitholding),
        purchase_group: additionalDetails.purchaseGroup,
        modifiedBy: modifiedBy | "Admin",
      });

    if (!updateData) {
      return res.status(500).json({
        error: true,
        message: "Can't update data of supplier",
      });
    }
    // if (id) {
    //   //modified by code...
    //   const modifiedByTable1 = await functions.SetModifiedBy(
    //     req.headers["authorization"],
    //     "additional_company_details",
    //     "supplier_id",
    //     id
    //   );
    // }
    //update Y in supplier details table for field: "updateByAdmin"

    const updateByAdmin = await trx("supplier_details")
      .where("id", id)
      .update({ updateByAdmin: "Y", modifiedBy: JSON.stringify(modifiedBy) });

    // console.log("isUpdated:-", modifiedByTable1);
    // if (id) {
    //   const modifiedByTable2 = await functions.SetModifiedBy(
    //     req.headers["authorization"],
    //     "supplier_details",
    //     "id",
    //     id
    //   );
    //   console.log("isUpdated:-", modifiedByTable2);
    // }
    //modified by code over ...
    await trx.commit();
    return res
      .status(200)
      .json({ error: false, message: "Data updated successfully" });
  } catch (error) {
    await trx.rollback();
    return res
      .status(500)
      .json({ error: true, message: "Updation can not done" })
      .end();
  }
};

const checkIfEmailExist = async (req, res) => {
  try {
    const { email } = req.body;

    const checkmail = await knex("supplier_details")
      .where("emailID", email)
      .select("emailID");

    if (checkmail && checkmail.length > 0) {
      return res.status(409).json({
        usedMail: true,
        message:
          "This email address is already in use. Please use a different email address.",
      });
    } else {
      return res.status(200).json({
        usedMail: false,
        message: "This mail is available",
      });
    }
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: "Can't check email of Supplier",
      data: JSON.stringify(error),
    });
  }
};

const sendOtp = async (req, res) => {
  try {
    const { error, value } = validation.sendOtp(req.body);
    if (error) {
      return res.status(400).json({
        error: true,
        message: error.details[0].message,
        data: error,
      });
    }
    const { email } = value;

    if (functions.validateEmail(email)) {
      // console.log("Email is valid");
    } else {
      // console.log("Email is invalid");
      return res
        .status(400)
        .json({ error: true, message: "Email is invalid" })
        .end();
    }

    const check = await knex("supplier_details").where({
      emailID: email,
    });

    if (check.length != 0)
      return res.json({
        error: true,
        message: "Email Already Registered.",
      });

    const otpResponse = await otp.sendOtpViaEmail(
      email,
      "Supplier registration",
      constants.processes.supplierRegistration
    );
    if (otpResponse.error) {
      return res.status(500).json({
        error: true,
        message: otpResponse.message,
        data: otpResponse.data,
      });
    }
    return res.status(200).json(otpResponse);
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: "Can't sent OTP",
      data: JSON.stringify(error.message),
    });
  }
};
const verifyOtp = async (req, res) => {
  const { email, otp } = req.body;
  try {
    // Fetch the latest OTP from the database based on the provided email
    const existingOTP = await knex("otps")
      .where({ identifier: email })
      .orderBy("time", "desc")
      .first();

    if (!existingOTP) {
      return res
        .status(400)
        .json({ success: false, message: "OTP not found or expired" });
    }

    // Verify if the provided OTP matches the OTP from the database
    if (existingOTP.otp == otp) {
      return res
        .status(200)
        .json({ error: false, message: "OTP verification successful" });
      return res.json({ error: false, message: "OTP verification successful" });
    } else {
      return res.status(409).json({ error: true, message: "Invalid OTP" });
    }
  } catch (err) {
    console.error("Error verifying OTP:", err);
    return res
      .status(500)
      .json({ error: true, message: "Error verifying OTP" });
    return res.json({ error: true, message: "Error verifying OTP" });
  }
};

//combined list for admin and approver
// const listSupplier = async (req, res) => {
//   // try {
//   const tableName = "supplier_details";
//   const searchFrom = [
//     "supplier_name",
//     "aadharNo",
//     "city",
//     "country",
//     "panNo",
//     "gstNo",
//     "state",
//     "emailID",
//   ];

//   const token = req.headers["authorization"];
//   const { jwtConfig } = constants;
//   const payload = jwt.decode(token.split(" ")[1], jwtConfig.secret);
//   console.log(payload, "this is payload");
//   const id = payload.id;
//   const role = payload.role;
//   const roleName = payload.permissions[0]
//     ? payload.permissions[0]
//     : payload.permissions;

//   const schema = Joi.object({
//     offset: Joi.number().default(0),
//     limit: Joi.number().default(50),
//     sort: Joi.string().default("id"),
//     order: Joi.string().valid("asc", "desc").default("desc"),
//     status: Joi.string()
//       .valid("pending", "rejected", "queried", "approved", "all")
//       .default("all"),
//     search: Joi.string().allow("", null).default(null),
//     filter: Joi.object().default({}),
//   });

//   const { error, value } = schema.validate(req.body);
//   if (error) {
//     return res.json({
//       error: true,
//       message: error.details[0].message,
//       data: error,
//     });
//   }

//   const { offset, limit, order, sort, search, status, filter } = value;

//   let results = knex(tableName).select(
//     "id",
//     "supplier_name",
//     "status",
//     "sap_code",
//     "department as registeryAuthority",
//     "department_id",
//     "aadharNo",
//     "pin",
//     "city",
//     "country",
//     "address1",
//     "address2",
//     "address3",
//     "streetNo",
//     "state",
//     "panNo",
//     "gstNo",
//     "emailID",
//     knex.raw("CONVERT_TZ(created_at, '+00:00', '+05:30') as created_at"),
//     knex.raw("CONVERT_TZ(updated_at, '+00:00', '+05:30') as updated_at")
//   );
//   console.log(filter);
//   if (filter) {
//     const { startDate, endDate, dateField } = filter;
//     if (startDate && endDate && dateField) {
//       const startDateISO = new Date(startDate).toISOString();
//       const endDateISO = new Date(endDate + "T23:59:59.999Z").toISOString();

//       if (dateField === "created_at") {
//         results.whereBetween("created_at", [startDateISO, endDateISO]);
//       } else if (dateField === "updated_at") {
//         results.whereBetween("updated_at", [startDateISO, endDateISO]);
//       }
//     }
//   }

//   if (status !== "all") {
//     results.where("status", status);
//   }

//   results.where(function () {
//     if (search != undefined && search != "") {
//       searchFrom.forEach((element) => {
//         this.orWhereILike(element, `%${search}%`);
//       });
//     }
//   });

//   const getRole = await knex("users_roles").where("id", role).first();
//   const getRoleName = getRole.role_name;
//   if (getRoleName == "Approver" || roleName == "Approver") {
//     const getDeptId = await knex("users").where("id", id).first();

//     if (
//       getDeptId &&
//       getDeptId.approverofdept != undefined &&
//       getDeptId.approverofdept != ""
//     ) {
//       results.where("department_id", getDeptId.approverofdept);
//     }
//     // results.where('registeryAuthority',)
//   }

//   const total = await results.clone().count("id as total").first();

//   results = results.orderBy(sort, order).limit(limit).offset(offset);

//   let data_rows = await results;

//   if (data_rows.length === 0) {
//     return res.json({
//       error: false,
//       data: [],
//       message: "No results found for the given filtered date range.",
//     });
//   }

//   let sr = offset + 1;
//   data_rows = await Promise.all(
//     data_rows.map(async (row) => {
//       row.sr = order === "desc" ? sr++ : total.total - limit * offset--;
//       const getStateName = await knex("states")
//         .where("stateKey", row.state)
//         .where("countryKey", row.country)
//         .select("stateDesc")
//         .first();
//       row.state = getStateName ? getStateName.stateDesc : "";
//       return row;
//     })
//   );

//   return res.status(200).json({
//     error: false,
//     message: "Retrieved successfully.",
//     data: data_rows,
//     total: total.total,
//   });
//   // } catch (error) {
//   //   return res.json({
//   //     error: true,
//   //     message: "Something went wrong",
//   //     data: JSON.stringify(error),
//   //   });
//   // }
// };

const listSupplier = async (req, res) => {
  try {
    const tableName = "supplier_details";
    const searchFrom = [
      "supplier_name",
      "aadharNo",
      "city",
      "country",
      "panNo",
      "gstNo",
      "state",
      "emailID",
    ];

    const token = req.headers["authorization"];
    const { jwtConfig } = constants;
    const payload = jwt.decode(token.split(" ")[1], jwtConfig.secret);
    // console.log(payload, "payload");
    const id = payload.id;
    const role = payload.role;
    const role_id = payload.role_id;
    const roleName = payload.permissions[0]
      ? payload.permissions[0]
      : payload.permissions;

    const { error, value } = validation.listSupplier(req.body);
    if (error) {
      return res.status(400).json({
        error: true,
        message: error.details[0].message,
        data: error,
      });
    }

    const {
      offset,
      limit,
      order,
      sort,
      search,
      status,
      filter,
      department_id,
    } = value;

    let results = knex(tableName).select(
      "id",
      "supplier_name",
      "typeOfSupplier",
      "status",
      "sap_code",
      "department as registeryAuthority",
      "department_id",
      "aadharNo",
      "pin",
      "city",
      "country",
      "address1",
      "address2",
      "address3",
      "streetNo",
      "state",
      "panNo",
      "gstNo",
      "emailID",
      knex.raw("CONVERT_TZ(created_at, '+00:00', '+05:30') as created_at"),
      knex.raw("CONVERT_TZ(updated_at, '+00:00', '+05:30') as updated_at")
    );

    if (filter) {
      const { startDate, endDate, dateField } = filter;
      if (startDate && endDate && dateField) {
        const startDateISO = new Date(startDate).toISOString();
        const endDateISO = new Date(endDate + "T23:59:59.999Z").toISOString();

        if (dateField === "created_at") {
          results.whereBetween("created_at", [startDateISO, endDateISO]);
        } else if (dateField === "updated_at") {
          results.whereBetween("updated_at", [startDateISO, endDateISO]);
        }
      }
    }

    if (status !== "all") {
      results.where("status", status);
    }

    results.where(function () {
      if (search != undefined && search != "") {
        searchFrom.forEach((element) => {
          this.orWhereILike(element, `%${search}%`);
        });
      }
    });
    // console.log("role", role);

    if (department_id !== undefined && department_id !== "") {
      results.where("department_id", department_id);
    }
    const getRole = await knex("role").where("id", role_id).first();

    const getRoleName = getRole.name;
    if (getRoleName == "Approver" || roleName == "Approver") {
      const getDeptId = await knex("users").where("id", id).first();

      if (
        getDeptId &&
        getDeptId.approverofdept != undefined &&
        getDeptId.approverofdept != ""
      ) {
        results.where("department_id", getDeptId.approverofdept);
      }
      // results.where('registeryAuthority',)
    }

    const total = await results.clone().count("id as total").first();

    results = results.orderBy(sort, order).limit(limit).offset(offset);

    let data_rows = await results;

    //find typeOfSupplier weather domestic or international
    /*
  for (const element of data_rows) {
    // console.log("e:-",element.department_id);
    const getDeptSlug = await knex("departments")
      .where("id", element.department_id)
      .select("slug")
      .first();
    if (!getDeptSlug) {
      element.typeOfSupplier = "domestic";
    } else if (getDeptSlug.slug == "") {
      element.typeOfSupplier = "domestic";
    } else {
      const slug = getDeptSlug.slug;
      const slugPart = slug.substring(0, 1);
      if (slugPart == "d") {
        element.typeOfSupplier = "domestic";
      } else if (slugPart == "i") {
        element.typeOfSupplier = "international";
      } else if (slugPart == "g") {
        element.typeOfSupplier = "domestic";
      }
    }
  }
  */
    //find typeOfSupplier weather domestic or international over
    let sr = offset + 1;
    data_rows = await Promise.all(
      data_rows.map(async (row) => {
        row.sr = order === "desc" ? sr++ : total.total - limit * offset--;
        const getStateName = await knex("states")
          .where("stateKey", row.state)
          .where("countryKey", row.country)
          .select("stateDesc")
          .first();
        row.state = getStateName ? getStateName.stateDesc : "";
        return row;
      })
    );

    return res.status(200).json({
      error: false,
      message: "Retrieved successfully.",
      data: data_rows,
      total: total.total,
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: "Could not load record.",
      data: JSON.stringify(error),
    });
  }
};
const syncFromSap = async (req, res) => {
  const { error, value } = validation.syncFromSap(req.body);

  if (error) {
    return res.status(400).json({
      error: true,
      message: error.details[0].message,
    });
  }

  const {
    WA_GENERAL_DATA,
    IT_TELEPHONE,
    IT_EMAIL,
    IT_IDENTIFICATION,
    IT_TAX_NUMBER,
    IT_BANK,
    IT_COCODE_DATA,
    IT_PURC_DATA,
  } = value;
};

const viewFieldsForSap = async (req, res) => {
  const supplier_id = req.params.id;
  const getSupplierDetails = await knex("supplier_details")
    .where("id", supplier_id)
    .first();

  if (!getSupplierDetails) {
    return res.status(404).json({
      error: true,
      message: "Supplier does not exist",
    });
  }

  return res.status(200).json({
    WA_GENERAL_DATA: {
      DOC_NUMBER: "xyz123",
      PARTN_GRP: "ZGEN",
      TITLE_KEY: "",
      NAME1: getSupplierDetails.contactPersonName,
      NAME2: "TRADERS",
      NAME3: "",
      NAME4: "",
      SEARCHTERM1: "SHANKAR TRADERS 1",
      HOUSE_NO: "244-35",
      STREET: getSupplierDetails.streetNo,
      STR_SUPPL1: "BUS STATION ROAD 100",
      STR_SUPPL2: "OPP SBI BANK ANKLAV",
      STR_SUPPL3: "ANKLAV",
      CITY: getSupplierDetails.city,
      DISTRICT: "ANAND",
      POSTL_COD1: getSupplierDetails.pin + "",
      REGION: "06",
      COUNTRY: getSupplierDetails.country,
      VEN_CLASS: "",
      J_1IPANNO: "AAJPZ1235Y",
      TIME_STAMP: "",
    },
    IT_TELEPHONE: [
      {
        R_3_USER: "2",
        COUNTRY: "IN",
        TELEPHONE: getSupplierDetails.telephone + "",
        EXTENSION: "",
      },
      {
        R_3_USER: "",
        COUNTRY: "IN",
        TELEPHONE: getSupplierDetails.telephone + "",
        EXTENSION: "",
      },
    ],
    IT_EMAIL: [
      {
        E_MAIL: getSupplierDetails.emailID + "",
      },
      {
        E_MAIL: getSupplierDetails.emailID + "",
      },
    ],
    IT_IDENTIFICATION: [
      {
        ID_CATEGORY: "BUP001",
        ID_NUMBER: "BUP989898989",
        ID_INSTITUTE: "Yograjsinh Zala",
        ID_VALID_FROM_DATE: "20220202.",
        ID_VALID_TO_DATE: "20250202",
        ID_COUNTRY: "IN",
        ID_REGION: "06",
      },
    ],
    IT_TAX_NUMBER: [
      {
        TAXTYPE: "IN3",
        TAXNUMBER: getSupplierDetails.gstNo,
      },
    ],
    IT_BANK: [
      {
        BANK_COUNTRY: "IN",
        BANK_KEY: "SBI00124",
        BANK_ACCOUNT_NUMBER: "99990000000",
        REFERENCE_DETAILS: "",
        BANK_DETAILS_EXTERNAL: "",
        ACCOUNT_HOLDER_NAME: "SHANKAR TRADERS NEW",
        BANK_ACCOUNT_NAME: "SHANKAR TRADERS NEW",
        BANK_NAME: "STATE BANK OF INDIA",
        REGION: "06",
        STREET: "BUS STATION ROAD",
        CITY: "ANAND",
        SWIFT_CODE: "",
        BANK_BRANCH: "ANAND",
      },
    ],
    IT_COCODE_DATA: [
      {
        COMPANY_CODE: "1003",
        RECON_ACCOUNT: "20600000",
        HEAD_OFFICE: "",
        PLANNING_GROUP: "",
        PAYMENT_TERMS: "0001",
        CHECK_DOUBLE_INVOICE: "",
        PAYMENT_METHODS: "CT",
        IT_WITHHOLDING: [
          {
            TAX_TYPE: "C1",
            TAX_CODE: "C1",
            WT_SUBJCT: "X",
            RECIPIENT_TYPE: "CO",
          },
          {
            TAX_TYPE: "A1",
            TAX_CODE: "",
            WT_SUBJCT: "",
            RECIPIENT_TYPE: "CO",
          },
        ],
      },
    ],
    IT_PURC_DATA: [
      {
        PURCHASING_ORGANIZATION: "1003",
        CURRENCY: "INR",
        PAYMENT_TERMS: "0001",
        INCOTERMS_P1: "",
        INCOTERMS_LOC1: "",
        INCOTERMS_LOC2: "",
        GR_BASEDIV: "X",
        SERV_BASEDIV: "X",
        SCHEMA_GRP: "DM",
        PURCHASING_GROUP: "P01",
      },
    ],
  });
};

// const changestatus = async (req, res) => {
//   // try {
//     const token = req.headers["authorization"];
//     if (!token) {
//       return res.json({
//         error: true,
//         message: "Token is required.",
//       });
//     }
//     const { jwtConfig } = constants;
//     const payload = jwt.decode(token.split(" ")[1], jwtConfig.secret);
//     const statusChanger = payload.permissions[0];
//     const statusChangerId = payload.id;
//     const email = payload.email;

//     const schema = Joi.object({
//       supplier_id: Joi.string().uuid().required().trim(),
//       user_id: Joi.number().required(),
//       user_role: Joi.number().required(),
//       approver_level: Joi.number().required().min(1),
//       approver_hr_level: Joi.number().required(),
//       status: Joi.string()
//         .valid("pending", "approved", "verified", "rejected", "queried")
//         .default("pending"),
//       comment: Joi.string().required(),
//       subscriber_id: Joi.number().required(),
//       isEditable: Joi.valid("0", "1").default("0"),
//     });

//         const { error, value } = schema.validate(req.body);
//         if (error) {
//           return res.json({
//             error: true,
//             message: error.details[0].message,
//           });
//         }

//         const {
//           supplier_id,
//           status,
//           comment,
//           user_id,
//           user_role,
//           approver_level,
//           approver_hr_level,
//           subscriber_id,
//           isEditable,
//         } = value;

//         const getUserName = await knex("users").where({ id: user_id }).first();

//         // const getApproverLevelName = await knex("approval_hierarchy").where({approver_level_name:approver_level});
//         //

//         if (approver_level === 0) {
//           return res.json({
//             error: true,
//             message: "Approver level cannot be zero",
//           });
//         }

//         const checkUserInUsers = await knex("users").where({ id: user_id }).first();
//         if (!checkUserInUsers) {
//           return res.json({
//             error: true,
//             message: "User does not exist",
//           });
//         }

//         if (checkUserInUsers.role !== "3") {
//           return res.json({
//             error: true,
//             message: "Only approver can change the status",
//           });
//         }

//         //check user role in approval hierarchy

//         const checkRoleIdExist = await knex("approval_hierarchy")
//           .where({ role_id: user_role })
//           .first();
//         if (!checkRoleIdExist) {
//           return res.json({
//             error: true,
//             message: "This role is not approver",
//           });
//         }

//         //check approval level in approval hierarchy
//         const checkApprovalHierarchyLevel = await knex("approval_hierarchy")
//           .where({ approval_hierarchy_level: approver_hr_level })
//           .first();
//         if (!checkApprovalHierarchyLevel) {
//           return res.json({
//             error: true,
//             message: "Approver Hierarchy Level does not exist",
//           });
//         }

//         //check approval_name in approval hierarchy

//         // const checkApprovalLevelNameExist = await knex("approval_hierarchy")
//         //   .where({ approver_level: approver_level })
//         //   .first();
//         // if (!checkApprovalLevelNameExist) {
//         //   return res.json({
//         //     error: true,
//         //     message: "approver_level does not exist",
//         //   });
//         // }

//     const checkSupplierIdExist = await knex("supplier_details")
//       .where({ id: supplier_id })
//       .first();
//     if (!checkSupplierIdExist) {
//       return res.json({
//         error: true,
//         message: "Supplier does not exist",
//       });
//     }

//     // New logic to check if the current status is "approved" or "rejected"
//     const currentSupplierStatus = checkSupplierIdExist.status;
//     if (["approved", "rejected"].includes(currentSupplierStatus)) {
//       return res.json({
//         error: true,
//         message: `Supplier already ${status}`,
//       });
//     }

//     if (
//       currentSupplierStatus === "pending" &&
//       !["approved", "rejected", "queried"].includes(status)
//     ) {
//       return res.json({
//         error: true,
//         message:
//           "Pending status can only be changed to approved, rejected, or queried",
//       });
//     }

//     //     // Check user role and allow changeStatus only for role 3

//     //     //check if user exist in users

//     //     // Check approver role and hierarchy level
//     //     if (approver_level > approver_hr_level) {
//     //       return res.json({
//     //         error: true,
//     //         message: "Approver level cannot be greater than hierarchy level",
//     //       });
//     //     }

//     //     const timestampis = knex.fn.now();

//     //     // if (approver_level == "1") {
//     //     //   const changeStatus = await knex("supplier_details")
//     //     //     .update({
//     //     //       status: status,
//     //     //       level1status: status,
//     //     //       status_update_date: timestampis,
//     //     //       comment: comment,
//     //     //     })
//     //     //     .where({
//     //     //       id: supplier_id,
//     //     //     });

//     //     //   if (changeStatus === 0) {
//     //     //     return res.json({
//     //     //       error: true,
//     //     //       message: "Supplier does not exist",
//     //     //     });
//     //     //   }
//     //     // }
//     //     // if (approver_level == "2") {
//     //     //   const changeStatus = await knex("supplier_details")
//     //     //     .update({
//     //     //       status: status,
//     //     //       level2status: status,
//     //     //       status_update_date: timestampis,
//     //     //       comment: comment,
//     //     //     })
//     //     //     .where({
//     //     //       id: supplier_id,
//     //     //     });

//     //     //   if (changeStatus === 0) {
//     //     //     return res.json({
//     //     //       error: true,
//     //     //       message: "Supplier does not exist",
//     //     //     });
//     //     //   }
//     //     // }

//     //     const getApprovalLevel = await knex("users")
//     //       .where("id", user_id)
//     //       .select("level")
//     //       .first();

//     //     console.log(" this is get approver level", getApprovalLevel);
//     //     if (getApprovalLevel.level == 1) {
//     //       const allowedStatusChanges = [
//     //         "queried",
//     //         "rejected",
//     //         "pending",
//     //         "verified",
//     //         "approved",
//     //       ];
//     //       if (!allowedStatusChanges.includes(status)) {
//     //         return res.json({
//     //           error: true,
//     //           message:
//     //             "Level 1 users can only change status to queried, rejected, pending, or verified.",
//     //         });
//     //       }

//     //       const changeStatusLevel1 = await knex("supplier_details")
//     //         .update({
//     //           level1status: status,
//     //           status: status,
//     //           status_update_date: timestampis,
//     //           comment: comment,
//     //         })
//     //         .where({
//     //           id: supplier_id,
//     //         });

//     //       if (changeStatusLevel1 === 0) {
//     //         return res.json({
//     //           error: true,
//     //           message: "Supplier does not exist",
//     //         });
//     //       }
//     //     } else if (getApprovalLevel.level == 2) {
//     //       const allowedStatusChanges = ["approved", "rejected", "queried"];
//     //       if (!allowedStatusChanges.includes(status)) {
//     //         return res.json({
//     //           error: true,
//     //           message:
//     //             "Level 2 users can only change status to approved, rejected, queried, or pending.",
//     //         });
//     //       }

//     //       const changeStatusLevel2 = await knex("supplier_details")
//     //         .update({
//     //           level2status: status,
//     //           status: status,
//     //           status_update_date: timestampis,
//     //           comment: comment,
//     //         })
//     //         .where({
//     //           id: supplier_id,
//     //         });

//     //       if (changeStatusLevel2 === 0) {
//     //         return res.json({
//     //           error: true,
//     //           message: "Supplier does not exist",
//     //         });
//     //       }
//     //     }

//     //     //store status in approvalTimeline
//     //     // Check if supplierId exists
//     //     const checkSupplierId = await knex("approval_timeline").where({
//     //       supplier_id: supplier_id,
//     //     });
//     //     const time = moment.tz("Asia/Kolkata").format("YYYY-MM-DD HH:mm:ss");

//     //     if (status == "queried") {
//     //       //store in queried table also
//     //       //check if supplierId exist
//     //       //  const checkSupId=await knex("supplier_query_respond").where({supplierId:supplier_id})
//     //       const insertInQueryTab = await knex("supplier_query_respond").insert({
//     //         supplierId: supplier_id,
//     //         approverId: user_id,
//     //         query: comment,
//     //       });
//     //       if (insertInQueryTab.length <= 0) {
//     //         return res
//     //           .json({
//     //             error: true,
//     //             message: "Unalbe to insert in query table",
//     //           })
//     //           .end();
//     //       }
//     //     }
//     //     if (checkSupplierId.length <= 0) {
//     //       if (status === "queried") {
//     //         const statusStoreInTimeline = await knex("approval_timeline").insert({
//     //           supplier_id: supplier_id,
//     //           queried: user_id,
//     //           queriedRemarks: comment,
//     //           queriedTime: time,
//     //           isEditable: isEditable,
//     //         });
//     //       } else if (status === "approved") {
//     //         const statusStoreInTimeline = await knex("approval_timeline").insert({
//     //           supplier_id: supplier_id,
//     //           approved: user_id,
//     //           approvedRemarks: comment,
//     //           approvedTime: time,
//     //           isEditable: isEditable,
//     //         });
//     //       } else if (status === "rejected") {
//     //         const statusStoreInTimeline = await knex("approval_timeline").insert({
//     //           supplier_id: supplier_id,
//     //           rejected: user_id,
//     //           rejectedRemarks: comment,
//     //           rejectedTime: time,
//     //           isEditable: isEditable,
//     //         });
//     //       }
//     //     } else {
//     //       if (status === "queried") {
//     //         const statusStoreInTimeline = await knex("approval_timeline")
//     //           .where({ supplier_id: supplier_id })
//     //           .update({
//     //             queried: user_id,
//     //             queriedRemarks: comment,
//     //             queriedTime: time,
//     //             isEditable: isEditable,
//     //           });
//     //       } else if (status === "approved") {
//     //         const statusStoreInTimeline = await knex("approval_timeline")
//     //           .where({ supplier_id: supplier_id })
//     //           .update({
//     //             approved: user_id,
//     //             approvedRemarks: comment,
//     //             approvedTime: time,
//     //             isEditable: isEditable,
//     //           });
//     //       } else if (status === "rejected") {
//     //         const statusStoreInTimeline = await knex("approval_timeline")
//     //           .where({ supplier_id: supplier_id })
//     //           .update({
//     //             rejected: user_id,
//     //             rejectedRemarks: comment,
//     //             rejectedTime: time,
//     //             isEditable: isEditable,
//     //           });
//     //       }
//     //     }

//     //     //store history of status in a table : supplier_status

//     //     const storeStatus = await knex("supplier_status").insert({
//     //       supplier_id: supplier_id,
//     //       user_id: user_id,
//     //       status: status,
//     //       comment: comment,
//     //       approver_level: getApprovalLevel.level,
//     //       level1status: getApprovalLevel.level === 1 ? status : null,
//     //       level2status: getApprovalLevel.level === 2 ? status : null,
//     //     });

//     //   if (changeStatus === 0) {
//     //     return res.json({
//     //       error: true,
//     //       message: "Supplier does not exist",
//     //     });
//     //   }
//     // }
//     // if (approver_level == "2") {
//     //   const changeStatus = await knex("supplier_details")
//     //     .update({
//     //       status: status,
//     //       level2status: status,
//     //       status_update_date: timestampis,
//     //       comment: comment,
//     //     })
//     //     .where({
//     //       id: supplier_id,
//     //     });

//     //   if (changeStatus === 0) {
//     //     return res.json({
//     //       error: true,
//     //       message: "Supplier does not exist",
//     //     });
//     //   }
//     // }

//     const getApprovalLevel = await knex("users")
//       .where("id", user_id)
//       .select("level")
//       .first();

//     if (getApprovalLevel.level == 1) {
//       const allowedStatusChanges = [
//         "queried",
//         "rejected",
//         "pending",
//         "verified",
//         "approved",
//       ];
//       if (!allowedStatusChanges.includes(status)) {
//         return res.json({
//           error: true,
//           message:
//             "Level 1 users can only change status to queried, rejected, pending, or verified.",
//         });
//       }

//       const updationDataIs = await functions.takeSnapShot(
//         "supplier_details",
//         supplier_id
//       );

//       const changeStatusLevel1 = await knex("supplier_details")
//         .update({
//           level1status: status,
//           status: status,
//           status_update_date: timestampis,
//           comment: comment,
//         })
//         .where({
//           id: supplier_id,
//         });

//       if (changeStatusLevel1 === 0) {
//         return res.json({
//           error: true,
//           message: "Supplier does not exist",
//         });
//       }

//       if (supplier_id) {
//         const modifiedByTable1 = await functions.SetModifiedBy(
//           req.headers["authorization"],
//           "supplier_details",
//           "id",
//           supplier_id
//         );
//         console.log("isUpdated:-", modifiedByTable1);
//       }
//     } else if (getApprovalLevel.level == 2) {
//       const allowedStatusChanges = ["approved", "rejected", "queried"];
//       if (!allowedStatusChanges.includes(status)) {
//         return res.json({
//           error: true,
//           message:
//             "Level 2 users can only change status to approved, rejected, queried, or pending.",
//         });
//       }

//       const updationDataIs = await functions.takeSnapShot(
//         "supplier_details",
//         supplier_id
//       );
//       const changeStatusLevel2 = await knex("supplier_details")
//         .update({
//           level2status: status,
//           status: status,
//           status_update_date: timestampis,
//           comment: comment,
//         })
//         .where({
//           id: supplier_id,
//         });

//       if (changeStatusLevel2 === 0) {
//         return res.json({
//           error: true,
//           message: "Supplier does not exist",
//         });
//       }
//       if (supplier_id) {
//         const modifiedByTable1 = await functions.SetModifiedBy(
//           req.headers["authorization"],
//           "supplier_details",
//           "id",
//           supplier_id
//         );
//         console.log("isUpdated:-", modifiedByTable1);
//       }
//     }

//     //store status in approvalTimeline
//     // Check if supplierId exists
//     const checkSupplierId = await knex("approval_timeline").where({
//       supplier_id: supplier_id,
//     });
//     const time = moment.tz("Asia/Kolkata").format("YYYY-MM-DD HH:mm:ss");

//     if (status == "queried") {
//       //store in queried table also
//       //check if supplierId exist
//       //  const checkSupId=await knex("supplier_query_respond").where({supplierId:supplier_id})
//       const insertInQueryTab = await knex("supplier_query_respond").insert({
//         supplierId: supplier_id,
//         approverId: user_id,
//         query: comment,
//       });
//       if (insertInQueryTab.length <= 0) {
//         return res
//           .json({
//             error: true,
//             message: "Unalbe to insert in query table",
//           })
//           .end();
//       }
//     }
//     if (checkSupplierId.length <= 0) {
//       if (status === "queried") {
//         const statusStoreInTimeline = await knex("approval_timeline").insert({
//           supplier_id: supplier_id,
//           queried: user_id,
//           queriedRemarks: comment,
//           queriedTime: time,
//           isEditable: isEditable,
//         });
//       } else if (status === "approved") {
//         const statusStoreInTimeline = await knex("approval_timeline").insert({
//           supplier_id: supplier_id,
//           approved: user_id,
//           approvedRemarks: comment,
//           approvedTime: time,
//           isEditable: isEditable,
//         });
//       } else if (status === "rejected") {
//         const statusStoreInTimeline = await knex("approval_timeline").insert({
//           supplier_id: supplier_id,
//           rejected: user_id,
//           rejectedRemarks: comment,
//           rejectedTime: time,
//           isEditable: isEditable,
//         });
//       }
//     } else {
//       if (status === "queried") {
//         const getID = await knex("approval_timeline")
//           .where({ supplier_id: supplier_id })
//           .first();
//         const updationDataIs = await functions.takeSnapShot(
//           "approval_timeline",
//           getID.id
//         );
//         const statusStoreInTimeline = await knex("approval_timeline")
//           .where({ supplier_id: supplier_id })
//           .update({
//             queried: user_id,
//             queriedRemarks: comment,
//             queriedTime: time,
//             isEditable: isEditable,
//           });
//       } else if (status === "approved") {
//         const statusStoreInTimeline = await knex("approval_timeline")
//           .where({ supplier_id: supplier_id })
//           .update({
//             approved: user_id,
//             approvedRemarks: comment,
//             approvedTime: time,
//             isEditable: isEditable,
//           });
//       } else if (status === "rejected") {
//         const getIdIs5 = await knex("approval_timeline")
//           .where({ supplier_id: supplier_id })
//           .first();
//         const updationDataIs = await functions.takeSnapShot(
//           "approval_timeline",
//           getIdIs5.id
//         );
//         const statusStoreInTimeline = await knex("approval_timeline")
//           .where({ supplier_id: supplier_id })
//           .update({
//             rejected: user_id,
//             rejectedRemarks: comment,
//             rejectedTime: time,
//             isEditable: isEditable,
//           });
//       }
//       if (supplier_id) {
//         const modifiedByTable1 = await functions.SetModifiedBy(
//           req.headers["authorization"],
//           "approval_timeline",
//           "supplier_id",
//           supplier_id
//         );
//         console.log("isUpdated:-", modifiedByTable1);
//       }
//     }
//     //store history of status in a table : supplier_status

//     const storeStatus = await knex("supplier_status").insert({
//       supplier_id: supplier_id,
//       user_id: user_id,
//       status: status,
//       comment: comment,
//       approver_level: getApprovalLevel.level,
//       level1status: getApprovalLevel.level === 1 ? status : null,
//       level2status: getApprovalLevel.level === 2 ? status : null,
//     });

//     //get email from supplier_id

//     const emailOfSupplier = await knex("supplier_details")
//       .where({ id: supplier_id })
//       .first();

//     const emailBodyPromise = emailTemplateBody.statusChange(
//       getSupplier.supplier_name,
//       status
//     );

//     const emailBody = await emailBodyPromise;

//     // Send email
//     ses.sendEmail(
//       process.env.OTP_EMAIL,
//       getSupplier.emailID,
//       "Supplier Status Change",
//       emailBody
//     );

//     if (status === "approved") {
//       const getSupplierRecord = await knex("supplier_details")
//         .where({
//           id: supplierId,
//         })
//         .first();
//       const getNextApprovers = await knex("approverTest")
//         .where({
//           departmentId: getSupplierRecord.department_id,
//         })
//         .whereNot({
//           level: 1,
//         });
//       getNextApprovers.forEach(async (approver) => {
//         const getUser = await knex("users")
//           .where({
//             id: approver.userId,
//           })
//           .first();
//       });
//     }
//     //send email to supplier for his/her status...
//     let emailstatus = "";
//     switch (status) {
//       case "pending":
//         emailstatus = "Pending";
//         break;
//       case "approved":
//         emailstatus = "Approved";
//         break;
//       case "verified":
//         emailstatus = "Verified";
//         break;
//       case "rejected":
//         emailstatus = "Rejected";
//         break;
//       case "queried":
//         emailstatus = "Queried";
//         break;
//       default:
//         emailstatus = "Pending";
//         break;
//     }

//     let emaildetail =
//       "<table style='border:0.5px solid orange; border-radius:5px;'><tr><td style='width:20%'></td><td><br><br><br><b>Hello " +
//       emailOfSupplier.supplier_name +
//       ",</b>" +
//       "<br><br>Your Registration request for Supplier Onboarding Portal has been " +
//       status +
//       ".";

//     if (status == "approved") {
//       emaildetail +=
//         "<br>Approver's Name: " +
//         getUserName.firstname +
//         " " +
//         getUserName.lastname +
//         "<br>Approver's Remarks: " +
//         comment;
//     }

//     if (status == "rejected") {
//       emaildetail +=
//         "<br>Rejected by " +
//         getUserName.firstname +
//         " " +
//         getUserName.lastname +
//         "<br>Reason: " +
//         comment;
//     }

//     if (status == "queried") {
//       emaildetail +=
//         "<br>Queried by " +
//         getUserName.firstname +
//         " " +
//         getUserName.lastname +
//         "<br>Query: " +
//         comment;
//     }

//     if (status == "verified") {
//       emaildetail +=
//         "<br>Verifier's Name: " +
//         getUserName.firstname +
//         " " +
//         getUserName.lastname +
//         "<br>Verifier's Remarks: " +
//         comment +
//         "";
//     }

//     emaildetail +=
//       `<br> Please visit : <a href='${constants.admindetails.homePageUrl}' target='_blank'>${constants.admindetails.homePageUrl}</a> to give your respond` +
//       `<br><br>Regards, <br>
//               <B>${constants.admindetails.companyFullName}</B> <br><br><br>
//               <center>${constants.admindetails.address1},<br>${constants.admindetails.address2}, ${constants.admindetails.state},${constants.admindetails.country}<br><br><img style="width:80px;" src="${constants.admindetails.companyLogo}" /><br>Powered by ${constants.admindetails.companyShortName}<br>Note: Do not reply this email. This is auto-generated email.</center></td><td style='width:20%;'></td></tr></table>`;

//     const sendEmail = await ses.sendEmail(
//       constants.sesCredentials.fromEmails.emailOtp,
//       emailOfSupplier.emailID,
//       "Supplier Onboarding Registration - " + emailstatus,
//       emaildetail
//     );

//     const getEmailStatus = await ses.emailResponse(
//       sendEmail.ResponseMetadata.MessageId
//     );

//     const getSupplierDetails = await knex("supplier_details")
//       .where("id", supplier_id)
//       .first();
//     const timestamp = knex.fn.now();
//     const byWhom = getUserName.firstname + " " + getUserName.lastname;
//     const logSupplier = supplierLogs.logFunction(
//       supplier_id,
//       getSupplierDetails.gstNo,
//       getSupplierDetails.panNo,
//       getSupplierDetails.supplier_name,
//       getSupplierDetails.emailID,
//       status,
//       timestamp,
//       byWhom,
//       comment
//     );

//     const getSupplierId = await knex("users")
//       .select("id")
//       .where("email", getSupplierDetails.emailID);

//     switch (status) {
//       case "approved":
//         await notifications.createNotification(
//           [getSupplierId[0].id],
//           "Approved!",
//           "Congratulations! Your registration request for the SupplierX Onboarding Portal has been approved. Welcome aboard! 🎉",
//           "0"
//         );

//         await notifications.createNotification(
//           [user_id],
//           "Supplier Approved!",
//           `Supplier ${getSupplierDetails.supplier_name} has been approved.`,
//           "0"
//         );

//         break;
//       case "rejected":
//         await notifications.createNotification(
//           [getSupplierId[0].id],
//           "Rejected!",
//           "We regret to inform you that your registration request for the SupplierX Onboarding Portal has been rejected.",
//           "0"
//         );

//         await notifications.createNotification(
//           [user_id],
//           "Supplier Rejected!",
//           `Supplier ${getSupplierDetails.supplier_name} has been rejected.`,
//           "0"
//         );

//         break;
//       case "queried":
//         await notifications.createNotification(
//           [getSupplierId[0].id],
//           "Queried!",
//           "Your registration request for the SupplierX Onboarding Portal has been queried. Please review and provide the required information.",
//           "0"
//         );

//         await notifications.createNotification(
//           [user_id],
//           "Supplier Rejected!",
//           `Supplier ${getSupplierDetails.supplier_name} has been queried.`,
//           "0"
//         );
//         break;
//       default:
//         break;
//     }

//     return res.json({
//       error: false,
//       message: "Supplier has been " + status,
//       UserName: getUserName.username,
//       Status: status,
//       comment: comment,
//       Email: sendEmail,
//       EmailStatus: getEmailStatus,
//       // ApproverLevelName:
//     });
//   // } catch (error) {
//   //   return res.json({
//   //     error: true,
//   //     message: "Something went wrong",
//   //   });
//   // }
// };

const changestatus = async (req, res) => {
  try {
    const token = req.headers["authorization"];
    if (!token) {
      return res.status(400).json({
        error: true,
        message: "Token is required.",
      });
    }
    const modifiedBy = await functions.getRollNameByHeader(
      req.headers["authorization"]
    );

    const { jwtConfig } = constants;
    const payload = jwt.decode(token.split(" ")[1], jwtConfig.secret);
    const statusChanger = payload.permissions[0];
    const statusChangerId = payload.id;
    const email = payload.email;

    const { error, value } = validation.changeStatus(req.body);
    if (error) {
      return res.status(400).json({
        error: true,
        message: error.details[0].message,
      });
    }

    const {
      supplier_id,
      status,
      comment,
      user_id,
      user_role,
      approver_level,
      approver_hr_level,
      subscriber_id,
      isEditable,
    } = value;

    //get email from supplier_id

    const emailOfSupplier = await knex("supplier_details")
      .where({ id: supplier_id })
      .first();

    if (!emailOfSupplier.emailID) {
      return res.status(404).json({
        error: true,
        message: "Supplier email not found",
      });
    }

    const getUserName = await knex("users").where({ id: user_id }).first();

    // const getApproverLevelName = await knex("approval_hierarchy").where({approver_level_name:approver_level});
    //

    if (approver_level === 0) {
      return res.status(500).json({
        error: true,
        message: "Approver level cannot be zero",
      });
    }

    const checkUserInUsers = await knex("users").where({ id: user_id }).first();
    if (!checkUserInUsers) {
      return res.status(404).json({
        error: true,
        message: "User does not exist",
      });
    }

    const getRoleApproverId = await knex("role")
      .where("slug", "Approver")
      .select("id")
      .first();

    if (getRoleApproverId) {
      if (checkUserInUsers.role_id !== getRoleApproverId.id) {
        return res.status(404).json({
          error: true,
          message: "Only approver can change the status",
        });
      }
    }

    //check user role in approval hierarchy

    // const checkRoleIdExist = await knex("approval_hierarchy")
    //   .where({ role_id: user_role })
    //   .first();
    // if (!checkRoleIdExist) {
    //   return res.json({
    //     error: true,
    //     message: "This role is not approver",
    //   });
    // }

    //check approval level in approval hierarchy
    // const checkApprovalHierarchyLevel = await knex("approval_hierarchy")
    //   .where({ approval_hierarchy_level: approver_hr_level })
    //   .first();
    // if (!checkApprovalHierarchyLevel) {
    //   return res.json({
    //     error: true,
    //     message: "Approver Hierarchy Level does not exist",
    //   });
    // }

    //check approval_name in approval hierarchy

    // const checkApprovalLevelNameExist = await knex("approval_hierarchy")
    //   .where({ approver_level: approver_level })
    //   .first();
    // if (!checkApprovalLevelNameExist) {
    //   return res.json({
    //     error: true,
    //     message: "approver_level does not exist",
    //   });
    // }

    const checkSupplierIdExist = await knex("supplier_details")
      .where({ id: supplier_id })
      .first();
    if (!checkSupplierIdExist) {
      return res.status(404).json({
        error: true,
        message: "Supplier does not exist",
      });
    }

    // New logic to check if the current status is "approved" or "rejected"
    const currentSupplierStatus = checkSupplierIdExist.status;
    if (["approved", "rejected"].includes(currentSupplierStatus)) {
      return res.status(409).json({
        error: true,
        message: `Supplier already ${status}`,
      });
    }

    if (
      currentSupplierStatus === "pending" &&
      !["approved", "rejected", "queried"].includes(status)
    ) {
      return res.status(409).json({
        error: true,
        message:
          "Pending status can only be changed to approved, rejected, or queried",
      });
    }

    // Check user role and allow changeStatus only for role 3

    //check if user exist in users

    // Check approver role and hierarchy level
    if (approver_level > approver_hr_level) {
      return res.status(400).json({
        error: true,
        message: "Approver level cannot be greater than hierarchy level",
      });
    }

    const timestampis = knex.fn.now();

    // if (approver_level == "1") {
    //   const changeStatus = await knex("supplier_details")
    //     .update({
    //       status: status,
    //       level1status: status,
    //       status_update_date: timestampis,
    //       comment: comment,
    //     })
    //     .where({
    //       id: supplier_id,
    //     });

    //   if (changeStatus === 0) {
    //     return res.json({
    //       error: true,
    //       message: "Supplier does not exist",
    //     });
    //   }
    // }
    // if (approver_level == "2") {
    //   const changeStatus = await knex("supplier_details")
    //     .update({
    //       status: status,
    //       level2status: status,
    //       status_update_date: timestampis,
    //       comment: comment,
    //     })
    //     .where({
    //       id: supplier_id,
    //     });

    //   if (changeStatus === 0) {
    //     return res.json({
    //       error: true,
    //       message: "Supplier does not exist",
    //     });
    //   }
    // }

    const getApprovalLevel = await knex("users")
      .where("id", user_id)
      .select("level")
      .first();

    console.log("level", getApprovalLevel);

    if (getApprovalLevel.level == 1) {
      const allowedStatusChanges = [
        "queried",
        "rejected",
        "pending",
        "verified",
        "approved",
      ];
      if (!allowedStatusChanges.includes(status)) {
        return res.status(409).json({
          error: true,
          message:
            "Level 1 users can only change status to queried, rejected, pending, or verified.",
        });
      }

      const updationDataIs = await functions.takeSnapShot(
        "supplier_details",
        supplier_id
      );

      const changeStatusLevel1 = await knex("supplier_details")
        .update({
          level1status: status,
          status: status,
          status_update_date: timestampis,
          comment: comment,
          modifiedBy: modifiedBy,
        })
        .where({
          id: supplier_id,
        });

      console.log("here:-", changeStatusLevel1, "suppId:-", supplier_id);

      if (changeStatusLevel1 === 0) {
        return res.status(404).json({
          error: true,
          message: "Supplier does not exist",
        });
      }
    } else if (getApprovalLevel.level == 2) {
      const allowedStatusChanges = ["approved", "rejected", "queried"];
      if (!allowedStatusChanges.includes(status)) {
        return res.status(409).json({
          error: true,
          message:
            "Level 2 users can only change status to approved, rejected, queried, or pending.",
        });
      }

      const updationDataIs = await functions.takeSnapShot(
        "supplier_details",
        supplier_id
      );
      const changeStatusLevel2 = await knex("supplier_details")
        .update({
          level2status: status,
          status: status,
          status_update_date: timestampis,
          comment: comment,
          modifiedBy: modifiedBy,
        })
        .where({
          id: supplier_id,
        });

      if (changeStatusLevel2 === 0) {
        return res.status(404).json({
          error: true,
          message: "Supplier does not exist",
        });
      }
    }

    //store status in approvalTimeline
    // Check if supplierId exists
    const checkSupplierId = await knex("approval_timeline").where({
      supplier_id: supplier_id,
    });
    const time = moment.tz("Asia/Kolkata").format("YYYY-MM-DD HH:mm:ss");

    if (status == "queried") {
      //store in queried table also
      //check if supplierId exist
      //  const checkSupId=await knex("supplier_query_respond").where({supplierId:supplier_id})
      const insertInQueryTab = await knex("supplier_query_respond").insert({
        supplierId: supplier_id,
        approverId: user_id,
        query: comment,
      });
      if (insertInQueryTab.length <= 0) {
        return res
          .status(500)
          .json({
            error: true,
            message: "Unalbe to insert in query table",
          })
          .end();
      }
    }
    if (checkSupplierId.length <= 0) {
      if (status === "queried") {
        const statusStoreInTimeline = await knex("approval_timeline").insert({
          supplier_id: supplier_id,
          queried: user_id,
          queriedRemarks: comment,
          queriedTime: time,
          isEditable: isEditable,
        });
      } else if (status === "approved") {
        const statusStoreInTimeline = await knex("approval_timeline").insert({
          supplier_id: supplier_id,
          approved: user_id,
          approvedRemarks: comment,
          approvedTime: time,
          isEditable: isEditable,
        });
      } else if (status === "rejected") {
        const statusStoreInTimeline = await knex("approval_timeline").insert({
          supplier_id: supplier_id,
          rejected: user_id,
          rejectedRemarks: comment,
          rejectedTime: time,
          isEditable: isEditable,
        });
      }
    } else {
      if (status === "queried") {
        const getID = await knex("approval_timeline")
          .where({ supplier_id: supplier_id })
          .first();
        const updationDataIs = await functions.takeSnapShot(
          "approval_timeline",
          getID.id
        );
        const statusStoreInTimeline = await knex("approval_timeline")
          .where({ supplier_id: supplier_id })
          .update({
            queried: user_id,
            queriedRemarks: comment,
            queriedTime: time,
            isEditable: isEditable,
          });
      } else if (status === "approved") {
        const statusStoreInTimeline = await knex("approval_timeline")
          .where({ supplier_id: supplier_id })
          .update({
            approved: user_id,
            approvedRemarks: comment,
            approvedTime: time,
            isEditable: isEditable,
          });
      } else if (status === "rejected") {
        const getIdIs5 = await knex("approval_timeline")
          .where({ supplier_id: supplier_id })
          .first();
        const updationDataIs = await functions.takeSnapShot(
          "approval_timeline",
          getIdIs5.id
        );
        const statusStoreInTimeline = await knex("approval_timeline")
          .where({ supplier_id: supplier_id })
          .update({
            rejected: user_id,
            rejectedRemarks: comment,
            rejectedTime: time,
            isEditable: isEditable,
            modifiedBy: modifiedBy,
          });
      }
    }
    //store history of status in a table : supplier_status

    const storeStatus = await knex("supplier_status").insert({
      supplier_id: supplier_id,
      user_id: user_id,
      status: status,
      comment: comment,
      approver_level: getApprovalLevel.level,
      level1status: getApprovalLevel.level === 1 ? status : null,
      level2status: getApprovalLevel.level === 2 ? status : null,
    });

    //send email to supplier for his/her status...
    let emailstatus = "";
    switch (status) {
      case "pending":
        emailstatus = "Pending";
        break;
      case "approved":
        emailstatus = "Approved";
        break;
      case "verified":
        emailstatus = "Verified";
        break;
      case "rejected":
        emailstatus = "Rejected";
        break;
      case "queried":
        emailstatus = "Queried";
        break;
      default:
        emailstatus = "Pending";
        break;
    }

    let emaildetail =
      "<table style='border:0.5px solid orange; border-radius:5px;'><tr><td style='width:20%'></td><td><br><br><br><b>Hello " +
      emailOfSupplier.supplier_name +
      ",</b>" +
      "<br><br>Your Registration request for Supplier Onboarding Portal has been " +
      status +
      ".";

    if (status == "approved") {
      emaildetail +=
        "<br>Approver's Name: " +
        getUserName.firstname +
        " " +
        getUserName.lastname +
        "<br>Approver's Remarks: " +
        comment;
    }

    if (status == "rejected") {
      emaildetail +=
        "<br>Rejected by " +
        getUserName.firstname +
        " " +
        getUserName.lastname +
        "<br>Reason: " +
        comment;
    }

    if (status == "queried") {
      emaildetail +=
        "<br>Queried by " +
        getUserName.firstname +
        " " +
        getUserName.lastname +
        "<br>Query: " +
        comment;
    }

    if (status == "verified") {
      emaildetail +=
        "<br>Verifier's Name: " +
        getUserName.firstname +
        " " +
        getUserName.lastname +
        "<br>Verifier's Remarks: " +
        comment +
        "";
    }

    emaildetail +=
      `<br> Please visit : <a href='${constants.admindetails.homePageUrl}' target='_blank'>${constants.admindetails.homePageUrl}</a> to give your respond` +
      `<br><br>Regards, <br>
              <B>${constants.admindetails.companyFullName}</B> <br><br><br>
              <center>${constants.admindetails.address1},<br>${constants.admindetails.address2}, ${constants.admindetails.state},${constants.admindetails.country}<br><br><img style="width:80px;" src="${constants.admindetails.companyLogo}" /><br>Powered by ${constants.admindetails.companyShortName}<br>Note: Do not reply this email. This is auto-generated email.</center></td><td style='width:20%;'></td></tr></table>`;

    const sendEmail = await ses.sendEmail(
      constants.sesCredentials.fromEmails.emailOtp,
      emailOfSupplier.emailID,
      "Supplier Onboarding Registration - " + emailstatus,
      emaildetail
    );

    const getEmailStatus = await ses.emailResponse(
      sendEmail.ResponseMetadata.MessageId
    );

    const getSupplierDetails = await knex("supplier_details")
      .where("id", supplier_id)
      .first();
    const timestamp = knex.fn.now();
    const byWhom = getUserName.firstname + " " + getUserName.lastname;
    const logSupplier = supplierLogs.logFunction(
      supplier_id,
      getSupplierDetails.gstNo,
      getSupplierDetails.panNo,
      getSupplierDetails.supplier_name,
      getSupplierDetails.emailID,
      status,
      timestamp,
      byWhom,
      comment
    );

    const getSupplierId = await knex("users")
      .select("id")
      .where("email", getSupplierDetails.emailID);

    switch (status) {
      case "approved":
        await notifications.createNotification(
          [getSupplierId[0].id],
          "Approved!",
          "Congratulations! Your registration request for the SupplierX Onboarding Portal has been approved. Welcome aboard! 🎉",
          "0"
        );

        await notifications.createNotification(
          [user_id],
          "Supplier Approved!",
          `Supplier ${getSupplierDetails.supplier_name} has been approved.`,
          "0"
        );

        break;
      case "rejected":
        await notifications.createNotification(
          [getSupplierId[0].id],
          "Rejected!",
          "We regret to inform you that your registration request for the SupplierX Onboarding Portal has been rejected.",
          "0"
        );

        await notifications.createNotification(
          [user_id],
          "Supplier Rejected!",
          `Supplier ${getSupplierDetails.supplier_name} has been rejected.`,
          "0"
        );

        break;
      case "queried":
        await notifications.createNotification(
          [getSupplierId[0].id],
          "Queried!",
          "Your registration request for the SupplierX Onboarding Portal has been queried. Please review and provide the required information.",
          "0"
        );

        await notifications.createNotification(
          [user_id],
          "Supplier Rejected!",
          `Supplier ${getSupplierDetails.supplier_name} has been queried.`,
          "0"
        );
        break;
      default:
        break;
    }

    return res.status(200).json({
      error: false,
      message: "Supplier has been " + status,
      UserName: getUserName.username,
      Status: status,
      comment: comment,
      Email: sendEmail,
      EmailStatus: getEmailStatus,
      // ApproverLevelName:
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: "Can't change status",
      data: JSON.stringify(error),
    });
  }
};

const queriedSupplier = async (req, res) => {
  try {
    const { error, value } = validation.queriedSupplier(req.body);
    if (error) {
      return res.status(400).json({
        error: true,
        message: error.details[0].message,
      });
    }

    const { username, department, id, comment } = value;

    const check_username = await knex("users").where("username", username);
    if (check_username.length == 0) {
      return res.status(404).json({
        error: true,
        message: "Username does not exist",
      });
    }

    const check_department = await knex("departments").where(
      "name",
      department
    );
    if (check_department.length == 0) {
      return res.status(404).json({
        error: true,
        message: "Department does not exist",
      });
    }

    const check_supplier_id = await knex("supplier_details").where("id", id);
    if (check_supplier_id.length == 0) {
      return res.status(404).json({
        error: true,
        message: "Supplier does not exist",
      });
    }

    const status_update_date = new Date();

    const updationDataIs = await functions.takeSnapShot("supplier_details", id);

    const result = await knex("supplier_details").where("id", id).update({
      status: "queried",
      status_update_date: status_update_date,
      comment: comment,
    });

    if (!result) {
      return res.status(500).json({
        error: true,
        message: "Query could not sent",
      });
    }

    const query_supplier = await knex("supplier_details").where("id", id);
    if (id) {
      const modifiedByTable1 = await functions.SetModifiedBy(
        req.headers["authorization"],
        "supplier_details",
        "id",
        id
      );
      // console.log("isUpdated:-", modifiedByTable1);
    }
    const queried_email = queriedemail.getQueriedEmailString(
      query_supplier[0].supplier_name,
      query_supplier[0].status,
      username,
      query_supplier[0].comment,
      "www.google.com",
      "Aeonx.Digital"
    );

    const send_email = await ses.sendEmail(
      constants.sesCredentials.fromEmails.emailOtp,
      query_supplier[0].emailID,
      "Queried",
      queried_email
    );

    return res.status(200).json({
      error: false,
      message: "Query sent to supplier Successfully",
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: "Can't query supplier",
      data: JSON.stringify(error),
    });
  }
};

const approvedSupplier = async (req, res) => {
  try {
    const { error, value } = validation.approvedSupplier(req.body);
    if (error) {
      return res.status(400).json({
        error: true,
        message: error.details[0].message,
      });
    }

    const { username, department, id, comment } = value;

    const check_username = await knex("users").where("username", username);
    if (check_username.length == 0) {
      return res.status(404).json({
        error: true,
        message: "Username does not exist",
      });
    }

    const check_department = await knex("departments").where(
      "name",
      department
    );
    if (check_department.length == 0) {
      return res.status(404).json({
        error: true,
        message: "Department does not exist",
      });
    }

    const check_supplier_id = await knex("supplier_details").where("id", id);

    if (check_supplier_id.length == 0) {
      return res.status(404).json({
        error: true,
        message: "Supplier does not exist",
      });
    }

    const check_approved = await knex("supplier_details")
      .where("id", id)
      .where("status", "approved");

    if (check_approved.length > 0) {
      return res.status(409).json({
        error: true,
        message: "Supplier is already approved",
      });
    }

    const check_status = await knex("supplier_details")
      .where("id", id)
      .where("status", "verified");

    if (check_status.length == 0) {
      return res.status(409).json({
        error: true,
        message: "Supplier is yet not verified",
      });
    }

    const status_update_date = new Date();

    const updationDataIs = await functions.takeSnapShot("supplier_details", id);

    const result = await knex("supplier_details").where("id", id).update({
      status: "approved",
      status_update_date: status_update_date,
    });

    if (result.length == 0) {
      return res.status(500).json({
        error: true,
        message: "Could not approved",
      });
    }
    if (id) {
      const modifiedByTable1 = await functions.SetModifiedBy(
        req.headers["authorization"],
        "supplier_details",
        "id",
        id
      );
      // console.log("isUpdated:-", modifiedByTable1);
    }
    //send email

    const get_email = await knex("supplier_details").where("id", id);

    const email_html = approveremail.getApproverEmailString(
      get_email[0].supplier_name,
      get_email[0].status,
      username,
      comment,
      "http://www.google.com",
      "AeonX.Digital"
    );

    const result_of_email = await ses.sendEmail(
      constants.sesCredentials.fromEmails.emailOtp,
      get_email[0].emailID,
      "Approved",
      email_html
    );

    return res.status(200).json({
      error: false,
      message: "Supplier successfully approved",
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: "Can't approve supplier",
      data: JSON.stringify(error),
    });
  }
};

const rejectedSupplier = async (req, res) => {
  try {
    const { error, value } = validation.rejectedSupplier(req.body);
    if (error) {
      return res.status(400).json({
        error: true,
        message: error.details[0].message,
      });
    }

    const { username, department, id } = value;

    const check_username = await knex("users").where("username", username);
    if (check_username.length == 0) {
      return res.status(404).json({
        error: true,
        message: "Username does not exist",
      });
    }

    const check_department = await knex("departments").where(
      "name",
      department
    );
    if (check_department.length == 0) {
      return res.status(404).json({
        error: true,
        message: "Department does not exist",
      });
    }

    const check_supplier_id = await knex("supplier_details").where("id", id);
    if (check_supplier_id.length == 0) {
      return res.status(404).json({
        error: true,
        message: "Supplier does not exist",
      });
    }

    const status_update_date = new Date();

    const check_supplier_rejected = await knex("supplier_details")
      .where("id", id)
      .where("status", "rejected");

    if (check_supplier_rejected.length > 0) {
      return res.status(409).json({
        error: true,
        message: "Supplier is already rejected",
      });
    }

    const updationDataIs = await functions.takeSnapShot("supplier_details", id);

    const result = await knex("supplier_details").where("id", id).update({
      status: "rejected",
      status_update_date: status_update_date,
    });

    if (!result) {
      return res.status(500).json({
        error: true,
        message: "Supplier could not be rejected",
      });
    }
    if (id) {
      const modifiedByTable1 = await functions.SetModifiedBy(
        req.headers["authorization"],
        "supplier_details",
        "id",
        id
      );
      // console.log("isUpdated:-", modifiedByTable1);
    }
    return res.status(200).json({
      error: true,
      message: "Supplier rejected successfully",
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: "Can't reject supplier",
      data: JSON.stringify(error),
    });
  }
};

const verifySupplier = async (req, res) => {
  try {
    const { error, value } = validation.verifySupplier(req.body);
    if (error) {
      return res.status(400).json({
        error: true,
        message: error.details[0].message,
      });
    }

    const { username, department, id } = value;

    const check_username = await knex("users").where("username", username);
    if (check_username.length == 0) {
      return res.status(404).json({
        error: true,
        message: "Username does not exist",
      });
    }

    const check_department = await knex("departments").where(
      "name",
      department
    );
    if (check_department.length == 0) {
      return res.status(404).json({
        error: true,
        message: "Department does not exist",
      });
    }

    const check_supplier_id = await knex("supplier_details").where("id", id);
    if (check_supplier_id.length == 0) {
      return res.status(404).json({
        error: true,
        message: "Supplier does not exist",
      });
    }

    const check_approve = await knex("supplier_details")
      .where("id", id)
      .where("status", "approved");

    if (check_approve > 0) {
      return res.status(409).json({
        error: true,
        message: "Supplier already approved",
      });
    }

    const check_supplier_verified = await knex("supplier_details")
      .where("id", id)
      .where("status", "verified");

    if (check_supplier_verified.length > 0) {
      return res.status(409).json({
        error: true,
        message: "Supplier already verified",
      });
    }

    const status_update_date = new Date();

    const updationDataIs = await functions.takeSnapShot("supplier_details", id);

    const result = await knex("supplier_details").where("id", id).update({
      status: "verified",
      status_update_date: status_update_date,
    });

    if (!result) {
      return res.status(500).json({
        error: true,
        message: "Supplier could not be verified",
      });
    }
    if (id) {
      const modifiedByTable1 = await functions.SetModifiedBy(
        req.headers["authorization"],
        "supplier_details",
        "id",
        id
      );
      // console.log("isUpdated:-", modifiedByTable1);
    }
    return res.status(200).json({
      error: false,
      message: "Supplier verified successfully",
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: "Can't verify supplier",
      data: JSON.stringify(error),
    });
  }
};

const deactiveSupplier = async (req, res) => {
  const { error, value } = validation.deactiveSupplier(req.params);
  if (error) {
    return res.status(400).json({
      error: true,
      message: error.details[0].message,
    });
  }

  const { id } = value;

  const check_supplier_id = await knex("supplier_details")
    .where("id", id)
    .whereNotNull("sap_code")
    .first();
  if (check_supplier_id == undefined) {
    return res
      .status(404)
      .json({
        error: true,
        message: "Supplier does not exist",
      })
      .end();
  }

  const updationDataIs = await functions.takeSnapShot("supplier_details", id);

  const updateSupplier = await knex("supplier_details")
    .where("id", id)
    .update({ status: "deactive" });

  if (updateSupplier) {
    if (id) {
      const modifiedByTable1 = await functions.SetModifiedBy(
        req.headers["authorization"],
        "supplier_details",
        "id",
        id
      );
      // console.log("isUpdated:-", modifiedByTable1);
    }
    return res
      .status(200)
      .json({
        error: false,
        message: "Supplier deactivated successfully",
      })
      .end();
  }
};

const changeStatusWithEmail = async (req, res) => {
  try {
    const { error, value } = validation.changeStatusWithEmail(req.body);

    if (error) {
      return res.status(400).json({
        error: true,
        message: error.details[0].message,
      });
    }

    const { current_user_id, supplier_id, module_id, comment, status } = value;

    //chcek if user exist
    const checkUser = await knex("users").where("id", current_user_id);
    if (checkUser.length == 0) {
      return res.status(404).json({
        error: true,
        message: "Username does not exist",
      });
    }

    //chcek module exist
    const checkModule = await knex("modules").where("id", module_id);
    if (checkUser.length == 0) {
      return res.status(404).json({
        error: true,
        message: "Module does not exist",
      });
    }

    //check if supplier exist
    const checkSupplier = await knex("supplier_details").where(
      "id",
      supplier_id
    );
    if (checkUser.length == 0) {
      return res.status(404).json({
        error: true,
        message: "Supplier does not exist",
      });
    }
    //check permissions
    const getUserDetail = await knex("users")
      .where({
        id: current_user_id,
      })
      .first();

    let roleIs = getUserDetail.role_id;

    //check role permission
    const checkUserRolePermission = await knex("users_roles_permissions")
      .where({
        role_id: roleIs,
        module_id: module_id,
      })
      .select("updateP");

    if (!checkUserRolePermission) {
      return res.status(403).json({
        error: true,
        message: "You don't have permission to update status",
      });
    }

    //update supplier status send Email

    const updateSupplier = await knex("supplier_details")
      .where({
        id: supplier_id,
      })
      .select("status")
      .first();

    if (updateSupplier.status === "approved") {
      return res.status(409).json({
        error: true,
        message: "Supplier is already approved",
      });
    }
    if (updateSupplier.status === "rejected") {
      return res.status(409).json({
        error: true,
        message: "Supplier is already rejected",
      });
    }

    if (updateSupplier.status === "pending") {
      const supplierId = await knex("supplier_details").where({
        id: supplier_id,
      });

      let getEmail = supplierId[0].emailID;

      const email_html = approveremail.getApproverEmailString(
        supplierId[0].supplier_name,
        supplierId[0].status,
        current_user_id,
        comment,
        "http://www.google.com",
        "AeonX.Digital"
      );

      const result_of_email = await ses.sendEmail(
        constants.sesCredentials.fromEmails.emailOtp,
        getEmail,
        " This is Approved",
        email_html
      );

      return res.status(200).json({
        error: false,
        message: "Supplier's status updated successfully",
      });
    }
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: "Can't change status",
    });
  }
};

const deleteSupplier = async (req, res) => {
  try {
    const tableName = "supplier_details";
    const { error, value } = validation.deleteSupplier(req.params);

    if (error) {
      return res.status(400).json({
        error: true,
        message: error.details[0].message,
      });
    }

    const { id } = value;

    const getEmailOfSupplier = await knex("supplier_details")
      .where("id", id)
      .select("emailID")
      .first();

    if (getEmailOfSupplier == undefined) {
      return res.status(404).json({
        error: true,
        message: "Supplier does not exist",
      });
    }

    //////////////////////delete s3 bucket files//////////////////////

    const checkSupplierTaxDetails = await knex("tax_details")
      .where("company_id", id)
      .first();

    if (checkSupplierTaxDetails == undefined) {
      return res.status(404).json({
        error: true,
        message: "Supplier does not exist",
      });
    }

    const msmeImageFile = checkSupplierTaxDetails.msmeImage;
    const gstImageFile = checkSupplierTaxDetails.gstImage;
    const cancelledChequeImageFile =
      checkSupplierTaxDetails.cancelledChequeImage;
    const panCardImageFile = checkSupplierTaxDetails.panCardImage;
    const pfAttachmentFile = checkSupplierTaxDetails.pfAttachment;
    const otherAttachmentsFile = checkSupplierTaxDetails.otherAttachments;

    if (msmeImageFile != "") {
      functions.deleteObjectFromBucket("content-server/" + msmeImageFile);
    }

    if (gstImageFile != "") {
      functions.deleteObjectFromBucket("content-server/" + gstImageFile);
    }

    if (cancelledChequeImageFile != "") {
      functions.deleteObjectFromBucket(
        "content-server/" + cancelledChequeImageFile
      );
    }

    if (panCardImageFile != "") {
      functions.deleteObjectFromBucket("content-server/" + panCardImageFile);
    }

    if (pfAttachmentFile != "") {
      functions.deleteObjectFromBucket("content-server/" + pfAttachmentFile);
    }

    if (otherAttachmentsFile != "") {
      functions.deleteObjectFromBucket(
        "content-server/" + otherAttachmentsFile
      );
    }

    /////////////////////delete s3 bucket files over//////////////////

    const check_supplier = await knex("supplier_details")
      .where("id", id)
      .whereIn("status", ["pending", "rejected"])
      .first();

    if (!check_supplier) {
      return res.status(500).json({
        error: true,
        message: "Supplier could not be deleted",
      });
    }

    if (check_supplier) {
      await knex("supplier_details")
        .where("id", id)
        .whereIn("status", ["pending", "rejected"])
        .delete();
    }

    //delete supplier from additional details

    const delete_addditional_details = await functions.deleteData(
      "supplier_additional_fields",
      id,
      "123"
    );

    //delete supplier email from users table
    if (
      getEmailOfSupplier.emailID != "admin@gmail.com" ||
      getEmailOfSupplier.emailID != "sap@user.com"
    ) {
      const deleteUser = await knex("users")
        .where("email", getEmailOfSupplier.emailID)
        .delete();
    }

    return res.status(200).json({
      error: false,
      message: "Supplier deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: "Can't delete supplier",
      data: JSON.stringify(error),
    });
  }
};

const supplierListForWorkflow = async (req, res) => {
  try {
    const { error, value } = validation.supplierListForWorkflow(req.body);
    if (error) {
      return res.status(400).json({
        error: true,
        message: error.details[0].message,
      });
    }

    const { user_id, supplier_id } = value;

    const getUserRecord = await knex("users")
      .where({ id: user_id })
      .select("role", "level", "username");

    const getRollName = await knex("users_roles").where(
      "id",
      getUserRecord[0].role
    );

    let get_hk_no;

    switch (getUserRecord[0].level) {
      case 1:
        get_hk_no = await knex("approvers").where(
          "level_1_user_id",
          "[" + user_id + "]"
        );
        break;
      case 2:
        get_hk_no = await knex("approvers").where(
          "level_2_user_id",
          "[" + user_id + "]"
        );
        break;
      case 3:
        get_hk_no = await knex("approvers").where(
          "level_3_user_id",
          "[" + user_id + "]"
        );
        break;
      case 4:
        get_hk_no = await knex("approvers").where(
          "level_4_user_id",
          "[" + user_id + "]"
        );
        break;
    }

    const getJsonData = await knex("approval_hierarchy")
      .where("id", get_hk_no[0].approval_hierarchy_id)
      .select("approval_level_name");

    const getLevelName = JSON.parse(getJsonData[0].approval_level_name);

    let levelName;
    for (const iterator of getLevelName) {
      if (iterator.level == getUserRecord[0].level) {
        levelName = iterator.name;
      }
    }

    //getting supplier details...

    const getSupplierDetails = await knex("supplier_details")
      .where("id", supplier_id)
      .select("status", "comment", "supplier_name");

    if (getSupplierDetails[0].comment == null) {
      getSupplierDetails[0].comment = "";
    }

    return res.status(200).json({
      error: false,
      message: "Supplier list retrived successfully",
      role: getUserRecord[0].role,
      level: getUserRecord[0].level,
      username: getUserRecord[0].username,
      level_name: levelName,
      role_name: getRollName[0].role_name,
      status: getSupplierDetails[0].status,
      comment: getSupplierDetails[0].comment,
      supplier_name: getSupplierDetails[0].supplier_name,
    });
  } catch (error) {
    return res.status(500).json({
      error: false,
      message: "Can't fetch Workflow data",
      data: JSON.stringify(error),
    });
  }
};

// const supplierChangeStatusList = async (req, res) => {
//   try {
//     const schema = Joi.object({
//       supplier_id: Joi.string().required(),
//     });

//     const { error, value } = schema.validate(req.body);
//     if (error) {
//       return res.json({
//         error: true,
//         message: error.details[0].message,
//       });
//     }
//     const { supplier_id } = value;

//     const getStatusList = await knex("supplier_status").where(
//       "supplier_id",
//       supplier_id
//     );

//     if (getStatusList.length <= 0) {
//       return res.json({
//         error: true,
//         message: "Supplier Status does not exist",
//       });
//     }

//     const latestStatusByLevel = new Map();
//     console.log("supplierlist", getStatusList);

//     for (const iterator of getStatusList) {
//       const userName = await knex("users").where("id", iterator.user_id);
//       iterator.user_name = userName[0].username;

//       const userId = "[" + iterator.user_id + "]";
//       const level = iterator.approver_level;

//       let get_hk_no;

//       console.log("this is level", level);

//       switch (level) {
//         case 1:
//           get_hk_no = await knex("approvers")
//             .where({ level_1_user_id: userId })
//             .select("approval_hierarchy_id")
//             .first();
//           break;
//         case 2:
//           get_hk_no = await knex("approvers")
//             .where({ level_2_user_id: userId })
//             .select("approval_hierarchy_id")
//             .first();
//           break;
//         case 3:
//           get_hk_no = await knex("approvers")
//             .where({ level_3_user_id: userId })
//             .select("approval_hierarchy_id")
//             .first();
//           break;
//         case 4:
//           get_hk_no = await knex("approvers")
//             .where({ level_4_user_id: userId })
//             .select("approval_hierarchy_id")
//             .first();
//           break;
//       }

//       const getApprovalLevelNameJson = await knex("approval_hierarchy")
//         .where("id", get_hk_no.approval_hierarchy_id)
//         .select("approval_level_name");

//       const parsedJson = JSON.parse(
//         getApprovalLevelNameJson[0].approval_level_name
//       );

//       let approverLevelName;
//       for (const iterator2 of parsedJson) {
//         if (iterator2.level == level) {
//           approverLevelName = iterator2.name;
//         }
//       }
//       iterator.approver_level_name = approverLevelName;

//       if (
//         !latestStatusByLevel.has(level) ||
//         iterator.updated_at > latestStatusByLevel.get(level).updated_at
//       ) {
//         latestStatusByLevel.set(level, iterator);
//       }
//     }

//     const latestStatusList = Array.from(latestStatusByLevel.values());

//     return res
//       .json({
//         error: false,
//         message: "Latest status list successfully retrieved",
//         data: latestStatusList,
//       })
//       .end();
//   } catch (error) {
//     return res
//       .json({
//         error: false,
//         message: "Can't fetch supplier list",
//       })
//       .end();
//   }
// };

//for level 1 only
const supplierChangeStatusList = async (req, res) => {
  try {
    const { error, value } = validation.supplierChangeStatusList(req.body);
    if (error) {
      return res.status(400).json({
        error: true,
        message: error.details[0].message,
      });
    }
    const { supplier_id } = value;

    const getStatusList = await knex("supplier_status").where(
      "supplier_id",
      supplier_id
    );

    if (getStatusList.length <= 0) {
      return res.status(404).json({
        error: true,
        message: "Supplier Status does not exist",
      });
    }

    const latestStatusByLevel = new Map();

    for (const iterator of getStatusList) {
      const userName = await knex("users").where("id", iterator.user_id);
      iterator.user_name = userName[0].username;

      const userId = "[" + iterator.user_id + "]";
      const level = iterator.approver_level;

      let get_hk_no;

      switch (level) {
        case 1:
          get_hk_no = await knex("approvers2")
            .where({ level_1_user_id: userId })
            .select("approval_hierarchy_id")
            .first();
          break;
        case 2:
          get_hk_no = await knex("approvers2")
            .where({ level_2_user_id: userId })
            .select("approval_hierarchy_id")
            .first();
          break;
        case 3:
          get_hk_no = await knex("approvers2")
            .where({ level_3_user_id: userId })
            .select("approval_hierarchy_id")
            .first();
          break;
        case 4:
          get_hk_no = await knex("approvers2")
            .where({ level_4_user_id: userId })
            .select("approval_hierarchy_id")
            .first();
          break;
      }

      const getApprovalLevelNameJson = await knex("approval_hierarchy")
        .where("id", get_hk_no.approval_hierarchy_id)
        .select("approval_level_name");

      const parsedJson = JSON.parse(
        getApprovalLevelNameJson[0].approval_level_name
      );

      let approverLevelName;
      for (const iterator2 of parsedJson) {
        if (iterator2.level == level) {
          approverLevelName = iterator2.name;
        }
      }
      iterator.approver_level_name = approverLevelName;

      if (
        !latestStatusByLevel.has(level) ||
        iterator.updated_at > latestStatusByLevel.get(level).updated_at
      ) {
        latestStatusByLevel.set(level, iterator);
      }
    }

    const latestStatusList = Array.from(latestStatusByLevel.values());

    return res.status(200).json({
      error: false,
      message: "Latest status list successfully retrieved",
      data: latestStatusList,
    });
  } catch (error) {
    return res.status(500).json({
      error: false,
      message: "Can't fetch supplier list",
    });
  }
};

//work in progress hp
// const supplierChangeStatusList = async (req, res) => {
//   try {
//     const schema = Joi.object({
//       supplier_id: Joi.string().required(),
//     });

//     const { error, value } = schema.validate(req.body);
//     if (error) {
//       return res.json({
//         error: true,
//         message: error.details[0].message,
//       });
//     }

//     const { supplier_id } = value;

//     const getStatusList = await knex("supplier_status").where(
//       "supplier_id",
//       supplier_id
//     );

//     if (getStatusList.length <= 0) {
//       return res.json({
//         error: true,
//         message: "Supplier Status does not exist",
//       });
//     }

//     let latestStatus = null;

//     for (const status of getStatusList) {
//       if (!latestStatus || status.updated_at > latestStatus.updated_at) {
//         latestStatus = status;
//       }
//     }

//     if (!latestStatus) {
//       return res.json({
//         error: true,
//         message: "Latest status not found",
//       });
//     }

//     const userName = await knex("users")
//       .where("id", latestStatus.user_id)
//       .first();

//     let approverLevelName = "";

//     switch (latestStatus.approver_level) {
//       case 1:
//         const userId = "[" + latestStatus.user_id + "]";
//         const getHierarchy = await knex("approvers2")
//           .where({ level_1_user_id: userId })
//           .select("approval_hierarchy_id")
//           .first();
//         const approvalHierarchy = await knex("approval_hierarchy")
//           .where("id", getHierarchy.approval_hierarchy_id)
//           .first();
//         const parsedJson = JSON.parse(approvalHierarchy.approval_level_name);
//         for (const level of parsedJson) {
//           if (level.level == latestStatus.approver_level) {
//             approverLevelName = level.name;
//             break;
//           }
//         }
//         break;
//       default:
//         approverLevelName = "Unknown";
//         break;
//     }

//     return res.json({
//       error: false,
//       message: "Latest status successfully retrieved",
//       data: {
//         supplier_id: supplier_id,
//         user_id: latestStatus.user_id,
//         status: latestStatus.status,
//         comment: latestStatus.comment,
//         approver_level: latestStatus.approver_level,
//         user_name: userName.username,
//         approver_level_name: approverLevelName,
//       },
//     });
//   } catch (error) {
//     return res.json({
//       error: true,
//       message: "Error fetching supplier status",
//     });
//   }
// };

// const supplierFilteredList = async (req, res) => {
//   try {
//     const searchFrom = ["supplier_name"];

//     const schema = Joi.object({
//       user_id: Joi.number().required(),
//       status: Joi.string()
//         .required()
//         .allow("pending", "queried", "verified", "approved", "rejected", "all")
//         .trim(),
//       offset: Joi.number().default(0),
//       limit: Joi.number().default(50),
//       sort: Joi.string().default("id"),
//       order: Joi.string().valid("asc", "desc").default("desc"),
//       search: Joi.string().allow("", null).default(""),
//     });

//     const { error, value } = schema.validate(req.body);

//     if (error) {
//       return res.json({
//         error: true,
//         message: error.details[0].message,
//       });
//     }

//     const { user_id, status, offset, limit, sort, order, search } = value;

//     try {
//       const getUserLevel = await knex("users")
//         .select("level")
//         .where({ id: user_id });
//       const level = getUserLevel[0].level;
//       console.log("level", level);

//       const getUserRole = await knex("users")
//         .select("role")
//         .where({ id: user_id });
//       const role = getUserRole[0].role;
//       console.log("get", getUserRole);

//       if (role !== "3") {
//         return res.status(400).json({
//           error: true,
//           message: "User is not an approver",
//         });
//       }

//       if (role === "3" && (level === null || level === 0)) {
//         return res.status(400).json({
//           error: true,
//           message: "User is an approver, but levels are not assigned yet",
//         });
//       }

//       const getDeptId = await knex("approvers").select("department_id");

//       let depId = null;

//       if (level === 1) {
//         const getDeptIdFrom = await knex("approvers")
//           .select("department_id")
//           .whereIn(
//             user_id,
//             knex.raw('JSON_UNQUOTE(JSON_EXTRACT(level_1_user_id, "$[0]"))')
//           );
//       if (level === 1) {
//         const getDeptIdFrom = await knex("approvers")
//           .select("department_id")
//           .whereIn(
//             user_id,
//             knex.raw('JSON_UNQUOTE(JSON_EXTRACT(level_1_user_id, "$[0]"))')
//           );

//         console.log("i am here");
//         depId = getDeptIdFrom[0].department_id;
//         console.log("dep id in level 1", depId);
//       } else if (level === 2) {
//         const getDeptIdFrom = await knex("approvers")
//           .select("department_id")
//           .whereIn(
//             user_id,
//             knex.raw('JSON_UNQUOTE(JSON_EXTRACT(level_2_user_id, "$[0]"))')
//           );

//         depId = getDeptIdFrom[0].department_id;
//       } else if (level === 3) {
//         const getDeptIdFrom = await knex("approvers")
//           .select("department_id")
//           .whereIn(
//             user_id,
//             knex.raw('JSON_UNQUOTE(JSON_EXTRACT(level_3_user_id, "$[0]"))')
//           );

//         depId = getDeptIdFrom[0].department_id;
//       } else if (level === 4) {
//         const getDeptIdFrom = await knex("approvers")
//           .select("department_id")
//           .whereIn(
//             user_id,
//             knex.raw('JSON_UNQUOTE(JSON_EXTRACT(level_4_user_id, "$[0]"))')
//           );

//         depId = getDeptIdFrom[0].department_id;
//       }

//       if (depId === null) {
//         return res.status(400).json({
//           error: true,
//           message: "Not any department found for the specified level",
//         });
//       }
//       if (depId === null) {
//         return res.status(400).json({
//           error: true,
//           message: "Not any department found for the specified level",
//         });
//       }

//       console.log("get", depId);
//       let getSupplierDetails;
//       let data;
//       if (status == "all") {
//         data = knex("supplier_details");
//       console.log("get", depId);
//       let getSupplierDetails;
//       let data;
//       if (status == "all") {
//         data = knex("supplier_details");

//         console.log("in data now", data);
//         if (search != "") {
//           for (const iterator of searchFrom) {
//             data = data.whereILike(iterator, `%${search}%`);
//           }
//         }
//         console.log("in data now", data);
//         if (search != "") {
//           for (const iterator of searchFrom) {
//             data = data.whereILike(iterator, `%${search}%`);
//           }
//         }

//         getSupplierDetails = await data
//           .offset(offset)
//           .limit(limit)
//           .orderBy(sort, order);
//       } else {
//         data = await knex("supplier_details")
//           .where({
//             department_id: depId,
//           })
//           .where({ status: status });
//         getSupplierDetails = await data
//           .offset(offset)
//           .limit(limit)
//           .orderBy(sort, order);
//       } else {
//         data = await knex("supplier_details")
//           .where({
//             department_id: depId,
//           })
//           .where({ status: status });

//         if (search != "") {
//           for (const iterator of searchFrom) {
//             data = data.whereILike(iterator, `%${search}%`);
//           }
//         }
//         if (search != "") {
//           for (const iterator of searchFrom) {
//             data = data.whereILike(iterator, `%${search}%`);
//           }
//         }

//         getSupplierDetails = await data
//           .offset(offset)
//           .limit(limit)
//           .orderBy(sort, order);
//       }
//         getSupplierDetails = await data
//           .offset(offset)
//           .limit(limit)
//           .orderBy(sort, order);
//       }

//       let srno = offset + 1;
//       //for converting utc time to ist time
//       for (const iterator of getSupplierDetails) {
//         const utcCreatedAt = iterator.created_at;
//         const utcUpdatedAt = iterator.updated_at;
//         iterator.srno = srno++;
//         const istOffsetMinutes = 330;
//       let srno = offset + 1;
//       //for converting utc time to ist time
//       for (const iterator of getSupplierDetails) {
//         const utcCreatedAt = iterator.created_at;
//         const utcUpdatedAt = iterator.updated_at;
//         iterator.srno = srno++;
//         const istOffsetMinutes = 330;

//         function convertToIST(utcTimestamp) {
//           const utcDate = new Date(utcTimestamp);
//           const istDate = new Date(
//             utcDate.getTime() + istOffsetMinutes * 60000
//           );
//           return istDate.toISOString();
//         }
//         function convertToIST(utcTimestamp) {
//           const utcDate = new Date(utcTimestamp);
//           const istDate = new Date(
//             utcDate.getTime() + istOffsetMinutes * 60000
//           );
//           return istDate.toISOString();
//         }

//         const istCreatedAt = convertToIST(utcCreatedAt);
//         const istUpdatedAt = convertToIST(utcUpdatedAt);
//         const istCreatedAt = convertToIST(utcCreatedAt);
//         const istUpdatedAt = convertToIST(utcUpdatedAt);

//         iterator.created_at = istCreatedAt;
//         iterator.updated_at = istUpdatedAt;
//       }
//         iterator.created_at = istCreatedAt;
//         iterator.updated_at = istUpdatedAt;
//       }

//       if (getSupplierDetails.length === 0) {
//         return res.status(400).json({
//           error: true,
//           message: "Supplier does not exist with this department or status",
//         });
//       }
//       if (getSupplierDetails.length === 0) {
//         return res.status(400).json({
//           error: true,
//           message: "Supplier does not exist with this department or status",
//         });
//       }

//       const supplierDetails = [];
//       for (const supplier of getSupplierDetails) {
//         const supplierId = supplier.id;
//       const supplierDetails = [];
//       for (const supplier of getSupplierDetails) {
//         const supplierId = supplier.id;

//         const getBusinessDetails = await knex("business_details").where({
//           company_id: supplierId,
//         });
//         const getBusinessDetails = await knex("business_details").where({
//           company_id: supplierId,
//         });

//         const businessDetailsData = getBusinessDetails[0];
//         const businessDetailsData = getBusinessDetails[0];

//         const getFinancialDetails = await knex("financial_details").where({
//           company_id: supplierId,
//         });
//         const getFinancialDetails = await knex("financial_details").where({
//           company_id: supplierId,
//         });

//         const financialDetailsData = getFinancialDetails[0];
//         const financialDetailsData = getFinancialDetails[0];

//         const getTaxDetails = await knex("tax_details").where({
//           company_id: supplierId,
//         });

//         if (
//           getTaxDetails[0].msmeImage !== "" &&
//           getTaxDetails[0].msmeImage !== null
//         ) {
//           getTaxDetails[0].msmeImage = await s3.getTempUrl(
//             getTaxDetails[0].msmeImage
//           );
//         }

//         if (
//           getTaxDetails[0].panCardImage !== "" &&
//           getTaxDetails[0].panCardImage !== null
//         ) {
//           getTaxDetails[0].panCardImage = await s3.getTempUrl(
//             getTaxDetails[0].panCardImage
//           );
//         }

//         if (
//           getTaxDetails[0].cancelledChequeImage !== "" &&
//           getTaxDetails[0].cancelledChequeImage !== null
//         ) {
//           getTaxDetails[0].cancelledChequeImage = await s3.getTempUrl(
//             getTaxDetails[0].cancelledChequeImage
//           );
//         }

//         if (
//           getTaxDetails[0].gstImage !== "" &&
//           getTaxDetails[0].gstImage !== null
//         ) {
//           getTaxDetails[0].gstImage = await s3.getTempUrl(
//             getTaxDetails[0].gstImage
//           );
//         }

//         const taxDetailsData = getTaxDetails[0];

//         supplierDetails.push({
//           srno: supplierDetails.length + 1,
//           ...supplier,
//           BussinessDetails: businessDetailsData,
//           FinancialDetails: financialDetailsData,
//           TaxDetails: taxDetailsData,
//         });
//       }

//       return res.json({
//         error: false,
//         message: "Here are the details of the supplier",
//         total: supplierDetails.length,
//         data: supplierDetails,
//       });
//     } catch (error) {
//       return res.status(500).json({
//         error: true,
//         message: "Something went wrong",
//       });
//     }
//   } catch (error) {
//     return res
//       .json({
//         error: true,
//         message: "Can't fetch Supplier filtered list",
//       })
//       .end();
//   }
// };

//level 1 approval
// const supplierFilteredList = async (req, res) => {
//   // try {
//   const schema = Joi.object({
//     user_id: Joi.number().required(),
//     status: Joi.string()
//       .required()
//       .valid("pending", "queried", "verified", "approved", "rejected", "all")
//       .trim(),
//     offset: Joi.number().integer(),
//     limit: Joi.number().integer(),
//     order: Joi.string(),
//     sort: Joi.string(),
//     search: Joi.string().allow(""),
//   });

//   const { error, value } = schema.validate(req.body, { abortEarly: false });
//   if (error) {
//     const errorMessages = error.details.map((detail) => detail.message);
//     console.error("Joi validation error:", errorMessages);
//     return res.status(400).json({
//       error: true,
//       message: "Field error",
//       details: errorMessages,
//     });
//   }

//   const { user_id, status } = value;

//   // Get user details
//   const getUserDetails = await knex("users").where("id", user_id).select();
//   console.log("User details:", getUserDetails);

//   const userDept = getUserDetails[0].approverofdept;
//   console.log("Department ID:", userDept);

//   // Query suppliers with status filter
//   const getDepListByUserId = await knex("supplier_details")
//     .where({
//       department_id: userDept,
//     })
//     .andWhere((builder) => {
//       if (status !== "all") {
//         builder.where("status", status);
//       }
//     })
//     .orderBy("created_at", "desc")
//     .limit(1000)
//     .offset(0)
//     .select();

//   if (!getDepListByUserId) {
//     return res.json({
//       error: true,
//       message: "Unable to get suppliers by department",
//     });
//   }

//   // Process additional details if needed
//   const supplierDetails = getDepListByUserId.map((supplier, index) => ({
//     srno: index + 1,
//     ...supplier,
//   }));

//   return res.json({
//     error: false,
//     message: "Here are the details of the suppliers in the user's department",
//     total: supplierDetails.length,
//     data: supplierDetails,
//   });
//   // } catch (error) {
//   //   return res.json({
//   //     error: true,
//   //     message: "something went wrong",
//   //   });
//   // }
// };
// const supplierFilteredList = async (req, res) => {
//   try {
//     const schema = Joi.object({
//       user_id: Joi.number().required(),
//       status: Joi.string()
//         .required()
//         .valid("pending", "queried", "verified", "approved", "rejected", "all")
//         .trim(),
//       offset: Joi.number().integer(),
//       limit: Joi.number().integer(),
//       order: Joi.string(),
//       sort: Joi.string(),
//       search: Joi.string().allow(""),
//     });

//     const { error, value } = schema.validate(req.body, { abortEarly: false });
//     if (error) {
//       const errorMessages = error.details.map((detail) => detail.message);
//       console.error("Joi validation error:", errorMessages);
//       return res.status(400).json({
//         error: true,
//         message: "Field error",
//         details: errorMessages,
//       });
//     }

//     const { user_id, status } = value;

//     // Get user details
//     const getUserDetails = await knex("users").where("id", user_id).select();
//     console.log("User details:", getUserDetails);

//     const userDept = getUserDetails[0].approverofdept;
//     console.log("Department ID:", userDept);

//     // Query suppliers with status filter
//     const getDepListByUserId = await knex("supplier_details")
//       .where({
//         department_id: userDept,
//       })
//       .andWhere((builder) => {
//         if (status !== "all") {
//           builder.where("status", status);
//         }
//       })
//       .orderBy("created_at", "desc")
//       .limit(1000)
//       .offset(0)
//       .select();

//     if (!getDepListByUserId) {
//       return res.json({
//         error: true,
//         message: "Unable to get suppliers by department",
//       });
//     }

//     // Process additional details if needed and convert UTC to IST
//     const supplierDetails = getDepListByUserId.map((supplier, index) => {
//       const utcDateTime = new Date(supplier.created_at);
//       const istDateTime = new Date(
//         utcDateTime.toLocaleString("en-US", { timeZone: "Asia/Kolkata" })
//       );

//       return {
//         srno: index + 1,
//         ...supplier,
//         created_at: istDateTime.toISOString(), // Use ISO string for consistent formatting
//       };
//     });

//     return res.json({
//       error: false,
//       message: "Here are the details of the suppliers in the user's department",
//       total: supplierDetails.length,
//       data: supplierDetails,
//     });
//   } catch (error) {
//     return res.json({
//       error: true,
//       message: "Something went wrong",
//     });
//   }
// };

//with utc to ist time
//without filter startend date
// const supplierFilteredList = async (req, res) => {
//   try {
//   const schema = Joi.object({
//     user_id: Joi.number().required(),
//     status: Joi.string()
//       .required()
//       .valid("pending", "queried", "verified", "approved", "rejected", "all")
//       .trim(),
//     offset: Joi.number().integer(),
//     limit: Joi.number().integer(),
//     order: Joi.string(),
//     sort: Joi.string(),
//     search: Joi.string().allow(""),
//   });

//   const { error, value } = schema.validate(req.body, { abortEarly: false });
//   if (error) {
//     const errorMessages = error.details.map((detail) => detail.message);
//     console.error("Joi validation error:", errorMessages);
//     return res.status(400).json({
//       error: true,
//       message: "Field error",
//       details: errorMessages,
//     });
//   }

//   const { user_id, status, offset, limit, order, sort, search } = value;

//   // Get user details
//   const getUserDetails = await knex("users").where("id", user_id).select();
//   let temp = [];
//   temp.push(getUserDetails[0].id);
//   console.log("this is teemp", temp);
//   const userDept = getUserDetails[0].approverofdept;
//   const getPortalCode = await knex("approvers2")
//     .where("department_id", userDept)
//     .andWhere("level_1_user_id", JSON.stringify(temp))
//     .select("portal_code")
//     .first(); // Query suppliers with status filter and pagination

//   const getDepListByUserId = await knex("supplier_details")
//     .where((builder) => {
//       builder.where("department", getPortalCode.portal_code);
//       if (status !== "all") {
//         builder.andWhere("status", status);
//       }
//       if (search) {
//         builder.andWhere("some_column", "like", `%${search}%`);
//       }
//     })
//     .select(
//       "id",
//       "supplier_name",
//       "emailID",
//       "department",
//       "sap_code",
//       "status",
//       "created_at"
//     )
//     .orderBy(sort || "created_at", order || "desc")
//     .limit(limit || 1000)
//     .offset(offset || 0)
//     .select();

//   if (!getDepListByUserId) {
//     return res.json({
//       error: true,
//       message: "Unable to get suppliers by department",
//     });
//   }

//   // Process additional details if needed and convert UTC to IST
//   const supplierDetails = getDepListByUserId.map((supplier, index) => {
//     const utcDateTime = new Date(supplier.created_at);
//     const istDateTime = new Date(
//       utcDateTime.toLocaleString("en-US", { timeZone: "Asia/Kolkata" })
//     );

//     return {
//       srno: index + 1,
//       ...supplier,
//       created_at: istDateTime.toISOString(),
//     };
//   });

//   supplierDetails[0].registeryAuthority = getDepListByUserId[0].department;
//   return res.json({
//     error: false,
//     message: "Here are the details of the suppliers in the user's department",
//     total: supplierDetails.length,
//     data: supplierDetails,
//   });
//   } catch (error) {
//     return res.json({
//       error: true,
//       message: "Something went wrong",
//     });
//   }
// };

// const supplierFilteredList = async (req, res) => {
//   // try {
//   const schema = Joi.object({
//     user_id: Joi.number().required(),
//     status: Joi.string()
//       .required()
//       .valid("pending", "queried", "verified", "approved", "rejected", "all")
//       .trim(),
//     offset: Joi.number().integer(),
//     limit: Joi.number().integer(),
//     order: Joi.string(),
//     sort: Joi.string(),
//     search: Joi.string().allow(""),
//     filter: Joi.object()
//       .keys({
//         startDate: Joi.date().iso().raw().allow(""),
//         endDate: Joi.date().iso().raw().allow(""),
//         dateField: Joi.string().valid("created_at", "updated_at").allow(""),
//       })
//       .default(null),
//   });

//   const { error, value } = schema.validate(req.body, { abortEarly: false });
//   if (error) {
//     const errorMessages = error.details.map((detail) => detail.message);
//     console.error("Joi validation error:", errorMessages);
//     return res.status(400).json({
//       error: true,
//       message: "Field error",
//       details: errorMessages,
//     });
//   }

//   const { user_id, status, offset, limit, order, sort, search, filter } = value;

//   // Get user details
//   const getUserDetails = await knex("users").where("id", user_id).select();
//   let temp = [];
//   temp.push(getUserDetails[0].id);
//   console.log("this is temp", temp);
//   const userDept = getUserDetails[0].approverofdept;
//   const getPortalCode = await knex("approvers2")
//     .where("department_id", userDept)
//     .andWhere("level_1_user_id", JSON.stringify(temp))
//     .select("portal_code")
//     .first(); // Query suppliers with status filter and pagination

//   let getDepListByUserId = knex("supplier_details")
//     .where((builder) => {
//       builder.where("department", getPortalCode.portal_code);
//       if (status !== "all") {
//         builder.andWhere("status", status);
//       }
//       if (search) {
//         builder.andWhere("some_column", "like", `%${search}%`);
//       }
//       if (filter && filter.startDate && filter.endDate && filter.dateField) {
//         const startDateISO = new Date(filter.startDate).toISOString();
//         const endDateISO = new Date(
//           filter.endDate + "T23:59:59.999Z"
//         ).toISOString();

//         if (filter.dateField === "created_at") {
//           builder.whereBetween("created_at", [startDateISO, endDateISO]);
//         } else if (filter.dateField === "updated_at") {
//           builder.whereBetween("updated_at", [startDateISO, endDateISO]);
//         }
//       }
//     })
//     .select(
//       "id",
//       "supplier_name",
//       "emailID",
//       "department",
//       "sap_code",
//       "status",
//       "created_at"
//     );

//   getDepListByUserId = await getDepListByUserId
//     .orderBy(sort || "created_at", order || "desc")
//     .limit(limit || 1000)
//     .offset(offset || 0);

//   const totalCountResult = await knex("supplier_details")
//     .where((builder) => {
//       builder.where("department", getPortalCode.portal_code);
//       if (status !== "all") {
//         builder.andWhere("status", status);
//       }
//       if (search) {
//         builder.andWhere("some_column", "like", `%${search}%`);
//       }
//       if (filter && filter.startDate && filter.endDate && filter.dateField) {
//         const startDateISO = new Date(filter.startDate).toISOString();
//         const endDateISO = new Date(
//           filter.endDate + "T23:59:59.999Z"
//         ).toISOString();

//         if (filter.dateField === "created_at") {
//           builder.whereBetween("created_at", [startDateISO, endDateISO]);
//         } else if (filter.dateField === "updated_at") {
//           builder.whereBetween("updated_at", [startDateISO, endDateISO]);
//         }
//       }
//     })
//     .count("id as total")
//     .first();
//   const total = totalCountResult.total;

//   // Process additional details if needed and convert UTC to IST
//   const supplierDetails = await Promise.all(
//     getDepListByUserId.map(async (supplier, index) => {
//       const utcDateTime = new Date(supplier.created_at);
//       const istDateTime = new Date(
//         utcDateTime.toLocaleString("en-US", { timeZone: "Asia/Kolkata" })
//       );

//       return {
//         srno: index + 1,
//         ...supplier,
//         created_at: istDateTime.toISOString(),
//       };
//     })
//   );
//   if (supplierDetails.length === 0) {
//     return res.json({
//       error: false,
//       data: [],
//       message: "No results found for the given filtered date range.",
//     });
//   }
//   return res.json({
//     error: false,
//     message: "Here are the details of the suppliers in the user's department",
//     total,
//     data: supplierDetails,
//   });
//   // } catch (error) {
//   //   console.error(error);
//   //   return res.status(500).json({
//   //     error: true,
//   //     message: "Something went wrong",
//   //   });
//   // }
// };

const supplierFilteredList = async (req, res) => {
  try {
    const searchFrom = [
      "supplier_name",
      "department",
      "sap_code",
      "emailID",
      "gstNo",
      "panNo",
    ];
    const { error, value } = validation.supplierFilteredList(req.body, {
      abortEarly: false,
    });
    if (error) {
      const errorMessages = error.details.map((detail) => detail.message);
      console.error("Joi validation error:", errorMessages);
      return res.status(400).json({
        error: true,
        message: "Field error",
        details: errorMessages,
      });
    }

    const { user_id, status, offset, limit, order, sort, search, filter } =
      value;

    // Get user details
    const getUserDetails = await knex("users").where("id", user_id).select();
    let temp = [];
    temp.push(getUserDetails[0].id);
    // console.log("this is temp", temp);
    const userDept = getUserDetails[0].approverofdept;
    const getPortalCode = await knex("approvers2")
      .where("department_id", userDept)
      .andWhere("level_1_user_id", JSON.stringify(temp))
      .select("portal_code")
      .first(); // Query suppliers with status filter and pagination

    let getDepListByUserId = knex("supplier_details")
      .where((builder) => {
        builder.where("department", getPortalCode.portal_code);
        if (status !== "all") {
          builder.andWhere("status", status);
        }
        if (search) {
          builder.where((innerBuilder) => {
            searchFrom.forEach((field) => {
              innerBuilder.orWhere(field, "like", `%${search}%`);
            });
          });
        }
        if (filter && filter.startDate && filter.endDate && filter.dateField) {
          const startDateISO = new Date(filter.startDate).toISOString();
          const endDateISO = new Date(
            filter.endDate + "T23:59:59.999Z"
          ).toISOString();

          if (filter.dateField === "created_at") {
            builder.whereBetween("created_at", [startDateISO, endDateISO]);
          } else if (filter.dateField === "updated_at") {
            builder.whereBetween("updated_at", [startDateISO, endDateISO]);
          }
        }
      })
      .select(
        "id",
        "supplier_name",
        "gstNo",
        "panNo",
        "emailID",
        "department",
        "sap_code",
        "status",
        "created_at"
      );

    getDepListByUserId = await getDepListByUserId
      .orderBy(sort || "created_at", order || "desc")
      .limit(limit || 1000)
      .offset(offset || 0);

    const totalCountResult = await knex("supplier_details")
      .where((builder) => {
        builder.where("department", getPortalCode.portal_code);
        if (status !== "all") {
          builder.andWhere("status", status);
        }
        if (search) {
          builder.where((innerBuilder) => {
            searchFrom.forEach((field) => {
              innerBuilder.orWhere(field, "like", `%${search}%`);
            });
          });
        }
        if (filter && filter.startDate && filter.endDate && filter.dateField) {
          const startDateISO = new Date(filter.startDate).toISOString();
          const endDateISO = new Date(
            filter.endDate + "T23:59:59.999Z"
          ).toISOString();

          if (filter.dateField === "created_at") {
            builder.whereBetween("created_at", [startDateISO, endDateISO]);
          } else if (filter.dateField === "updated_at") {
            builder.whereBetween("updated_at", [startDateISO, endDateISO]);
          }
        }
      })
      .count("id as total")
      .first();
    const total = totalCountResult.total;

    // Process additional details if needed and convert UTC to IST
    const supplierDetails = await Promise.all(
      getDepListByUserId.map(async (supplier, index) => {
        const utcDateTime = new Date(supplier.created_at);
        const istDateTime = new Date(
          utcDateTime.toLocaleString("en-US", { timeZone: "Asia/Kolkata" })
        );

        return {
          srno: index + 1,
          ...supplier,
          created_at: istDateTime.toISOString(),
        };
      })
    );
    if (supplierDetails.length === 0) {
      return res.status(200).json({
        error: false,
        message: "Not any supplier found.",
        data: [],
      });
    }
    return res.status(200).json({
      error: false,
      message: "Here are the details of the suppliers in the user's department",
      total,
      data: supplierDetails,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      error: true,
      message: "could not load record",
      data: JSON.stringify(error),
    });
  }
};

const view = async (req, res) => {
  try {
    const { error, value } = validation.view(req.params);
    if (error) {
      return res.status(400).json({
        error: true,
        message: error.details[0].message,
      });
    }

    const { id } = value;

    const getSupplierDetails = await knex("supplier_details")
      .where("id", id)
      .first();

    if (getSupplierDetails == undefined) {
      return res.status(404).json({
        error: true,
        message: "Supplier details do not exist",
      });
    }

    //get max level
    const maxLevelQuery = await knex("approverTest")
      .where({ departmentId: getSupplierDetails.department_id })
      .max("level as maxLevel")
      .first();

    const maxLevel = maxLevelQuery.maxLevel;

    const getBusinessDetails = await knex("business_details")
      .where({ company_id: getSupplierDetails.id })
      .first();

    if (
      getBusinessDetails.msmeType != null ||
      getBusinessDetails.msmeType != ""
    ) {
      const getMSMETypeName = await knex("minority_indicator").where(
        "id",
        getBusinessDetails.msmeType
      );
      getBusinessDetails.msmeType = getMSMETypeName[0]
        ? getMSMETypeName[0].min_ind + " - " + getMSMETypeName[0].Description
        : "";
    }

    const getCompanyType = await knex("company_types")
      .where("id", getBusinessDetails.companyType)
      .select("name");
    const companyTypeName = getCompanyType[0] ? getCompanyType[0].name : "";
    getBusinessDetails.companyType = companyTypeName;

    const geBusinessType = await knex("business_types")
      .where("id", getBusinessDetails.businessType)
      .select("name");
    const businessTypeName = geBusinessType[0] ? geBusinessType[0].name : "";
    getBusinessDetails.businessType = businessTypeName;

    const getListOfMajorCustomers = await knex("major_customer")
      .where("id", getBusinessDetails.listOfMajorCustomers)
      .select("name");
    const majorCustomerName = getListOfMajorCustomers[0]
      ? getListOfMajorCustomers[0].name
      : "";
    getBusinessDetails.listOfMajorCustomers = majorCustomerName;

    const getMajorOrder = await knex("major_order")
      .where("id", getBusinessDetails.detailsOfMajorLastYear)
      .select("name");
    const majorOrderName = getMajorOrder[0] ? getMajorOrder[0].name : "";
    getBusinessDetails.detailsOfMajorLastYear = majorOrderName;

    const getdeapartmentName = await knex("approvers2")
      .where("department_id", getSupplierDetails.department_id)
      // .andWhere("level_1_user_id",)
      .select("portal_code");

    const deapartmentName = getdeapartmentName[0]
      ? getdeapartmentName[0].name
      : "";
    getSupplierDetails.department = getSupplierDetails.department;

    const getSourceName = await knex("company_source")
      .where("id", getSupplierDetails.source)
      .select("name");
    const sourceName = getSourceName[0] ? getSourceName[0].name : "";
    getSupplierDetails.source = sourceName;

    const getPaymentMethod = await knex("payment_types")
      .where("id", getSupplierDetails.paymentMethod)
      .select("name");

    const paymentMethod = getPaymentMethod[0] ? getPaymentMethod[0].name : "";

    getSupplierDetails.paymentMethod = paymentMethod;
    // console.log(getSupplierDetails);
    const getFinancialDetails = await knex("financial_details")
      .where({ company_id: getSupplierDetails.id })
      .first();

    const getCurrencyName = await knex("currencies")
      .where("id", getFinancialDetails.currency)
      .select("name");
    const currencyName = getCurrencyName[0] ? getCurrencyName[0].name : "";
    getFinancialDetails.currency = currencyName;

    const getTaxDetails = await knex("tax_details")
      .where({ company_id: getSupplierDetails.id })
      .first();

    const getAdditionalDetails = await knex("additional_company_details")
      .where({ supplier_id: getSupplierDetails.id })
      .first();

    if (getTaxDetails != undefined) {
      if (getTaxDetails.msmeImage)
        getTaxDetails.msmeImage = await s3.getTempUrl(getTaxDetails.msmeImage);
      if (getTaxDetails.gstImage)
        getTaxDetails.gstImage = await s3.getTempUrl(getTaxDetails.gstImage);
      if (getTaxDetails.cancelledChequeImage)
        getTaxDetails.cancelledChequeImage = await s3.getTempUrl(
          getTaxDetails.cancelledChequeImage
        );
      if (getTaxDetails.panCardImage)
        getTaxDetails.panCardImage = await s3.getTempUrl(
          getTaxDetails.panCardImage
        );

      if (getTaxDetails.pfAttachment)
        getTaxDetails.pfAttachment = await s3.getTempUrl(
          getTaxDetails.pfAttachment
        );

      if (getTaxDetails.otherAttachments)
        getTaxDetails.otherAttachments = await s3.getTempUrl(
          getTaxDetails.otherAttachments
        );
    }

    if (getSupplierDetails.id != undefined) {
      delete getSupplierDetails.password;

      const getCountryName = await knex("countries").where(
        "country_key",
        getSupplierDetails.country
      );
      const countryName = getCountryName[0] ? getCountryName[0].name : "";
      getSupplierDetails.country = countryName;

      const getStateName = await knex("states")
        .where("countryDesc", getSupplierDetails.country)
        .where("stateKey", getSupplierDetails.state);
      const stateName = getStateName[0] ? getStateName[0].stateDesc : "";
      getSupplierDetails.country;
      getSupplierDetails.state = stateName;
    }

    getSupplierDetails.business_details = getBusinessDetails;
    getSupplierDetails.finance_details = getFinancialDetails;
    getSupplierDetails.tax_details = getTaxDetails;
    getSupplierDetails.additionalDetails = getAdditionalDetails;
    getSupplierDetails.lastLevel = maxLevel;

    // console.log("this is department", getdeapartmentName);
    return res.status(200).json({
      error: false,
      data: getSupplierDetails,
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: "Can't fetch Supplier data",
      data: JSON.stringify(error),
    });
  }
};

const createMajorCustomer = async (req, res) => {
  try {
    const { error, value } = validation.createMajorCustomer(req.body);
    if (error) {
      return res.status(400).json({
        error: true,
        message: error.details[0].message,
      });
    }

    const { name } = value;

    const createMajorCustomer = await knex("major_customer").insert({ name });

    if (!createMajorCustomer) {
      return res.status(500).json({
        error: true,
        message: "Major customer creation failed",
      });
    }

    return res.status(201).json({
      error: false,
      message: "Major customer created successfully",
      data: createMajorCustomer,
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: "Cant' create major customer",
      data: JSON.stringify(error),
    });
  }
};

const majorCustomerList = async (req, res) => {
  try {
    const selectRecords = await knex("major_customer").select();

    if (!selectRecords) {
      return res.status(400).json({
        error: true,
        message: "Major customer list not found",
      });
    }

    return res.status(200).json({
      error: false,
      message: "Major customer list successfully retrived",
      data: selectRecords,
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: "Can't create major customer",
      data: JSON.stringify(error),
    });
  }
};

const createDetailsOfMajorOrder = async (req, res) => {
  try {
    const { error, value } = validation.createDetailsOfMajorOrder(req.body);
    if (error) {
      return res.status(400).json({
        error: true,
        message: error.details[0].message,
      });
    }

    const { name } = value;

    const insertRecord = await knex("major_order").insert({ name });

    if (!insertRecord) {
      return res.status(500).json({
        error: true,
        message: "Major order creation failed",
      });
    }

    return res.status(201).json({
      error: false,
      message: "Major order created successfully",
      data: insertRecord,
    });
  } catch (error) {
    return res.status(500).json({
      error: false,
      message: "Can't create major order",
      data: JSON.stringify(error),
    });
  }
};

const detailsOfMajorOrderList = async (req, res) => {
  try {
    const getRecords = await knex("major_order").select();

    if (getRecords.length <= 0) {
      return res.status(404).json({
        error: true,
        message: "No Major order found",
      });
    }

    return res.status(200).json({
      error: false,
      message: "Major order list successfully retrived",
      data: getRecords,
    });
  } catch (error) {
    return res.status(500).json({
      error: false,
      message: "Can't fetch major order list",
      data: JSON.stringify(error),
    });
  }
};

const supplierValidation = async (req, res) => {
  try {
    const { error, value } = validation.supplierValidation(req.body);
    if (error) {
      return res.status(400).json({
        error: true,
        message: error.details[0].message,
      });
    }

    const { gst_no, pan_no } = value;
    let getSupplier;

    if (gst_no != "") {
      getSupplier = await knex("supplier_details").where({ gstNo: gst_no });
    } else if (pan_no != "") {
      getSupplier = await knex("supplier_details").where({ panNo: pan_no });
    }

    if (getSupplier.length > 0) {
      return res.status(409).json({
        error: true,
        message: "Supplier already exist",
      });
    }

    return res.status(200).json({
      error: false,
      message: "Welcome to onboarding...",
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: "Can't do Supplier Validation",
      data: JSON.stringify(error),
    });
  }
};

//created supplier list where sap_code is not null and level2status is approved
const createdSupplierList = async (req, res) => {
  try {
    const getSupplierList = await knex("supplier_details").select("*");

    let newdata = [];
    let srno = 1;
    for (const iterator of getSupplierList) {
      if (iterator.sap_code != null && iterator.level2status === "approved") {
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

          const vendorSchema = await knex("vendor_schema")
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

    return res.status(200).json({
      error: false,
      message: "Data retrived successfully",
      total: newdata.length,
      data: newdata,
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: "could not load record",
      data: JSON.stringify(error),
    });
  }
};

//pending vendor list
const pendingSupplierList = async (req, res) => {
  try {
    const getSupplierList = await knex("supplier_details").select("*");

    let newdata = [];
    let srno = 1;
    for (const iterator of getSupplierList) {
      if (
        (iterator.sap_code == null || iterator.sap_code === "") &&
        iterator.level2status === "approved"
      ) {
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

    return res.status(200).json({
      error: false,
      message: "Data retrived successfully",
      total: newdata.length,
      data: newdata,
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: "could not load record",
      data: JSON.stringify(error),
    });
  }
};

//if level 1 is verfied then show the list
const levelVerifeidList = async (req, res) => {
  try {
    const searchFrom = ["supplier_name"];
    const { error, value } = validation.levelVerifeidList(req.body);

    if (error) {
      return res.status(400).json({
        error: true,
        message: error.details[0].message,
      });
    }

    const { offset, limit, sort, order, status, search } = value;

    let getSupplierList = knex("supplier_details");

    if (status != "all") {
      getSupplierList.where("status", status);
    }

    if (search != "") {
      for (const iterator of searchFrom) {
        getSupplierList.whereLike(iterator, "%" + search + "%");
      }
    }
    getSupplierList = await getSupplierList
      .select("*")
      .offset(offset)
      .limit(limit)
      .orderBy(sort, order);

    let newdata = [];
    let srno = offset + 1;

    //for converting utc time to ist time
    for (const iterator of getSupplierList) {
      const utcCreatedAt = iterator.created_at;
      const utcUpdatedAt = iterator.updated_at;
      iterator.srno = srno++;
      const istOffsetMinutes = 330;

      function convertToIST(utcTimestamp) {
        const utcDate = new Date(utcTimestamp);
        const istDate = new Date(utcDate.getTime() + istOffsetMinutes * 60000);
        return istDate.toISOString();
      }

      const istCreatedAt = convertToIST(utcCreatedAt);
      const istUpdatedAt = convertToIST(utcUpdatedAt);

      iterator.created_at = istCreatedAt;
      iterator.updated_at = istUpdatedAt;
    }

    for (const iterator of getSupplierList) {
      if (
        iterator.status === "verified" ||
        iterator.status === "approved" ||
        iterator.status === "pending" ||
        iterator.status === "queried"
      ) {
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

          // const businessPartnerGroup = await knex("business_partner_groups")
          //   .where({ id: add.business_partner_groups })
          //   .select();
          // add.business_partner_groups = businessPartnerGroup;

          // const departments = await knex("departments")
          //   .where({ id: add.departments })
          //   .select();
          // add.departments = departments;

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

    return res.status(200).json({
      error: false,
      message: "Data retrived successfully",
      total: newdata.length,
      data: newdata,
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: "could not load record",
      data: JSON.stringify(error),
    });
  }
};

//updating tds in supplier_details table
const updateTds = async (req, res) => {
  try {
    const { error, value } = validation.updateTds(req.body);
    if (error) {
      return res
        .status(400)
        .json({ error: true, message: error.details[0].message });
    }

    const { id, itWitholding } = value;

    const itWitholding_are = JSON.stringify(itWitholding);

    const getId = await knex("additional_company_details")
      .where("supplier_id", id)
      .first();
    const updationDataIs = await functions.takeSnapShot(
      "additional_company_details",
      getId.id
    );

    const updateTds = await knex("additional_company_details")
      .update({
        itWitholding: itWitholding_are,
      })
      .where("supplier_id", id);

    if (!updateTds) {
      return res.status(404).json({
        error: true,
        message: "Supplier does not exist",
      });
    }
    if (id) {
      const modifiedByTable1 = await functions.SetModifiedBy(
        req.headers["authorization"],
        "additional_company_details",
        "supplier_id",
        id
      );
      // console.log("isUpdated:-", modifiedByTable1);
    }
    return res.status(200).json({
      error: false,
      message: "Supplier updated successfully",
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: "Can't update Supplier",
      data: JSON.stringify(error),
    });
  }
};

// const updateTaxDetails = async (req, res) => {
//   try {
//     const schema = Joi.object({
//       supplierId: Joi.string().required(),
//       msmeImage: Joi.string().allow(""),
//       gstImage: Joi.string().allow(""),
//       cancelledChequeImage: Joi.string().allow(""),
//       panCardImage: Joi.string().allow(""),
//       otherAttachments: Joi.string().allow(""),
//     });

//     const { error, value } = schema.validate(req.body);

//     if (error) {
//       return res.json({
//         error: true,
//         message: error.details[0].message,
//       });
//     }

//     const {
//       supplierId,
//       msmeImage,
//       gstImage,
//       cancelledChequeImage,
//       panCardImage,
//       otherAttachments,
//     } = value;

//     const dataToUpdate = {};

//     if (msmeImage) {
//       dataToUpdate.msmeImage = msmeImage;
//     }
//     if (gstImage) {
//       dataToUpdate.gstImage = gstImage;
//     }
//     if (cancelledChequeImage) {
//       dataToUpdate.cancelledChequeImage = cancelledChequeImage;
//     }
//     if (panCardImage) {
//       dataToUpdate.panCardImage = panCardImage;
//     }
//     if (otherAttachments) {
//       dataToUpdate.otherAttachments = otherAttachments;
//     }
//     console.log("dataToUpdate:-", dataToUpdate);

//     const updateTaxDetails = await knex("tax_details")
//       .update(dataToUpdate)
//       .where("company_id", supplierId);

//     if (!updateTaxDetails) {
//       return res.json({
//         error: true,
//         message: "Supplier does not exist",
//       });
//     }

//     return res.json({
//       error: false,
//       message: "Supplier updated successfully",
//     });
//   } catch (error) {
//     return res.json({
//       error: true,
//       message: "Something went wrong",
//     });
//   }
// };

/*

const s32 = new AWS.S3({
  accessKeyId: constants.s3Creds.accessKey,
  secretAccessKey: constants.s3Creds.secret,
  signatureVersion: "v4",
  region: "ap-south-1",
});
const Bucket = constants.s3Creds.bucket;

const updateTaxDetails = async (req, res) => {
  try {
    // Validate request body
    const schema = Joi.object({
      supplierId: Joi.string().required(),
      msmeImage: Joi.any(),
      gstImage: Joi.any(),
      cancelledChequeImage: Joi.any(),
      panCardImage: Joi.any(),
      pfAttachment: Joi.any(),
      otherAttachments: Joi.any(),
    });

    const { error, value } = schema.validate(req.body);
    if (error) {
      return res.json({
        error: true,
        message: error.details[0].message,
      });
    }

    // Extract data from request body
    const {
      supplierId,
      msmeImage,
      gstImage,
      cancelledChequeImage,
      panCardImage,
      pfAttachment,
      otherAttachments,
    } = value;

    // Check if the supplier exists in the database
    const supplierExists = await knex("tax_details")
      .where("company_id", supplierId)
      .first();

    if (!supplierExists) {
      return res.json({
        error: true,
        message: "Supplier does not exist",
      });
    }

    // Function to generate pre-signed URL
    const generatePresignedUrl = async (fileName, fileType) => {
      if (!fileName) return null;
      const params = {
        Bucket: Bucket,
        Key: "content-server/" + fileName,
        Expires: 60, // URL expiration time in seconds
        ContentType: fileType,
      };

      return s32.getSignedUrlPromise("putObject", params);
    };

    // Object to store updated attachment URLs
    const dataToUpdate = {};
    // console.log("this is bucket",Bucket)

    // Generate pre-signed URLs for each attachment if it exists
    dataToUpdate.msmeImage = await generatePresignedUrl(
      req.files.msmeImage.name,
      req.files.msmeImage.mimetype
    );
    dataToUpdate.gstImage = await generatePresignedUrl(
      req.files.gstImage.name,
      req.files.gstImage.mimetype
    );
    dataToUpdate.cancelledChequeImage = await generatePresignedUrl(
      req.files.cancelledChequeImage.name,
      req.files.cancelledChequeImage.mimetype
    );
    dataToUpdate.panCardImage = await generatePresignedUrl(
      req.files.panCardImage.name,
      req.files.panCardImage.mimetype
    );
    dataToUpdate.pfAttachment = await generatePresignedUrl(
      req.files.pfAttachment.name,
      req.files.pfAttachment.mimetype
    );
    dataToUpdate.otherAttachments = await generatePresignedUrl(
      req.files.otherAttachments.name,
      req.files.otherAttachments.mimetype
    );

    const forFileName = new Date().getTime();

    // Update the specified columns in the database
    console.log("data", dataToUpdate);
    const updateResult = await knex("tax_details")
      .update({
        msmeImage: forFileName + "-" + req.files.msmeImage.name,
        gstImage: forFileName + "-" + req.files.gstImage.name,
        cancelledChequeImage:
          forFileName + "-" + req.files.cancelledChequeImage.name,
        panCardImage: forFileName + "-" + req.files.panCardImage.name,
        pfAttachment: forFileName + "-" + req.files.pfAttachment.name,
        otherAttachments: forFileName + "-" + req.files.otherAttachments.name,
      })
      .where("company_id", supplierId);

    // Send success response
    return res.json({
      error: false,
      message: "Supplier details updated successfully",
      data: dataToUpdate,
    });
  } catch (error) {
    console.error("Error updating tax details:", error);
    return res.status(500).json({
      error: true,
      message: "Something went wrong",
    });
  }
};

*/

AWS.config.update({
  accessKeyId: constants.aws.accessKey,
  secretAccessKey: constants.aws.secret,
  region: constants.aws.region, // e.g., 'us-east-1'
});

const uploadFileToS3 = async (file, fname) => {
  // console.log(file);
  const s33 = new AWS.S3();
  const bucketName = constants.s3Creds.bucket;
  const fileStream = Buffer.from(file.data, "binary");

  const uploadParams = {
    Bucket: bucketName,
    Key: "content-server/" + fname, // Name of the file in the bucket
    Body: fileStream,
  };

  s33.upload(uploadParams, (err, data) => {
    if (err) {
      console.error("Error uploading file:", err);
    } else {
      console.log("File uploaded successfully. Location:", data.Location);
    }
  });
};

const updateTaxDetails = async (req, res) => {
  const supplierId = req.body.supplierId;
  const msmeImage = req.files.msmeImage;
  const gstImage = req.files.gstImage;
  const cancelledChequeImage = req.files.cancelledChequeImage;
  const panCardImage = req.files.panCardImage;
  const otherAttachments = req.files.otherAttachments;
  const pfAttachment = req.files.pfAttachment;

  let Record;
  const updateDocuments = {};
  const oldDocuments = {};

  if (supplierId) {
    const getRecord = await knex("tax_details")
      .where({ company_id: supplierId })
      .select()
      .first();

    if (!getRecord) {
      return res.status(404).json({
        error: true,
        message: "Supplier does not exist",
      });
    }

    Record = getRecord;

    // console.log("getTime:=", new Date().getTime());
    // console.log("getRecord:=", getRecord);

    if (msmeImage) {
      let nameOfFile;
      nameOfFile = new Date().getTime() + "-" + msmeImage.name;
      const getMyId = await knex("tax_details")
        .where("company_id", supplierId)
        .first();
      const updationDataIs = await functions.takeSnapShot(
        "tax_details",
        getMyId.id
      );
      const updatename = await knex("tax_details")
        .where({ company_id: supplierId })
        .update({ msmeImage: nameOfFile });
      uploadFileToS3(msmeImage, nameOfFile);

      updateDocuments.msmeImage = nameOfFile;
      oldDocuments.msmeImage = Record.msmeImage;
      if (supplierId) {
        const modifiedByTable1 = await functions.SetModifiedBy(
          req.headers["authorization"],
          "tax_details",
          "company_id",
          supplierId
        );
        // console.log("isUpdated:-", modifiedByTable1);
      }
    }

    if (gstImage) {
      let nameOfFile1;
      nameOfFile1 = new Date().getTime() + "-" + gstImage.name;
      const getMyId = await knex("tax_details")
        .where("company_id", supplierId)
        .first();
      const updationDataIs = await functions.takeSnapShot(
        "tax_details",
        getMyId.id
      );
      const updatename = await knex("tax_details")
        .where({ company_id: supplierId })
        .update({ gstImage: nameOfFile1 });
      uploadFileToS3(gstImage, nameOfFile1);

      updateDocuments.gstImage = nameOfFile1;
      oldDocuments.gstImage = Record.gstImage;
      if (supplierId) {
        const modifiedByTable1 = await functions.SetModifiedBy(
          req.headers["authorization"],
          "tax_details",
          "company_id",
          supplierId
        );
        // console.log("isUpdated:-", modifiedByTable1);
      }
    }

    if (cancelledChequeImage) {
      let nameOfFile2;
      nameOfFile2 = new Date().getTime() + "-" + cancelledChequeImage.name;
      const getMyId = await knex("tax_details")
        .where("company_id", supplierId)
        .first();
      const updationDataIs = await functions.takeSnapShot(
        "tax_details",
        getMyId.id
      );
      const updatename = await knex("tax_details")
        .where({ company_id: supplierId })
        .update({ cancelledChequeImage: nameOfFile2 });
      uploadFileToS3(cancelledChequeImage, nameOfFile2);

      updateDocuments.cancelledChequeImage = nameOfFile2;
      oldDocuments.cancelledChequeImage = Record.cancelledChequeImage;
      if (supplierId) {
        const modifiedByTable1 = await functions.SetModifiedBy(
          req.headers["authorization"],
          "tax_details",
          "company_id",
          supplierId
        );
        // console.log("isUpdated:-", modifiedByTable1);
      }
    }

    if (panCardImage) {
      let nameOfFile4;
      nameOfFile4 = new Date().getTime() + "-" + panCardImage.name;
      const getMyId = await knex("tax_details")
        .where("company_id", supplierId)
        .first();
      const updationDataIs = await functions.takeSnapShot(
        "tax_details",
        getMyId.id
      );
      const updatename = await knex("tax_details")
        .where({ company_id: supplierId })
        .update({ panCardImage: nameOfFile4 });
      uploadFileToS3(panCardImage, nameOfFile4);

      updateDocuments.panCardImage = nameOfFile4;
      oldDocuments.panCardImage = Record.panCardImage;
      if (supplierId) {
        const modifiedByTable1 = await functions.SetModifiedBy(
          req.headers["authorization"],
          "tax_details",
          "company_id",
          supplierId
        );
        // console.log("isUpdated:-", modifiedByTable1);
      }
    }

    if (otherAttachments) {
      let nameOfFile5;
      nameOfFile5 = new Date().getTime() + "-" + otherAttachments.name;
      const getMyId = await knex("tax_details")
        .where("company_id", supplierId)
        .first();
      const updationDataIs = await functions.takeSnapShot(
        "tax_details",
        getMyId.id
      );
      const updatename = await knex("tax_details")
        .where({ company_id: supplierId })
        .update({ otherAttachments: nameOfFile5 });
      uploadFileToS3(otherAttachments, nameOfFile5);

      updateDocuments.otherAttachments = nameOfFile5;
      oldDocuments.otherAttachments = Record.otherAttachments;
      if (supplierId) {
        const modifiedByTable1 = await functions.SetModifiedBy(
          req.headers["authorization"],
          "tax_details",
          "company_id",
          supplierId
        );
        // console.log("isUpdated:-", modifiedByTable1);
      }
    }

    if (pfAttachment) {
      let nameOfFile6;
      nameOfFile6 = new Date().getTime() + "-" + pfAttachment.name;
      const getMyId = await knex("tax_details")
        .where("company_id", supplierId)
        .first();
      const updationDataIs = await functions.takeSnapShot(
        "tax_details",
        getMyId.id
      );
      const updatename = await knex("tax_details")
        .where({ company_id: supplierId })
        .update({ pfAttachment: nameOfFile6 });
      uploadFileToS3(pfAttachment, nameOfFile6);

      updateDocuments.pfAttachment = nameOfFile6;
      oldDocuments.pfAttachment = Record.pfAttachment;
      if (supplierId) {
        const modifiedByTable1 = await functions.SetModifiedBy(
          req.headers["authorization"],
          "tax_details",
          "company_id",
          supplierId
        );
        // console.log("isUpdated:-", modifiedByTable1);
      }
    }
  }
  if (supplierId) {
    const modifiedByTable1 = await functions.SetModifiedBy(
      req.headers["authorization"],
      "tax_details",
      "company_id",
      supplierId
    );
    // console.log("isUpdated:-", modifiedByTable1);
  }
  //storing values to supplier_logs table....

  const getSupplierDetails = await knex("supplier_details")
    .where({ id: Record.company_id })
    .first();
  const timestamp = knex.fn.now();
  const LogSupplier = await supplierLogs.logFunction(
    getSupplierDetails.id,
    getSupplierDetails.gstNo,
    getSupplierDetails.panNo,
    getSupplierDetails.supplier_name,
    getSupplierDetails.emailID,
    "replied",
    timestamp,
    getSupplierDetails.supplier_name,
    "document(s) updated",
    JSON.stringify(updateDocuments),
    JSON.stringify(oldDocuments)
  );

  // console.log("LogSupplier:", LogSupplier);

  //storing values to supplier_logs table over ...

  return res.status(200).json({
    error: false,
    message: "Supplier updated successfully",
  });
};

const getIdFromGstNo = async (req, res) => {
  try {
    const { error, value } = validation.getIdFromGstNo(req.params);

    if (error) {
      return res.status(400).json({
        error: true,
        message: error.details[0].message,
      });
    }

    const { gstNo } = value;
    const getId = await knex("supplier_details")
      .where({ gstNo: gstNo })
      .select("id")
      .first();

    if (!getId) {
      return res.status(404).json({
        error: true,
        message: "Supplier does not exist",
      });
    }

    return res.status(200).json({
      error: false,
      message: "Supplier found",
      data: getId,
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: "could not fetch record",
      data: JSON.stringify(error),
    });
  }
};

const getIdFromPanNo = async (req, res) => {
  try {
    const { error, value } = validation.getIdFromPanNo(req.params);

    if (error) {
      return res.status(400).json({
        error: true,
        message: error.details[0].message,
      });
    }

    const { panNo } = value;
    const getId = await knex("supplier_details")
      .where({ panNo: panNo })
      .select("id")
      .first();

    if (!getId) {
      return res.status(404).json({
        error: true,
        message: "Supplier does not exist",
      });
    }

    return res.status(200).json({
      error: false,
      message: "Supplier found",
      data: getId,
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: "could not fetch record",
      data: JSON.stringify(error),
    });
  }
};

const exportToExcel = async (req, res) => {
  try {
    const tableName = "supplier_details";
    const { error, value } = validation.exportToExcel(req.body);
    if (error) {
      return res.status(400).json({
        error: true,
        message: error.details[0].message,
        data: error,
      });
    }

    const { order, sort, status, filter, supplier_ids, user_id } = value;

    let results = knex
      .select(
        "supplier_details.*",
        "business_details.*",
        "financial_details.*",
        "tax_details.*"
      )
      .from("supplier_details")
      .leftJoin(
        "business_details",
        "supplier_details.id",
        "business_details.company_id"
      )
      .leftJoin(
        "financial_details",
        "supplier_details.id",
        "financial_details.company_id"
      )
      .leftJoin("tax_details", "supplier_details.id", "tax_details.company_id");
    // Apply filter conditions
    if (filter) {
      const { startDate, endDate, dateField } = filter;
      if (startDate && endDate && dateField) {
        const startDateISO = new Date(startDate).toISOString();
        const endDateISO = new Date(endDate + "T23:59:59.999Z").toISOString();

        if (dateField === "created_at") {
          results.whereBetween("supplier_details.created_at", [
            startDateISO,
            endDateISO,
          ]);
        } else if (dateField === "updated_at") {
          results.whereBetween("supplier_details.updated_at", [
            startDateISO,
            endDateISO,
          ]);
        }
      }
    }

    if (status !== "all") {
      results.where("supplier_details.status", status);
    }
    if (supplier_ids) {
      results.whereIn("supplier_details.id", supplier_ids);
    }

    if (user_id) {
      const id = `[${user_id}]`;
      const select = await knex("approvers2")
        .select("department_id", "portal_code")
        .whereRaw("JSON_CONTAINS(level_1_user_id, ?)", id);

      const department_id = select[0].department_id;
      const department = select[0].portal_code;
      // console.log(department_id, department);
      results.where({ department_id: department_id, department: department });
    }

    results = results.orderBy(`${tableName}.${sort}`, order);
    let data_rows = await results;

    data_rows = await Promise.all(
      data_rows.map(async (row) => {
        const msmeType = await knex("minority_indicator")
          .select("description")
          .where("id", row.msmeType)
          .first();
        const companyType = await knex("company_types")
          .where("id", row.companyType)
          .select("name")
          .first();
        const businessType = await knex("business_types")
          .select("name")
          .where("id", row.businessType)
          .first();
        const listOfMajorCustomers = await knex("major_customer")
          .where("id", row.listOfMajorCustomers)
          .select("name")
          .first();
        const MajorOrder = await knex("major_order")
          .where("id", row.detailsOfMajorLastYear)
          .select("name")
          .first();
        const deapartmentName = await knex("approvers2")
          .select("portal_code")
          .where("department_id", row.department_id)
          .first();
        const sourceName = await knex("company_source")
          .where("id", row.source)
          .select("name")
          .first();
        const paymentMethod = await knex("payment_types")
          .where("id", row.paymentMethod)
          .select("name")
          .first();
        const getCurrencyName = await knex("currencies")
          .where("id", row.currency)
          .select("name")
          .first();

        row.msmeType = msmeType ? msmeType.description : "";
        row.businessType = businessType ? businessType.name : "";
        row.companyType = companyType ? companyType.name : "";
        row.listOfMajorCustomers = listOfMajorCustomers
          ? listOfMajorCustomers.name
          : "";
        row.detailsOfMajorLastYear = MajorOrder ? MajorOrder.name : "";
        row.department_id = deapartmentName ? deapartmentName.portal_code : "";
        row.source = sourceName ? sourceName.name : "";
        row.paymentMethod = paymentMethod ? paymentMethod.name : "";
        row.currency = getCurrencyName ? getCurrencyName.name : "";
        const getStateName = await knex("states")
          .where("stateKey", row.state)
          .where("countryKey", row.country)
          .select("stateDesc")
          .first();
        row.state = getStateName ? getStateName.stateDesc : "";
        const Delete = [
          "msmeImage",
          "gstImage",
          "cancelledChequeImage",
          "panCardImage",
          "pfAttachment",
          "otherAttachments",
          "password",
          "company_id",
          "id",
        ];
        for (const key of Delete) {
          delete row[key];
        }
        return row;
      })
    );
    // console.log(data_rows.length);
    const filePath = await functions.generateUniqueFilePath("supplier.xlsx");
    const excelContent = functions.generateExcelContent(data_rows);

    // Set headers for file download
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${path.basename(filePath)}"`
    );

    res.send(excelContent);
    // console.log(`Data exported successfully.`);
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      error: true,
      message: "Unable to export data",
      data: JSON.stringify(error.message),
    });
  }
};

const paginateSupplierLogs = async (req, res) => {
  try {
    const tableName = "supplier_logs";
    const searchFrom = ["supplierName", "gstNo", "panNo"];
    const { error, value } = validation.paginateSupplierLogs(req.body);
    if (error) {
      return res.status(400).json({
        error: true,
        message: error.details[0].message,
        data: error,
      });
    }

    let total = 0;

    let { offset, limit, order, sort, search, status } = value;
    let results = knex(tableName);
    if (status != undefined && status != "") {
      total = results.where("status", status);
    }
    results = results.where(function () {
      if (search != undefined && search != "") {
        searchFrom.forEach((element) => {
          this.orWhereILike(element, `%${search}%`);
        });
      }
    });
    total = await results.count("id as total").first();
    let rows = knex(tableName);

    if (status != undefined && status != "") {
      rows.where("status", status);
    }
    rows = rows.where(function () {
      if (search != undefined && search != "") {
        searchFrom.forEach((element) => {
          this.orWhereILike(element, `%${search}%`);
        });
      }
    });
    rows = await rows.orderBy(sort, order).limit(limit).offset(offset);
    let data_rows = [];
    if (order === "desc") {
      let sr = offset + 1;
      await rows.forEach((row) => {
        row.sr = sr;
        delete row.password;
        data_rows.push(row);
        sr++;
      });
    } else {
      let sr = total.total - limit * offset;
      await rows.forEach((row) => {
        row.sr = sr;
        delete row.password;
        data_rows.push(row);
        sr--;
      });
    }
    return res.status(200).json({
      error: false,
      message: "retrieved successfully.",
      data: {
        rows: data_rows,
        total: total.total,
      },
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: "could not load record",
      data: JSON.stringify(error),
    });
  }
};

const bulkDeleteSuppliers = async (req, res) => {
  try {
    const { error, value } = validation.bulkDeleteSuppliers(req.body);

    if (error) {
      return res.status(400).json({
        error: true,
        message: error.details[0].message,
      });
    }

    const { ids } = value;
    const deleteErrors = [];
    const deleteMessages = [];
    let selectedCount = 0;

    for (const id of ids) {
      const getPendingRejectedList = await knex("supplier_details")
        .where("id", id)
        .whereIn("status", ["pending", "rejected"])
        .first();
      if (!getPendingRejectedList) {
        selectedCount += 1;
      }
    }

    if (selectedCount > 0) {
      return res
        .status(409)
        .json({
          error: true,
          message: `Please only select pending or rejected supplier`,
        })
        .end();
    }

    for (const id of ids) {
      try {
        const getEmailOfSupplier = await knex("supplier_details")
          .where("id", id)
          .select("emailID")
          .first();

        if (!getEmailOfSupplier) {
          deleteErrors.push(`Supplier with ID ${id} does not exist`);
          continue;
        }

        //////////////////////delete s3 bucket files//////////////////////

        const checkSupplierTaxDetails = await knex("tax_details")
          .where("company_id", id)
          .first();

        if (!checkSupplierTaxDetails) {
          deleteErrors.push(
            `Supplier with ID ${id} does not exist in tax details`
          );
          continue;
        }

        const {
          msmeImage: msmeImageFile,
          gstImage: gstImageFile,
          cancelledChequeImage: cancelledChequeImageFile,
          panCardImage: panCardImageFile,
          pfAttachment: pfAttachmentFile,
          otherAttachments: otherAttachmentsFile,
        } = checkSupplierTaxDetails;

        const fileNames = [
          msmeImageFile,
          gstImageFile,
          cancelledChequeImageFile,
          panCardImageFile,
          pfAttachmentFile,
          otherAttachmentsFile,
        ];

        for (const fileName of fileNames) {
          if (fileName) {
            await functions.deleteObjectFromBucket(
              "content-server/" + fileName
            );
          }
        }

        /////////////////////delete s3 bucket files over//////////////////

        const check_supplier = await knex("supplier_details")
          .where("id", id)
          .whereIn("status", ["pending", "rejected"])
          .first();

        if (!check_supplier) {
          deleteErrors.push(`Supplier with ID ${id} could not be deleted`);
          continue;
        }

        await knex("supplier_details")
          .where("id", id)
          .whereIn("status", ["pending", "rejected"])
          .delete();

        // Delete supplier from additional details
        await functions.deleteData("supplier_additional_fields", id, "123");

        // Delete supplier email from users table
        if (
          !["admin@gmail.com", "sap@user.com"].includes(
            getEmailOfSupplier.emailID
          )
        ) {
          await knex("users")
            .where("email", getEmailOfSupplier.emailID)
            .delete();
        }

        deleteMessages.push(`Supplier with ID ${id} deleted successfully`);
      } catch (error) {
        deleteErrors.push(
          `Error deleting supplier with ID ${id}: ${error.message}`
        );
      }
    }

    // return res.json({
    //   error: deleteErrors.length > 0,
    //   messages: deleteMessages,
    //   errors: deleteErrors,
    // });

    return res.status(200).json({
      error: false,
      messages: "deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: "Can't delete suppliers",
      data: JSON.stringify(error),
    });
  }
};

const deleteMultiple = async (req, res) => {
  try {
    const { error, value } = validation.deleteMultiple(req.body);
    if (error) {
      return res.status(400).json({
        error: true,
        message: error.details[0].message,
      });
    }

    const { ids } = value;
    for (const id of ids) {
      const getStatus = await knex("supplier_details")
        .where("id", id)
        .select("status")
        .first();
      // console.log("getStatus:", getStatus);
      if (getStatus.status == "pending" || getStatus.status == "rejected") {
        const deletedStatus = await knex("supplier_details")
          .where("id", id)
          .delete();
      }
      // console.log("deleteStatus:", deletedStatus);
    }

    return res.status(200).json({
      error: false,
      message: "Multiple suppliers deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: "Can't delete suppliers",
      data: JSON.stringify(error),
    });
  }
};

const makeActive = async (req, res) => {
  try {
    const { error, value } = validation.makeActive(req.body);
    if (error) {
      return res.status(400).json({
        error: true,
        message: error.details[0].message,
      });
    }

    const { id } = value;
    const getStatus = await knex("supplier_details")
      .where("id", id)
      .select("status", "sap_code")
      .first();

    if (!getStatus) {
      return res.status(404).json({
        error: true,
        message: "Supplier not found",
      });
    }

    if (getStatus.status == "approved") {
      return res.status(404).json({
        error: true,
        message: "Supplier is already active",
      });
    }

    const setStatus = await knex("supplier_details").where("id", id).update({
      status: "approved",
    });

    if (!setStatus) {
      return res.status(409).json({
        error: false,
        message: "Supplier can't activated",
      });
    }
    return res.status(200).json({
      error: false,
      message: "Supplier activated successfully",
      data: id,
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: "Can't delete suppliers",
      data: JSON.stringify(error),
    });
  }
};

const sendSlugLink = async (req, res) => {
  const { error, value } = validation.sendSlugLink(req.body);
  if (error) {
    return res.status(400).json({
      error: true,
      message: error.details[0].message,
      data: error,
    });
  }
  let { email, slugType, departmentId } = value;

  const checkDepartmentSlug = await knex("approverTest")
    .where("departmentId", departmentId)
    .where("level", "1")
    .first();

  if (!checkDepartmentSlug) {
    return res.status(400).json({
      error: true,
      message: "Please asign approver first to selected Department",
      data: null,
    });
  }

  //check departmentId is exist or not
  const checkDepartmentId = await knex("departments")
    .where("id", departmentId)
    .first();
  if (!checkDepartmentId) {
    return res.status(400).json({
      error: true,
      message: "Department doesn't exist",
      data: null,
    });
  }
  let selectedSlug;
  let finalSlug;
  if (slugType == "domestic") {
    //select domestic slug and send email.
    selectedSlug = await knex("departments")
      .where("id", departmentId)
      .select("slug")
      .first();
    finalSlug = selectedSlug.slug;
  } else {
    //select international slug and send email.
    selectedSlug = await knex("departments")
      .where("id", departmentId)
      .select("slugInternational")
      .first();
    finalSlug = selectedSlug.slugInternational;
  }

  console.log("selectedSlug:-", finalSlug);

  const registrationLink = `${constants.admindetails.registratonUrl}/${finalSlug}`;

  //send email process...
  const emailbody = `<table style="width:100%; border:solid orange 1px; padding:10px;">
<tr>
    <td style="width:25%;"></td>
    <td>
<p>Hello,<br><br>
Welcome to ${constants.admindetails.companyShortName}!<br><br>
Your registration link is:<a href="${registrationLink}"> ${registrationLink} </a> <br> Please click the link and complete the registration process.</p>
<p>Regards,<br><b>${constants.admindetails.companyShortName}</b></p>
<p>&nbsp;</p>
<p><center>${constants.admindetails.address1},${constants.admindetails.address2},${constants.admindetails.state}, ${constants.admindetails.country}<br><img style='max-width:80px;' src="${constants.admindetails.companyLogo}"/><br>
Powered by Aeonx.digital<br>
Note: Do not reply this email. This is auto-generated email.
</center></p>
</td>
    <td style="width:25%;"></td>
</tr>
</table>`;

  const emailSent = ses.sendEmail(
    "noreply@supplierx.aeonx.digital",
    email,
    "Registration Link",
    emailbody
  );

  return res.status(200).json({
    error: false,
    message: "Registration link sent successfully",
    data: null,
  });
};

const sendSlugLink_old = async (req, res) => {
  try {
    const { error, value } = validation.sendSlugLink(req.body);
    if (error) {
      return res.status(400).json({
        error: true,
        message: error.details[0].message,
        data: error,
      });
    }

    let { email, slug, approverId } = value;
    if (slug == null || slug == "") {
      if (approverId == null && approverId == "") {
        return res.status(400).json({
          error: true,
          message: "Approver is Invalid",
          data: null,
        });
      }

      const getDepartmentId = await knex("approverTest")
        .where("departmentId", approverId)
        .first();
      if (!getDepartmentId) {
        return res.status(400).json({
          error: true,
          message: "Approver is Invalid",
          data: null,
        });
      }

      const getSlug = await knex("departments")
        .where("id", getDepartmentId.departmentId)
        .select("slug")
        .first();
      if (!getSlug) {
        return res.status(400).json({
          error: true,
          message: "Invalid department",
          data: null,
        });
      }
      slug = getSlug.slug;
    } else {
      //check slug and it's department - weather it has approver or not

      const getDeptId = await knex("departments")
        .where("slug", slug)
        .andWhere("isDeleted", "0")
        .select("id")
        .first();

      if (!getDeptId) {
        return res.status(500).json({
          error: true,
          message: "Invalid department",
        });
      }

      const getUserIds2 = await knex("approverTest")
        .where("departmentId", getDeptId.id)
        .andWhere("level", "1")
        .select("userId")
        .first();

      console.log("userId:-", getUserIds2);

      if (!getUserIds2) {
        return res.status(404).json({
          error: true,
          message:
            "No approver found for the selected department, please insert first",
        });
      }

      //check slug and it's department - weather it has approver or not - over.
    }

    const registrationLink = `${constants.admindetails.registratonUrl}/${slug}`;

    //send email process...
    const emailbody = `<table style="width:100%; border:solid orange 1px; padding:10px;">
<tr>
    <td style="width:25%;"></td>
    <td>
<p>Hello,<br><br>
Welcome to ${constants.admindetails.companyShortName}!<br><br>
Your registration link is:<a href="${registrationLink}"> ${registrationLink} </a> <br> Please click the link and complete the registration process.</p>
<p>Regards,<br><b>${constants.admindetails.companyShortName}</b></p>
<p>&nbsp;</p>
<p><center>${constants.admindetails.address1},${constants.admindetails.address2},${constants.admindetails.state}, ${constants.admindetails.country}<br><img style='max-width:80px;' src="${constants.admindetails.companyLogo}"/><br>
Powered by Aeonx.digital<br>
Note: Do not reply this email. This is auto-generated email.
</center></p>
</td>
    <td style="width:25%;"></td>
</tr>
</table>`;

    const emailSent = ses.sendEmail(
      "noreply@supplierx.aeonx.digital",
      email,
      "Registration Link",
      emailbody
    );
    console.log("email sent result:", emailSent);

    return res
      .status(200)
      .json({
        error: false,
        message: "Email sent successfully",
      })
      .end();
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: "Could not send email",
      data: JSON.stringify(error.message),
    });
  }
};

const slugToDepartment = async (req, res) => {
  const { error, value } = validation.slugToDepartment(req.params);
  if (error) {
    return res.status(400).json({
      error: true,
      message: error.details[0].message,
      data: error,
    });
  }

  const { slug } = value;

  if (slug == "general") {
    const getDeptName = await knex("departments")
      .where("slugInternational", slug)
      .orWhere("slug", slug)
      .select("name", "id")
      .first();

    if (!getDeptName) {
      return res.status(400).json({
        error: true,
        message: "Invalid Link",
        data: null,
      });
    }

    return res.status(200).json({
      error: false,
      message: "Welcome to registration process",
      data: getDeptName,
      department_type: slug,
    });
  } else {
    //check slug from db...
    const getDeptName = await knex("departments")
      .where("slug", slug)
      .orWhere("slugInternational", slug)
      .select("name", "id")
      .first();

    if (!getDeptName) {
      return res.status(400).json({
        error: true,
        message: "Invalid Link",
        data: null,
      });
    }

    //checking type

    let slugString = slug;
    const slugStringPart = slugString.substring(0, 1);

    if (slugStringPart == "i") {
      slugString = "international";
    } else if (slugStringPart == "d") {
      slugString = "domestic";
    }

    //checking type - over
    return res.status(200).json({
      error: false,
      message: "Welcome to registration process",
      data: getDeptName,
      department_type: slugString,
    });
  }
};

/*
const slugToDepartment_old = async (req, res) => { 
  // try {
    const { error, value } = validation.slugToDepartment(req.params);

    if (error) {
      return res.status(400).json({
        error: true,
        message: error.details[0].message,
        data: error,
      });
    }

    const { slug } = value;

    let slugString = slug;
    const slugStringPart = slugString.substring(0, 1);

    if (slugStringPart == "i") {
      slugString = "international";
    } else if (slugStringPart == "d") {
      slugString = "domestic";
    } else if(slugStringPart == "g"){
      slugString = "general";
    }

    console.log("SlugString:-", slugString);

    let getDepartmentDetails;

    if(slugString == "domestic"){

     getDepartmentDetails = await knex("departments")
      .where("slug", slug)
      .select("id", "name")
      .first();
    if (!getDepartmentDetails) {
      return res.status(400).json({
        error: true,
        message: "Given registration link is invalid",
        data: null,
      });
    }
  }else if(slugString == "international"){
    const getDepartmentDetails = await knex("departments")
      .where("slugInternational", slug)
      .select("id", "name")
      .first();
    if (!getDepartmentDetails) {
      return res.status(400).json({
        error: true,
        message: "Given registration link is invalid",
        data: null,
      });
    }
  }else if(slugString == "general"){
    const getDepartmentDetails = await knex("departments")
    .where("slugInternational", slug)
    .select("id", "name")
    .first();
  if (!getDepartmentDetails) {
    return res.status(400).json({
      error: true,
      message: "Given registration link is invalid",
      data: null,
    });
  }
  }

    return res.status(200).json({
      error: false,
      message: "Welcome to registration process",
      data: getDepartmentDetails,
      department_type: slugString,
    });
  // } catch (error) {
  //   return res.status(500).json({
  //     error: true,
  //     message: "Could not register",
  //     data: JSON.stringify(error.message),
  //   });
  // }
};

*/

const dynamicStatusChange = async (req, res) => {
  try {
  const token = req.headers["authorization"];
  if (!token) {
    return res.status(400).json({
      error: true,
      message: "Token is required.",
    });
  }

  const { jwtConfig } = constants;
  const payload = jwt.decode(token.split(" ")[1], jwtConfig.secret);
  const statusChanger = payload.permissions[0];
  const statusChangerId = payload.id;
  const { error, value } = validation.dynamicStatusChange(req.body);
  if (error) {
    return res
      .status(400)
      .json({
        error: true,
        message: error.details[0].message,
      })
      .end();
  }

  const { supplierId, status, comment, isEditable } = value;
  const checkSuppIdExist = await knex("supplier_details")
    .where({
      id: supplierId,
    })
    .first();
  if (!checkSuppIdExist) {
    return res
      .status(404)
      .json({
        error: true,
        message: "Supplier does not exist",
      })
      .end();
  }

  const getDepId = await knex("supplier_details")
    .where({ id: supplierId })
    .select("department_id")
    .first();

  if (!getDepId) {
    return res
      .status(400)
      .json({
        error: true,
        message: "This supplier has not selected a department.",
      })
      .end();
  }
  const depId = getDepId.department_id;

  const getLevel = await knex("approverTest")
    .where({ userId: statusChangerId })
    .andWhere({ departmentId: depId })
    .select("level")
    .first();
  if (!getLevel) {
    return res
      .status(500)
      .json({
        error: true,
        message: "This logged-in user is not assigned to any departments yet",
      })
      .end();
  }

  console.log("first", depId);

  const checkApproverForThatDep = await knex("approverTest")
    .where({ departmentId: depId })
    .select("level");

  console.log("second", checkApproverForThatDep);

  if (checkApproverForThatDep.length <= 0) {
    return res
      .status(500)
      .json({
        error: true,
        message: "Approver is not of this department",
      })
      .end();
  }

  const maxLevelQuery = await knex("approverTest")
    .where({ departmentId: depId })
    .max("level as maxLevel")
    .first();

  const maxLevel = maxLevelQuery.maxLevel;

  // Check if the status at the current level is finalized
  const existingApprovalOrRejection = await knex("approversLogsTest")
    .where({ supplierId: supplierId, level: getLevel.level })
    .whereIn("status", ["approved", "rejected", "verified"])
    .first();

  if (existingApprovalOrRejection && status !== "queried") {
    return res.status(409).json({
      error: true,
      message:
        "The status has already been finalized by another approver at this level and cannot be changed again.",
    });
  }

  const isLevelAuthorized = checkApproverForThatDep.some(
    (approver) => approver.level === getLevel.level
  );
  const checkPreviousLevel = await knex("approversLogsTest")
    .where({
      supplierId: supplierId,
      level: getLevel.level - 1,
    })
    .andWhere("status", "verified") // Ensure the previous level is verified
    .first();

  if (getLevel.level != 1 && !checkPreviousLevel) {
    return res
      .status(500)
      .json({
        error: true,
        message:
          "The status cannot be approved because it was not verified at the previous level.",
      })
      .end();
  }

  if (isLevelAuthorized) {
    if (status === "queried") {
      let approverLogId;

      const existingApprovalOrRejection = await knex("approversLogsTest")
        .where({
          supplierId: supplierId,
          level: getLevel.level,
          approverId: statusChangerId,
        })
        .whereIn("status", ["approved", "rejected", "verified"])
        .first();

      if (existingApprovalOrRejection) {
        return res.json({
          error: true,
          message:
            "The status has already been approved, rejected, verified, or queried by this approver at this level and cannot be changed again",
        });
      }

      const existingEntry = await knex("approversLogsTest")
        .where({ supplierId: supplierId, status: status })
        .first();

      if (existingEntry) {
        approverLogId = existingEntry.id;

        await knex("approversLogsTest").where({ id: approverLogId }).update({
          level: getLevel.level,
          approverId: statusChangerId,
          comment: comment,
          isEditable: isEditable,
        });
      } else {
        [approverLogId] = await knex("approversLogsTest")
          .insert({
            supplierId: supplierId,
            status: status,
            level: getLevel.level,
            approverId: statusChangerId,
            comment: comment,
            isEditable: isEditable,
          })
          .returning("id");
      }

      await knex("queriedTimeline").insert({
        timelineId: approverLogId,
        supplierId: supplierId,
        query: comment,
        approverId: statusChangerId,
        level: getLevel.level,
      });

      try {
        await logs.logOldValues(
          "queriedTimeline",
          "INSERT",
          "",
          {
            timelineId: approverLogId,
            supplierId: supplierId,
            query: comment,
            approverId: statusChangerId,
            level: getLevel.level,
          },
          req
        );
      } catch (error) {
        console.log(error);
      }

      const statusChangeInSd = await knex("supplier_details")
        .where({ id: supplierId })
        .update("status", status);

      const emailstatus = status;

      console.log("supp", checkSuppIdExist);
      const getUserName = await knex("users")
        .where({ id: statusChangerId })
        .first();
      console.log("user detail", getUserName);

      const email = checkSuppIdExist.emailID;
      const firstname = getUserName.firstname;
      const lastname = getUserName.lastname;
      const suppliername = checkSuppIdExist.supplier_name;

      //send - email - 1

      const emailBody = `<table style="border:1px solid orange; width:100%;">
    <tr>
        <td style="width:25%;">
        </td>
        <td><p>
           Hello ${suppliername},<br>
           Your application is queried by our approver ${firstname} ${lastname}.</p>
           <p>Comment is: ${comment}</p>
           <p>Please give replay by login our portal <a href="${constants.admindetails.homePageUrl}login">${constants.admindetails.homePageUrl}login</a></p>
           <p>Regards,<br>${constants.admindetails.companyFullName}</p>
           <p>
           <center>${constants.admindetails.address1} <br> ${constants.admindetails.address2} ${constants.admindetails.state} ${constants.admindetails.country}<br><img style="width:80px" src="${constants.admindetails.companyLogo}"><br>
  Powered by ${constants.admindetails.companyShortName}<br>
  Note: Do not reply this email. This is auto-generated email.
        </center>
        </p>
        </td>
        <td style="width:25%;">
        </td>
    </tr>
</table>`;

      ses.sendEmail(
        "noreply@supplierx.aeonx.digital",
        email,
        "Your application is queried",
        emailBody
      );

      return res.json({
        error: false,
        message: `Supplier is ${status} successfully`,
      });
    } else {
      if (status === "approved" && getLevel.level !== maxLevel) {
        return res.status(403).json({
          error: true,
          message: "Only the last level approver can approve the status.",
        });
      }

      const existingApprovalOrRejection = await knex("approversLogsTest")
        .where({
          supplierId: supplierId,
          level: getLevel.level,
          approverId: statusChangerId,
        })
        .whereIn("status", ["approved", "rejected", "verified"])
        .first();

      if (existingApprovalOrRejection) {
        return res.status(409).json({
          error: true,
          message:
            "The status has already been approved, rejected, verified, or queried by this approver at this level and cannot be changed again",
        });
      }

      const changeStatus = await knex("approversLogsTest").insert({
        supplierId: supplierId,
        status: status,
        level: getLevel.level,
        approverId: statusChangerId,
        comment: comment,
        isEditable: isEditable,
      });
      if (changeStatus.length <= 0) {
        return res
          .status(500)
          .json({
            error: true,
            message: "Unable to change supplier status",
          })
          .end();
      }

      const getSupplier = await knex("supplier_details")
        .where({
          id: supplierId,
        })
        .first();

      if (status === "verified") {
        const getSupplierRecord = await knex("supplier_details")
          .where({ id: supplierId })
          .first();

        if (!getSupplierRecord) {
          return res.status(404).json({
            error: true,
            message: "Supplier does not exist",
          });
        }

        const departmentId = getSupplierRecord.department_id;

        const getCurrentApproverLevel = await knex("approverTest")
          .where({ userId: statusChangerId, departmentId: departmentId })
          .select("level")
          .first();

        if (!getCurrentApproverLevel) {
          return res.status(404).json({
            error: true,
            message: "Current approver level not found",
          });
        }

        const currentLevel = getCurrentApproverLevel.level;

        // Fetch next approvers who are not at the current level and not at level 1
        const getNextApprovers = await knex("approverTest")
          .where({ departmentId: departmentId })
          .whereNot({ level: currentLevel })
          .whereNot({ level: 1 }) // Exclude level 1 if necessary
          .select("*");

        console.log(
          "Next approvers excluding current level:",
          getNextApprovers
        );

        // send emails to next approvers
      }

      const statusChangeInSd = await knex("supplier_details")
        .where({ id: supplierId })
        .update("status", status);

      //send email - 2

      const getUserName = await knex("users")
        .where({ id: statusChangerId })
        .first();
      console.log("user detail", getUserName);

      const email = checkSuppIdExist.emailID;
      const firstname = getUserName.firstname;
      const lastname = getUserName.lastname;
      const suppliername = checkSuppIdExist.supplier_name;

      const emailBody = `<table style="border:1px solid orange; width:100%;">
    <tr>
        <td style="width:25%;">
        </td>
        <td><p>
           Hello ${suppliername},<br>
           Congratulations!<br>
           Your application is approved by our approver ${firstname} ${lastname}.</p>
           <p>Regards,<br>${constants.admindetails.companyFullName}</p>
           <p>
           <center>${constants.admindetails.address1} <br> ${constants.admindetails.address2} ${constants.admindetails.state} ${constants.admindetails.country}<br><img style="width:80px" src="${constants.admindetails.companyLogo}"><br>
  Powered by ${constants.admindetails.companyShortName}<br>
  Note: Do not reply this email. This is auto-generated email.
        </center>
        </p>
        </td>
        <td style="width:25%;">
        </td>
    </tr>
</table>`;

      if(status == "approved"){
      ses.sendEmail(
        "noreply@supplierx.aeonx.digital",
        email,
        "Congratulations! Your application is approved",
        emailBody
      );
    }

      return res
        .status(200)
        .json({
          error: false,
          message: `Supplier is ${status} successfully`,
        })
        .end();
    }
  }
  } catch (error) {
    return res
      .status(500)
      .json({
        error: true,
        message: "Could not update status",
      })
      .end();
  }
};

const dynamicApproverTimeline = async (req, res) => {
  try {
    const { supplierId } = req.body;

    const checkTimeline = await knex("approversLogsTest").where({
      supplierId: supplierId,
    });
    const supplier = await knex("supplier_details")
      .where({ id: supplierId })
      .select("supplier_name")
      .first();

    if (!supplier) {
      return res.status(404).json({
        error: true,
        message: "Supplier does not exist",
      });
    }

    const getDepartmentId = await knex("supplier_details")
      .where({ id: supplierId })
      .select("department_id")
      .first();

    const deptId = getDepartmentId.department_id;
    const maxLevelQuery = await knex("approverTest")
      .where({ departmentId: deptId })
      .max("level as maxLevel")
      .first();

    const maxLevel = maxLevelQuery.maxLevel;
    console.log("this is max level", maxLevel);

    if (!checkTimeline || checkTimeline.length === 0) {
      return res.status(200).json({
        error: false,
        message: `No timeline currently available. You need to go through the ${maxLevel}-level approval process to initiate a timeline.`,
      });
    }

    const supplierName = supplier.supplier_name;

    const timeLine = await knex("approversLogsTest")
      .where({ supplierId: supplierId })
      .whereIn("status", ["approved", "rejected", "verified"])
      .select("*");

    const queryTimeline = await knex("queriedTimeline")
      .where({ supplierId: supplierId })
      .select("*");

    const checkInApproversLogsTest = await knex("approversLogsTest")
      .where({ supplierId: supplierId })
      .first();

    const isEditable = checkInApproversLogsTest
      ? checkInApproversLogsTest.isEditable
      : "0";

    const fetchUsernames = async (timeline) => {
      for (const iterator of timeline) {
        const getUserName = await knex("users")
          .where({ id: iterator.approverId })
          .select("username")
          .first();
        iterator.approverName = getUserName.username;
      }
    };

    await fetchUsernames(timeLine);
    await fetchUsernames(queryTimeline);

    const formattedTimeline = timeLine.map((item) => ({
      remarks: item.comment,
      approverId: item.approverId,
      approverName: item.approverName,
      supplierName: supplierName,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      status: item.status,
      level: item.level,
      approvedTime: item.approvedTime,
    }));

    const formattedQueryTimeline = queryTimeline.map((item) => ({
      remarks: item.query,
      approverId: item.approverId,
      approverName: item.approverName,
      supplierName: supplierName,
      respond: item.queryAnswer || "response pending",
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      status: "queried",
      level: item.level,
    }));

    const mergedTimelines = [...formattedQueryTimeline, ...formattedTimeline];
    mergedTimelines.sort((a, b) => a.level - b.level);

    return res.status(200).json({
      error: false,
      data: [
        {
          status: mergedTimelines,
          isEditable: isEditable,
          timeline: `You have to go through ${maxLevel} level of approval process!`,
          lastLevel: maxLevel,
        },
      ],
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: "Could not load timeline",
    });
  }
};

const supplierListForApproverWorkFlow = async (req, res) => {
  try {
    const tableName = "supplier_details";
    const token = req.headers["authorization"];

    if (!token) {
      return res.status(400).json({ error: true, message: "Token not found" });
    }

    const { jwtConfig } = constants;
    const payload = jwt.decode(token.split(" ")[1], jwtConfig.secret);
    const userId = payload.id;

    // Retrieve approver's department and level
    const approver = await knex("approverTest")
      .where({ userId })
      .select("departmentId", "level")
      .first();
    console.log("Approver details:", approver);

    if (!approver) {
      return res
        .status(500)
        .json({
          error: true,
          message: "This logged-in user is not assigned to any departments yet",
        })
        .end();
    }

    const { departmentId: deptId, level } = approver;
    console.log("Dep", deptId);

    const {
      offset = 0,
      limit,
      order = "desc",
      sort = "id",
      search = "",
      status = "all",
    } = req.body;

    let suppliers = [];
    let totalSuppliers = 0;

    if (level === 1) {
      const query = knex(tableName)
        .where({ department_id: deptId })
        .modify((queryBuilder) => {
          if (search) {
            queryBuilder.where("supplier_name", "like", `%${search}%`);
          }
          if (status !== "all") {
            queryBuilder.where("status", status);
          }
        });

      totalSuppliers = await query.clone().count({ count: "*" }).first();

      suppliers = await query
        .orderBy(sort, order)
        .offset(offset)
        .limit(limit)
        .select();
    } else {
      const allSuppliers = await knex(tableName)
        .where({ department_id: deptId })
        .modify((queryBuilder) => {
          if (search) {
            queryBuilder.where("supplier_name", "like", `%${search}%`);
          }
          if (status !== "all") {
            queryBuilder.where("status", status);
          }
        })
        .select();

      suppliers = [];

      for (const supplier of allSuppliers) {
        console.log(
          `Checking supplier: ${supplier.id} for level: ${level - 1}`
        );

        const previousLevelLog = await knex("approversLogsTest")
          .where({
            supplierId: supplier.id,
            level: level - 1,
          })
          .andWhere("status", "verified")
          .first()
          .debug(true);

        console.log(
          "Previous level log for supplier",
          supplier.id,
          ":",
          previousLevelLog
        );

        if (previousLevelLog) {
          suppliers.push(supplier);
        }
      }

      totalSuppliers = suppliers.length;
      suppliers = suppliers
        .sort((a, b) => {
          if (order === "asc") {
            return a[sort] > b[sort] ? 1 : -1;
          } else {
            return a[sort] < b[sort] ? 1 : -1;
          }
        })
        .slice(offset, offset + limit);
    }

    suppliers = suppliers.map((supplier, index) => ({
      sr_no: index + 1,
      ...supplier,
    }));

    if (suppliers.length === 0) {
      return res.status(404).json({
        error: false,
        message: "No supplier found",
        data: [],
        total: 0,
      });
    }

    return res.json({
      error: false,
      message: "Data retrieved successfully",
      data: suppliers,
      total: totalSuppliers.count || totalSuppliers,
    });
  } catch (error) {
    return res
      .status(500)
      .json({
        error: true,
        message: "Could not load records",
      })
      .end();
  }
};

// const supplierListForApproverWorkFlow = async (req, res) => {
//   try {
//     const tableName = "supplier_details";
//     const token = req.headers["authorization"];

//     // Validate token presence
//     if (!token) {
//       return res.status(400).json({ error: true, message: "Token not found" });
//     }

//     // Decode JWT token
//     const { jwtConfig } = constants;
//     const payload = jwt.decode(token.split(" ")[1], jwtConfig.secret);
//     const { id, role, role_id, permissions } = payload;
//     const roleName = permissions[0] ? permissions[0] : permissions;

//     // Joi schema for validation
//     const schema = Joi.object({
//       level: Joi.number().required(),
//       departmentId: Joi.string().required(),
//     });

//     // Validate request body
//     const { error, value } = schema.validate(req.body);
//     if (error) {
//       return res.status(400).json({
//         error: true,
//         message: error.details[0].message,
//         data: error,
//       });
//     }

//     const { level, departmentId: deptId } = value;

//     let suppliersQuery = knex(tableName).select(
//       "id",
//       "supplier_name",
//       "status",
//       "sap_code",
//       "department as registeryAuthority",
//       "department_id",
//       "aadharNo",
//       "pin",
//       "city",
//       "country",
//       "address1",
//       "address2",
//       "address3",
//       "streetNo",
//       "state",
//       "panNo",
//       "gstNo",
//       "emailID",
//       knex.raw("CONVERT_TZ(created_at, '+00:00', '+05:30') as created_at"),
//       knex.raw("CONVERT_TZ(updated_at, '+00:00', '+05:30') as updated_at")
//     ).where({ department_id: deptId });

//     // Logic for non-level-1 approvers
//     if (level !== 1) {
//       const allSuppliers = await suppliersQuery.clone().select('id');

//       const validSuppliers = [];
//       for (const supplier of allSuppliers) {
//         const previousLevelLog = await knex("approversLogsTest")
//           .where({
//             supplierId: supplier.id,
//             level: level - 1,
//           })
//           .andWhere("status", "verified")
//           .first();

//         if (previousLevelLog) {
//           validSuppliers.push(supplier);
//         }
//       }
//       suppliersQuery.whereIn('id', validSuppliers.map(s => s.id));
//     }

//     const total = await suppliersQuery.clone().count("id as total").first();

//     const suppliers = await suppliersQuery
//       .orderBy("created_at", "desc")
//       .limit(50) // Set limit as per your requirement
//       .offset(0) // Set offset as per your requirement
//       .then(data => {
//         if (data.length === 0) {
//           return res.status(200).json({
//             error: false,
//             message: "No suppliers available for approval at this level.",
//             data: [],
//           });
//         }
//         return data;
//       });

//     // Format supplier data
//     const formattedSuppliers = await Promise.all(
//       suppliers.map(async (supplier) => {
//         const getStateName = await knex("states")
//           .where("stateKey", supplier.state)
//           .where("countryKey", supplier.country)
//           .select("stateDesc")
//           .first();

//         supplier.state = getStateName ? getStateName.stateDesc : "";
//         return supplier;
//       })
//     );

//     return res.status(200).json({
//       error: false,
//       message: "Data retrieved successfully.",
//       data: formattedSuppliers,
//       total: total.total,
//     });

//   } catch (error) {
//     console.error("Error in supplierListForApproverWorkFlow:", error); // Log error details
//     return res.status(500).json({
//       error: true,
//       message: "Could not load records.",
//       data: JSON.stringify(error),
//     });
//   }
// };

export default {
  deleteMultiple,
  makeActive,
  paginateSupplierLogs,
  registerSupplier,
  updateSupplier,
  updateTaxDetails,
  checkIfEmailExist,
  sendOtp,
  listSupplier,
  changestatus,
  queriedSupplier,
  approvedSupplier,
  rejectedSupplier,
  verifySupplier,
  deactiveSupplier,
  changeStatusWithEmail,
  viewFieldsForSap,
  syncFromSap,
  deleteSupplier,
  supplierListForWorkflow,
  supplierChangeStatusList,
  supplierFilteredList,
  view,
  createMajorCustomer,
  majorCustomerList,
  createDetailsOfMajorOrder,
  detailsOfMajorOrderList,
  supplierValidation,
  createdSupplierList,
  pendingSupplierList,
  levelVerifeidList,
  updateTds,
  verifyOtp,
  getIdFromGstNo,
  getIdFromPanNo,
  exportToExcel,
  updateSupplierByAdmin,
  bulkDeleteSuppliers,
  sendSlugLink,
  slugToDepartment,
  dynamicStatusChange,
  dynamicApproverTimeline,
  supplierListForApproverWorkFlow,
};
