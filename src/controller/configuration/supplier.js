import Joi from "joi";
import knex from "../../config/mysql_db.js";
import otp from "../../emails/otp.js";

import { v4 as uuidv4 } from "uuid";
import constants from "../../helpers/constants.js";
import passwordEmail from "../../emails/passwordEmail.js";
import functions from "../../helpers/functions.js";
import ses from "../../helpers/ses.js";
import md5 from "md5";
import sap from "../../services/sap.js";
import { error, log } from "console";

import s3 from "../../s3/s3.js";

import approveremail from "../../emails/approverEmail.js";
import queriedemail from "../../emails/queriedEmail.js";
import { loadavg } from "os";
import e from "cors";
import { get } from "https";
import { join } from "path";
import validation from "../../validation/configuration/supplier.js";

const registerSupplier = async (req, res) => {
  try {
    // const fieldsConfig = await functions.getFieldConfig(
    //   "supplier_registration",
    //   1
    // );

    // const conditionalValidation = (object, condition) =>
    //   condition === true ? object.required() : object.optional().allow("", {});

    // const conditionalValidation = (object, condition) =>
    //   condition === true ? object.required() : object.optional().allow("");
    const { error, value } = validation.registerSupplier(req.body);
    if (error) {
      return res.json({
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
        return res.json({
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

    const insertId = await knex("supplier_details").insert({
      password: md5(password),
      created_at: timestampis,
      id: id,
      emailID,
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
      department,
      gstNo,
      panNo,
    });

    if (!insertId) {
      return res.json({
        error: true,
        message: "Inserting Company Details Failed",
      });
    }

    ////////////////////////////////////
    // user details
    ///////////////////////////////////

    const createSupplierUser = await knex("users").insert({
      password: md5(password),
      email: emailID,
      role: 6,
      status: 1,
      firstname: supplier_name,
      username: emailID,
      subscriber_id: 1, //1 - for Aashapura
    });

    if (!createSupplierUser) {
      return res.json({
        error: true,
        message: "Creating Supplier User Failed",
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
    msmeType = msmeType.value;
    detailsOfMajorLastYear = detailsOfMajorLastYear.value;
    listOfMajorCustomers = listOfMajorCustomers.value;
    companyType = companyType.value;
    id = uuidv4();
    const insert_businessDetails = await knex("business_details").insert({
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
      return res.json({
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
    const insertFinancialDetails = await knex("financial_details").insert({
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
      return res.json({
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

    const insertTaxDetailsId = await knex("tax_details").insert({
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
      return res.json({
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
    if (emailID != "") {
      const emailResponse = await passwordEmail.sendPassViaEmail(
        emailID,
        "Supplier Registeration",
        password
      );
      if (emailResponse.error) return res.json(emailResponse);
      return res.json({
        error: false,
        message:
          "Supplier created successfully. Password is sent to the registered email.",
        data: {
          insertId: supplierId,
        },
      });
    }

    return res.json({
      error: false,
      message: "Supplier created successfully.",
      data: supplierId,
    });
  } catch (error) {
    return res.json({
      error: true,
      message: "Can't register Supplier",
      data: JSON.stringify(error),
      body: req.body,
    });
  }
};

//update work in progress
const updateSupplier = async (req, res) => {
  try {
    // const fieldsConfig = await functions.getFieldConfig(
    //   "supplier_registration",
    //   1
    // );
    // const conditionalValidation = (object, condition) =>
    //   condition === true ? object.required() : object.optional().allow("");
    const { error, value } = validation.update(req.body);
    if (error) {
      return res.json({
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
        return res.json({
          error: true,
          message: "Please provide correct Pan No",
        });
      }
    }

    paymentMethod = paymentMethod?.value;
    country = country?.value;
    source = source?.value;
    state = state?.value;

    const supplierId = id;

    const checkSupplierId = await knex("supplier_details").where({
      id: supplierId,
    });
    if (checkSupplierId.length <= 0) {
      return res.json({
        error: true,
        message: "Supplier not found",
      });
    }

    const updateSupplierDetails = await knex("supplier_details")
      .update({
        emailID,
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
        add: add.value,
        state,
        department_id: department.value,
        department: department.label,
        gstNo,
        panNo,
      })
      .where({ id: supplierId });

    if (!updateSupplierDetails) {
      return res.json({
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
    businessType = businessType.value;
    msmeType = msmeType.value;
    detailsOfMajorLastYear = detailsOfMajorLastYear.value;
    listOfMajorCustomers = listOfMajorCustomers.value;
    companyType = companyType.value;

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
      })
      .where({ company_id: supplierId });

    if (!insert_businessDetails) {
      return res.json({
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

    currency = currency.value;
    id = uuidv4();
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
      })
      .where({ company_id: supplierId });

    if (!insertFinancialDetails) {
      return res.json({
        error: true,
        message: "Updating Financial Details failed",
      });
    }

    ///////////////////////////////////////////////////////
    //tax details
    ///////////////////////////////////////////////////////

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

    ////////////////////// date conversion ////////////

    const insertTaxDetailsId = await knex("tax_details")
      .update({
        gstNo: gstNo,
        gstRegDate: gstRegDateIs,
      })
      .where({ company_id: supplierId });

    if (!insertTaxDetailsId) {
      return res.json({
        error: true,
        message: "Updating Tax Details failed",
      });
    }

    let parameter = {};

    if (msmeImage != "") {
      parameter[msmeImage] = msmeImage;
    }

    if (gstImage != "") {
      parameter[gstImage] = gstImage;
    }

    if (cancelledChequeImage != "") {
      parameter[cancelledChequeImage] = cancelledChequeImage;
    }

    if (panCardImage != "") {
      parameter[panCardImage] = panCardImage;
    }

    if (pfAttachment != "") {
      parameter[pfAttachment] = pfAttachment;
    }

    if (otherAttachments != "") {
      parameter[otherAttachments] = otherAttachments;
    }

    if (Object.keys(parameter).length > 0) {
      const insertTaxDetailsId = await knex("tax_details")
        .update({
          parameter,
        })
        .where({ company_id: supplierId });

      if (!insertTaxDetailsId) {
        return res.json({
          error: true,
          message: "Updating Tax Details failed",
        });
      }
    }

    /* code 2nd    

    if (msmeImage != "") {
      const insertTaxDetailsId = await knex("tax_details")
        .update({
          msmeImage,
        })
        .where({ company_id: supplierId });

      if (!insertTaxDetailsId) {
       return res.json({
          error: true,
          message: "Updating Tax Details failed - MSME Image",
        });
       
      }
    }

    if (gstImage != "") {
      const insertTaxDetailsId = await knex("tax_details")
        .update({
          gstImage,
        })
        .where({ company_id: supplierId });

      if (!insertTaxDetailsId) {
       return res.json({
          error: true,
          message: "Updating Tax Details failed - GST Image",
        });
       
      }
    }

    if (cancelledChequeImage != "") {
      const insertTaxDetailsId = await knex("tax_details")
        .update({
          cancelledChequeImage,
        })
        .where({ company_id: supplierId });

      if (!insertTaxDetailsId) {
       return res.json({
          error: true,
          message: "Updating Tax Details failed - Cheque",
        });
       
      }
    }

    if (panCardImage != "") {
      const insertTaxDetailsId = await knex("tax_details")
        .update({
          panCardImage,
        })
        .where({ company_id: supplierId });

      if (!insertTaxDetailsId) {
       return res.json({
          error: true,
          message: "Updating Tax Details failed - PanCardImage",
        });
       
      }
    }
    if (otherAttachments != "") {
      const insertTaxDetailsId = await knex("tax_details")
        .update({
          otherAttachments,
        })
        .where({ company_id: supplierId });

      if (!insertTaxDetailsId) {
       return res.json({
          error: true,
          message: "Updating Tax Details failed - Other Attachments",
        });
        
      }
    }
*/

    /*
    old code:
    const insertTaxDetailsId = await knex("tax_details")
      .update({
        gstNo: gstNo,
        gstRegDate: gstRegDateIs,
        msmeImage,
        gstImage,
        cancelledChequeImage,
        panCardImage,
        otherAttachments,
      })
      .where({ company_id: supplierId });

    if (!insertTaxDetailsId) {
     return res.json({
        error: true,
        message: "Updating Tax Details failed",
      });
      
    } 
    */

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

    // send email

    const getEmailOfStatusChanger = await knex("supplier_status")
      .where({ supplier_id: supplierId })
      .where("status", "queried")
      .select("user_id");
    const checkId = getEmailOfStatusChanger[0].user_id;

    const getUserMail = await knex("users")
      .where({ id: checkId })
      .select("email");
    const userMail = getUserMail[0].email;

    const getSupplierName = await knex("supplier_details")
      .where({ id: supplierId })
      .select("supplier_name", "emailID");
    const supplierName = getSupplierName[0].supplier_name;
    const supplierEmail = getSupplierName[0].emailID;

    let emailTemplate =
      "<table style='border:2px orange solid'><td style='width:20%'></td><td><br><br><br><b>" +
      supplierName +
      "</b> <br>having e-mail :- " +
      supplierEmail +
      " has given Answer of query.<br> Please check it." +
      `<center><br><br><img style='max-width:80px;' src='${constants.admindetails.companyLogo}'><br>Powered by ${constants.admindetails.companyShortName}<br>Note: Do not reply this email. This is auto-generated email.</center></td><td style='width:20%'></td></table>`;

    const send_email = await ses.sendEmail(
      constants.sesCredentials.fromEmails.emailOtp,
      userMail,
      supplierName + " has given Answer of query",
      emailTemplate
    );

    //////////////////////

    return res.json({
      error: false,
      message: "Successfully Supplier details updated",
    });
  } catch (error) {
    return res.json({
      error: true,
      message: "Can't update Supplier",
      data: JSON.stringify(error),
    });
  }
};

const checkIfEmailExist = async (req, res) => {
  try {
    const { error, value } = validation.checkEmailExists(req.body);

    if (error) {
      return res.json({
        error: true,
        message: error.details[0].message,
      });
    }

    const { email } = value;

    if (functions.validateEmail(email)) {
      console.log("Email is valid");
    } else {
      console.log("Email is invalid");
      return res.json({ error: true, message: "Email is invalid" }).end();
    }

    const checkmail = await knex("supplier_details")
      .where("emailID", email)
      .select("emailID");

    if (checkmail && checkmail.length > 0) {
      return res.json({
        usedMail: true,
        message:
          "This email address is already in use. Please use a different email address.",
      });
    } else {
      return res.json({
        usedMail: false,
        message: "This mail is available",
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

const sendOtp = async (req, res) => {
  try {
    const { error, value } = validation.sendOtp(req.body);
    if (error) {
      return res.json({
        error: true,
        message: error.details[0].message,
        data: error,
      });
    }
    const { email } = value;

    if (functions.validateEmail(email)) {
      console.log("Email is valid");
    } else {
      console.log("Email is invalid");
      return res.json({ error: true, message: "Email is invalid" }).end();
    }

    // const check = await knex("supplier_details").where({
    //   emailID: email,
    // });

    // if (check.length != 0)
    //   return res.json({
    //     error: true,
    //     message: "Email Already Registered.",
    //   });

    const otpResponse = await otp.sendOtpViaEmail(
      email,
      "Supplier registration",
      constants.processes.supplierRegistration
    );
    if (otpResponse.error) {
      return res.json({
        error: true,
        message: otpResponse.message,
        data: otpResponse.data,
      });
    }
    return res.json(otpResponse);
  } catch (error) {
    return res.json({
      error: true,
      message: "Can't sent OTP",
      data: JSON.stringify(error),
    });
  }
};

const alllistSupplier = async (req, res) => {
  try {
    const { error, value } = validation.allListSupplier(req.body);

    if (error) {
      return res.json({
        error: true,

        message: error.details[0].message,

        data: error,
      });
    }

    let { offset, limit, order, sort, search, status, id } = value;

    const searchFrom = ["supplier_name", "mobile"];

    let data; //for getting exact result

    data = knex("supplier_details");

    if (id != "") {
      data = data.where("id", id);
    }

    if (status != "") {
      data = data.where("status", status);
    }

    if (search != "") {
      for (const iterator of searchFrom) {
        data = data.orWhereILike(iterator, `%${search}%`);
      }
    }

    const total = await data.orderBy(sort, order);

    data = await data.offset(offset).limit(limit).orderBy(sort, order);

    let srno = offset;

    data = await Promise.all(
      data.map(async (element) => {
        srno++;
        delete element.password;
        element.sr = srno;
        const b_details = await knex("business_details").where(
          "company_id",
          element.id
        );

        //listOfMajorCustomers
        //detailsOfMajorLastYear
        for (const iterator of b_details) {
          const getMajorCustomer = await knex("major_customer").where(
            "id",
            iterator.listOfMajorCustomers
          );
          if (getMajorCustomer.length > 0) {
            iterator.listOfMajorCustomers = getMajorCustomer[0].name;
          }
        }

        for (const iter of b_details) {
          const getMajorOrder = await knex("major_order").where(
            "id",
            iter.detailsOfMajorLastYear
          );
          if (getMajorOrder.length > 0) {
            iter.detailsOfMajorLastYear = getMajorOrder[0].name;
          }
        }

        const nameValue1 = await knex("company_source")
          .where("id", element.source)
          .select("name")
          .first();

        if (nameValue1 != undefined) {
          element.source = nameValue1.name;
        }

        const countryValue = await knex("countries")
          .where("country_key", element.country)
          .select("name")
          .first();

        if (countryValue != undefined) {
          element.country = countryValue.name;
        }

        const stateValue = await knex("states")
          .where("stateKey", element.state)
          .select("stateDesc")
          .first();

        if (stateValue != undefined) {
          element.state = stateValue.stateDesc;
        }

        const nameValue2 = await knex("payment_types")
          .where("id", element.paymentMethod)
          .select("name")
          .first();

        if (nameValue2 != undefined) {
          element.paymentMethod = nameValue2.name;
        }

        element.business_details = b_details;

        const nameValue3 = await knex("company_types")
          .where("id", b_details[0].companyType)
          .select("name")
          .first();

        if (nameValue3 != undefined) {
          b_details[0].companyType = nameValue3.name;
        }

        const nameValue4 = await knex("business_types")
          .where("id", b_details[0].businessType)
          .select("name")
          .first();

        if (nameValue4 != undefined) {
          b_details[0].businessType = nameValue4.name;
        }

        return element;
      })
    );

    data = await Promise.all(
      data.map(async (element) => {
        const f_details = await knex("financial_details").where(
          "company_id",
          element.id
        );

        for (const iterator of f_details) {
          const selectCurrency = await knex("currencies")
            .where("id", iterator.currency)
            .first();
          if (selectCurrency != undefined) {
            iterator.currency = selectCurrency.name;
          }
        }

        element.finance_details = f_details;
        return element;
      })
    );

    data = await Promise.all(
      data.map(async (element) => {
        const t_details = await knex("tax_details").where(
          "company_id",
          element.id
        );

        if (t_details[0].msmeImage === "") {
        } else {
          t_details[0].msmeImage = await s3.getTempUrl(t_details[0].msmeImage);
        }

        if (t_details[0].panCardImage === "") {
        } else {
          t_details[0].panCardImage = await s3.getTempUrl(
            t_details[0].panCardImage
          );
        }

        if (t_details[0].cancelledChequeImage === "") {
        } else {
          t_details[0].cancelledChequeImage = await s3.getTempUrl(
            t_details[0].cancelledChequeImage
          );
        }

        if (t_details[0].gstImage === "") {
        } else {
          t_details[0].gstImage = await s3.getTempUrl(t_details[0].gstImage);
        }

        if (t_details[0].pfAttachment === "") {
        } else {
          t_details[0].pfAttachment = await s3.getTempUrl(
            t_details[0].pfAttachment
          );
        }

        if (t_details[0].otherAttachments === "") {
        } else {
          t_details[0].otherAttachments = await s3.getTempUrl(
            t_details[0].otherAttachments
          );
        }

        element.tax_details = t_details;
        return element;
      })
    );

    data = await Promise.all(
      data.map(async (element) => {
        const record_is = await functions.viewData(
          "supplier_additional_fields",
          element.id,
          "123"
        );
        element.additionalDetails = record_is;
        return element;
      })
    );

    if (data.length == 0) {
      return res.json({
        error: false,
        message: "Data does not exist",
        data,
        total: 0,
      });
    }

    return res.json({
      error: false,
      message: "Data retrived successfully",
      data: data,
      total: total.length,
    });
  } catch (error) {
    return res.json({
      error: true,
      message: "Can't fetch supplier list",
      data: JSON.stringify(error),
    });
  }
};

const listSupplier = async (req, res) => {
  try {
    const tableName = "supplier_details";
    const searchFrom = ["supplier_name"];
    const { error, value } = validation.listSupplier(req.body);
    if (error) {
      return res.json({
        error: true,
        message: error.details[0].message,
        data: error,
      });
    }

    let total = 0;

    let { offset, limit, order, sort, search, status } = value;
    let results = knex(tableName).select(
      "id",
      "supplier_name",
      "status",
      "sap_code",
      knex.raw("CONVERT_TZ(created_at, '+00:00', '+05:30') as created_at"),
      knex.raw("CONVERT_TZ(updated_at, '+00:00', '+05:30') as updated_at")
    );

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
    let rows = knex(tableName).select(
      "id",
      "supplier_name",
      "status",
      "sap_code",
      knex.raw("CONVERT_TZ(created_at, '+00:00', '+05:30') as created_at"),
      knex.raw("CONVERT_TZ(updated_at, '+00:00', '+05:30') as updated_at")
    );

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
      data: data_rows,
      total: total.total,
    });
  } catch (error) {
    return res.json({
      error: true,
      message: "Something went wrong",
      data: JSON.stringify(error),
    });
  }
};

const syncFromSap = async (req, res) => {
  try {
    const { error, value } = validation.syncFromSap(req.body);

    if (error) {
      return res.json({
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
  } catch (error) {
    fun.sendErrorLog(req, error);
    return res.json({
      error: true,
      message: "Something went wrong.",
      data: { error: JSON.stringify(error) },
    });
  }
};

const viewFieldsForSap = async (req, res) => {
  try {
    const supplier_id = req.params.id;
    const getSupplierDetails = await knex("supplier_details")
      .where("id", supplier_id)
      .first();

    if (!getSupplierDetails) {
      return res.json({
        error: true,
        message: "Supplier does not exist",
      });
    }

    return res.json({
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
  } catch (error) {
    fun.sendErrorLog(req, error);
    return res.json({
      error: true,
      message: "Something went wrong.",
      data: { error: JSON.stringify(error) },
    });
  }
};

const changestatus = async (req, res) => {
  try {
    const { error, value } = validation.changeStatus(req.body);
    if (error) {
      return res.json({
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
    } = value;

    const getUserName = await knex("users").where({ id: user_id }).first();

    // const getApproverLevelName = await knex("approval_hierarchy").where({approver_level_name:approver_level});
    //

    if (approver_level === 0) {
      return res.json({
        error: true,
        message: "Approver level cannot be zero",
      });
    }

    const checkUserInUsers = await knex("users").where({ id: user_id }).first();
    if (!checkUserInUsers) {
      return res.json({
        error: true,
        message: "User does not exist",
      });
    }

    if (checkUserInUsers.role !== "3") {
      return res.json({
        error: true,
        message: "Only approver can change the status",
      });
    }

    //check user role in approval hierarchy

    const checkRoleIdExist = await knex("approval_hierarchy")
      .where({ role_id: user_role })
      .first();
    if (!checkRoleIdExist) {
      return res.json({
        error: true,
        message: "This role is not approver",
      });
    }

    //check approval level in approval hierarchy
    const checkApprovalHierarchyLevel = await knex("approval_hierarchy")
      .where({ approval_hierarchy_level: approver_hr_level })
      .first();
    if (!checkApprovalHierarchyLevel) {
      return res.json({
        error: true,
        message: "Approver Hierarchy Level does not exist",
      });
    }

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
      return res.json({
        error: true,
        message: "Supplier does not exist",
      });
    }

    // Check user role and allow changeStatus only for role 3

    //check if user exist in users

    // Check approver role and hierarchy level
    if (approver_level > approver_hr_level) {
      return res.json({
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

    console.log(" this is get approver level", getApprovalLevel);
    if (getApprovalLevel.level == 1) {
      const allowedStatusChanges = [
        "queried",
        "rejected",
        "pending",
        "verified",
      ];
      if (!allowedStatusChanges.includes(status)) {
        return res.json({
          error: true,
          message:
            "Level 1 users can only change status to queried, rejected, pending, or verified.",
        });
      }

      const changeStatusLevel1 = await knex("supplier_details")
        .update({
          level1status: status,
          status: status,
          status_update_date: timestampis,
          comment: comment,
        })
        .where({
          id: supplier_id,
        });

      if (changeStatusLevel1 === 0) {
        return res.json({
          error: true,
          message: "Supplier does not exist",
        });
      }
    } else if (getApprovalLevel.level == 2) {
      const allowedStatusChanges = ["approved", "rejected", "queried"];
      if (!allowedStatusChanges.includes(status)) {
        return res.json({
          error: true,
          message:
            "Level 2 users can only change status to approved, rejected, queried, or pending.",
        });
      }

      const changeStatusLevel2 = await knex("supplier_details")
        .update({
          level2status: status,
          status: status,
          status_update_date: timestampis,
          comment: comment,
        })
        .where({
          id: supplier_id,
        });

      if (changeStatusLevel2 === 0) {
        return res.json({
          error: true,
          message: "Supplier does not exist",
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

    //get email from supplier_id

    const emailOfSupplier = await knex("supplier_details")
      .where({ id: supplier_id })
      .first();

    //getting subscriber details...

    const getSubscriber = await knex("subscribers")
      .where("id", subscriber_id)
      .first();

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
      "<table style='border:0.5px solid orange; border-radius:5px; width:100%;'><tr><td style='width:20%'></td><td><br><br><br><b>Hello " +
      emailOfSupplier.supplier_name +
      ",</b>" +
      "<br><b>Welcome to " +
      constants.admindetails.companyFullName +
      "</b>" +
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
      "<br><br>Kind regards,<br><b>" +
      constants.admindetails.companyFullName +
      "</b><br><br><br><center><br>" +
      constants.admindetails.address1 +
      ", <br> " +
      constants.admindetails.address2 +
      ", " +
      constants.admindetails.city +
      ", " +
      constants.admindetails.state +
      ", " +
      constants.admindetails.country +
      `<br><img style='max-width:80px;' src='${constants.admindetails.companyLogo}'><br> Powered by ${constants.admindetails.companyShortName}<br> Note: Do not reply this email. This is auto-generated email.</center>` +
      "</td><td style='width:20%;'></td></td></tr></table>";

    const sendEmail = await ses.sendEmail(
      constants.sesCredentials.fromEmails.emailOtp,
      emailOfSupplier.emailID,
      "Supplier Onboarding Registration - " + emailstatus,
      emaildetail
    );

    return res.json({
      error: false,
      message: "Status updated successfully",
      UserName: getUserName.username,
      Status: status,
      comment: comment,
      // ApproverLevelName:
    });
  } catch (error) {
    return res.json({
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
      return res.json({
        error: true,
        message: error.details[0].message,
      });
    }

    const { username, department, id, comment } = value;

    const check_username = await knex("users").where("username", username);
    if (check_username.length == 0) {
      return res.json({
        error: true,
        message: "Username does not exist",
      });
    }

    const check_department = await knex("departments").where(
      "name",
      department
    );
    if (check_department.length == 0) {
      return res.json({
        error: true,
        message: "Department does not exist",
      });
    }

    const check_supplier_id = await knex("supplier_details").where("id", id);
    if (check_supplier_id.length == 0) {
      return res.json({
        error: true,
        message: "Supplier does not exist",
      });
    }

    const status_update_date = new Date();

    const result = await knex("supplier_details").where("id", id).update({
      status: "queried",
      status_update_date: status_update_date,
      comment: comment,
    });

    if (!result) {
      return res.json({
        error: true,
        message: "Query could not sent",
      });
    }

    const query_supplier = await knex("supplier_details").where("id", id);

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

    return res.json({
      error: false,
      message: "Query sent to supplier Successfully",
    });
  } catch (error) {
    return res.json({
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
      return res.json({
        error: true,
        message: error.details[0].message,
      });
    }

    const { username, department, id, comment } = value;

    const check_username = await knex("users").where("username", username);
    if (check_username.length == 0) {
      return res.json({
        error: true,
        message: "Username does not exist",
      });
    }

    const check_department = await knex("departments").where(
      "name",
      department
    );
    if (check_department.length == 0) {
      return res.json({
        error: true,
        message: "Department does not exist",
      });
    }

    const check_supplier_id = await knex("supplier_details").where("id", id);

    if (check_supplier_id.length == 0) {
      return res.json({
        error: true,
        message: "Supplier does not exist",
      });
    }

    const check_approved = await knex("supplier_details")
      .where("id", id)
      .where("status", "approved");

    if (check_approved.length > 0) {
      return res.json({
        error: true,
        message: "Supplier is already approved",
      });
    }

    const check_status = await knex("supplier_details")
      .where("id", id)
      .where("status", "verified");

    if (check_status.length == 0) {
      return res.json({
        error: true,
        message: "Supplier is yet not verified",
      });
    }

    const status_update_date = new Date();
    const result = await knex("supplier_details").where("id", id).update({
      status: "approved",
      status_update_date: status_update_date,
    });

    if (result.length == 0) {
      return res.json({
        error: true,
        message: "Could not approved",
      });
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

    return res.json({
      error: false,
      message: "Supplier successfully approved",
    });
  } catch (error) {
    return res.json({
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
      return res.json({
        error: true,
        message: error.details[0].message,
      });
    }

    const { username, department, id } = value;

    const check_username = await knex("users").where("username", username);
    if (check_username.length == 0) {
      return res.json({
        error: true,
        message: "Username does not exist",
      });
    }

    const check_department = await knex("departments").where(
      "name",
      department
    );
    if (check_department.length == 0) {
      return res.json({
        error: true,
        message: "Department does not exist",
      });
    }

    const check_supplier_id = await knex("supplier_details").where("id", id);
    if (check_supplier_id.length == 0) {
      return res.json({
        error: true,
        message: "Supplier does not exist",
      });
    }

    const status_update_date = new Date();

    const check_supplier_rejected = await knex("supplier_details")
      .where("id", id)
      .where("status", "rejected");

    if (check_supplier_rejected.length > 0) {
      return res.json({
        error: true,
        message: "Supplier is already rejected",
      });
    }

    const result = await knex("supplier_details").where("id", id).update({
      status: "rejected",
      status_update_date: status_update_date,
    });

    if (!result) {
      return res.json({
        error: true,
        message: "Supplier could not be rejected",
      });
    }

    return res.json({
      error: true,
      message: "Supplier rejected successfully",
    });
  } catch (error) {
    return res.json({
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
      return res.json({
        error: true,
        message: error.details[0].message,
      });
    }

    const { username, department, id } = value;

    const check_username = await knex("users").where("username", username);
    if (check_username.length == 0) {
      return res.json({
        error: true,
        message: "Username does not exist",
      });
    }

    const check_department = await knex("departments").where(
      "name",
      department
    );
    if (check_department.length == 0) {
      return res.json({
        error: true,
        message: "Department does not exist",
      });
    }

    const check_supplier_id = await knex("supplier_details").where("id", id);
    if (check_supplier_id.length == 0) {
      return res.json({
        error: true,
        message: "Supplier does not exist",
      });
    }

    const check_approve = await knex("supplier_details")
      .where("id", id)
      .where("status", "approved");

    if (check_approve > 0) {
      return res.json({
        error: true,
        message: "Supplier already approved",
      });
    }

    const check_supplier_verified = await knex("supplier_details")
      .where("id", id)
      .where("status", "verified");

    if (check_supplier_verified.length > 0) {
      return res.json({
        error: true,
        message: "Supplier already verified",
      });
    }

    const status_update_date = new Date();

    const result = await knex("supplier_details").where("id", id).update({
      status: "verified",
      status_update_date: status_update_date,
    });

    if (!result) {
      return res.json({
        error: true,
        message: "Supplier could not be verified",
      });
    }

    return res.json({
      error: false,
      message: "Supplier verified successfully",
    });
  } catch (error) {
    return res.json({
      error: true,
      message: "Can't verify supplier",
      data: JSON.stringify(error),
    });
  }
};

const changeStatusWithEmail = async (req, res) => {
  try {
    const { error, value } = validation.changeStatusWithEmail(req.body);

    if (error) {
      return res.json({
        error: true,
        message: error.details[0].message,
      });
    }

    const { current_user_id, supplier_id, module_id, comment, status } = value;

    //chcek if user exist
    const checkUser = await knex("users").where("id", current_user_id);
    if (checkUser.length == 0) {
      return res.json({
        error: true,
        message: "Username does not exist",
      });
    }

    //chcek module exist
    const checkModule = await knex("modules").where("id", module_id);
    if (checkUser.length == 0) {
      return res.json({
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
      return res.json({
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

    let roleIs = getUserDetail.role;

    //check role permission
    const checkUserRolePermission = await knex("users_roles_permissions")
      .where({
        role_id: roleIs,
        module_id: module_id,
      })
      .select("updateP");

    if (!checkUserRolePermission) {
      return res.json({
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
      return res.json({
        error: true,
        message: "Supplier is already approved",
      });
    }
    if (updateSupplier.status === "rejected") {
      return res.json({
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

      return res.json({
        error: false,
        message: "Supplier's status updated successfully",
      });
    }
  } catch (error) {
    return res.json({
      error: true,
      message: "Can't change status",
    });
  }
};

const deleteSupplier = async (req, res) => {
  try {
    const { error, value } = validation.deleteSupplier(req.params);

    if (error) {
      return res.json({
        error: true,
        message: error.details[0].message,
      });
    }

    const { id } = value;

    const check_supplier_id = await knex("supplier_details")
      .where("id", id)
      .delete();

    if (!check_supplier_id) {
      return res.json({
        error: true,
        message: "Supplier could not be deleted",
      });
    }

    //delete supplier from additional details

    const delete_addditional_details = await functions.deleteData(
      "supplier_additional_fields",
      id,
      "123"
    );

    return res.json({
      error: false,
      message: "Supplier deleted successfully",
    });
  } catch (error) {
    return res.json({
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
      return res.json({
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

    return res.json({
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
    return res.json({
      error: false,
      message: "Can't fetch Workflow data",
      data: JSON.stringify(error),
    });
  }
};

// const supplierChangeStatusList = async (req, res) => {
//   try {
//   const schema = Joi.object({
//     supplier_id: Joi.string().required(),
//   });

//   const { error, value } = schema.validate(req.body);
//   if (error) {
//     return res.json({
//       error: true,
//       message: error.details[0].message,
//     });
//   }
//   const { supplier_id } = value;

//   const getStatusList = await knex("supplier_status").where(
//     "supplier_id",
//     supplier_id
//   );

//   if (getStatusList.length <= 0) {
//     return res.json({
//       error: true,
//       message: "Supplier Status does not exist",
//     });
//   }

//   for (const iterator of getStatusList) {
//     const userName = await knex("users").where("id", iterator.user_id);
//     iterator.user_name = userName[0].username;

//     const userId = "[" + iterator.user_id + "]";
//     const level = iterator.approver_level;

//     let get_hk_no;

//     switch (level) {
//       case 1:
//         get_hk_no = await knex("approvers")
//           .where({ level_1_user_id: userId })
//           .select("approval_hierarchy_id")
//           .first();
//         break;
//       case 2:
//         get_hk_no = await knex("approvers")
//           .where({ level_2_user_id: userId })
//           .select("approval_hierarchy_id")
//           .first();
//         break;
//       case 3:
//         get_hk_no = await knex("approvers")
//           .where({ level_3_user_id: userId })
//           .select("approval_hierarchy_id")
//           .first();
//         break;
//       case 4:
//         get_hk_no = await knex("approvers")
//           .where({ level_4_user_id: userId })
//           .select("approval_hierarchy_id")
//           .first();

//         break;
//     }

//     const getApprovalLevelNameJson = await knex("approval_hierarchy")
//       .where("id", get_hk_no.approval_hierarchy_id)
//       .select("approval_level_name");

//     const parsedJson = JSON.parse(
//       getApprovalLevelNameJson[0].approval_level_name
//     );

//     let approverLevelName;
//     for (const iterator2 of parsedJson) {
//       if (iterator2.level == level) {
//         approverLevelName = iterator2.name;
//       }
//     }
//     iterator.approver_level_name = approverLevelName;
//   }

//   return res
//     .json({
//       error: false,
//       message: "Status list successfully retrived",
//       data: getStatusList,
//     })
//
//   } catch (error) {
//     return res
//       .json({
//         error: false,
//         message: "Can't fetch supplier list",
//       })
//       \
//   }
// };

const supplierChangeStatusList = async (req, res) => {
  try {
    const { error, value } = validation.supplierChangeStatusList(req.body);
    if (error) {
      return res.json({
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
      return res.json({
        error: true,
        message: "Supplier Status does not exist",
      });
    }

    const latestStatusByLevel = new Map();
    console.log("supplierlist", getStatusList);

    for (const iterator of getStatusList) {
      const userName = await knex("users").where("id", iterator.user_id);
      iterator.user_name = userName[0].username;

      const userId = "[" + iterator.user_id + "]";
      const level = iterator.approver_level;

      let get_hk_no;

      console.log("this is level", level);

      switch (level) {
        case 1:
          get_hk_no = await knex("approvers")
            .where({ level_1_user_id: userId })
            .select("approval_hierarchy_id")
            .first();
          break;
        case 2:
          get_hk_no = await knex("approvers")
            .where({ level_2_user_id: userId })
            .select("approval_hierarchy_id")
            .first();
          break;
        case 3:
          get_hk_no = await knex("approvers")
            .where({ level_3_user_id: userId })
            .select("approval_hierarchy_id")
            .first();
          break;
        case 4:
          get_hk_no = await knex("approvers")
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

    return res.json({
      error: false,
      message: "Latest status list successfully retrieved",
      data: latestStatusList,
    });
  } catch (error) {
    return res.json({
      error: false,
      message: "Can't fetch supplier list",
    });
  }
};

const supplierFilteredList = async (req, res) => {
  try {
    const searchFrom = ["supplier_name"];
    const { error, value } = validation.supplierFilteredList(req.body);

    if (error) {
      return res.json({
        error: true,
        message: error.details[0].message,
      });
    }

    const { user_id, status, offset, limit, sort, order, search } = value;

    try {
      const getUserLevel = await knex("users")
        .select("level")
        .where({ id: user_id });
      const level = getUserLevel[0].level;
      console.log("level", level);

      const getUserRole = await knex("users")
        .select("role")
        .where({ id: user_id });
      const role = getUserRole[0].role;
      console.log("get", getUserRole);

      if (role !== "3") {
        return res.status(400).json({
          error: true,
          message: "User is not an approver",
        });
      }

      if (role === "3" && (level === null || level === 0)) {
        return res.status(400).json({
          error: true,
          message: "User is an approver, but levels are not assigned yet",
        });
      }

      const getDeptId = await knex("approvers").select("department_id");

      let depId = null;

      if (level === 1) {
        const getDeptIdFrom = await knex("approvers")
          .select("department_id")
          .whereIn(
            user_id,
            knex.raw('JSON_UNQUOTE(JSON_EXTRACT(level_1_user_id, "$[0]"))')
          );

        // console.log("i am here");
        depId = getDeptIdFrom[0].department_id;
        console.log("dep id in level 1", depId);
      } else if (level === 2) {
        const getDeptIdFrom = await knex("approvers")
          .select("department_id")
          .whereIn(
            user_id,
            knex.raw('JSON_UNQUOTE(JSON_EXTRACT(level_2_user_id, "$[0]"))')
          );

        depId = getDeptIdFrom[0].department_id;
      } else if (level === 3) {
        const getDeptIdFrom = await knex("approvers")
          .select("department_id")
          .whereIn(
            user_id,
            knex.raw('JSON_UNQUOTE(JSON_EXTRACT(level_3_user_id, "$[0]"))')
          );

        depId = getDeptIdFrom[0].department_id;
      } else if (level === 4) {
        const getDeptIdFrom = await knex("approvers")
          .select("department_id")
          .whereIn(
            user_id,
            knex.raw('JSON_UNQUOTE(JSON_EXTRACT(level_4_user_id, "$[0]"))')
          );

        depId = getDeptIdFrom[0].department_id;
      }

      if (depId === null) {
        return res.status(400).json({
          error: true,
          message: "Not any department found for the specified level",
        });
      }

      console.log("get", depId);
      let getSupplierDetails;
      let data;
      if (status == "all") {
        data = knex("supplier_details");

        console.log("in data now", data);
        if (search != "") {
          for (const iterator of searchFrom) {
            data = data.whereILike(iterator, `%${search}%`);
          }
        }

        getSupplierDetails = await data
          .offset(offset)
          .limit(limit)
          .orderBy(sort, order);
      } else {
        data = await knex("supplier_details")
          .where({
            department_id: depId,
          })
          .where({ status: status });

        if (search != "") {
          for (const iterator of searchFrom) {
            data = data.whereILike(iterator, `%${search}%`);
          }
        }

        getSupplierDetails = await data
          .offset(offset)
          .limit(limit)
          .orderBy(sort, order);
      }

      let srno = offset + 1;
      //for converting utc time to ist time
      for (const iterator of getSupplierDetails) {
        const utcCreatedAt = iterator.created_at;
        const utcUpdatedAt = iterator.updated_at;
        iterator.srno = srno++;
        const istOffsetMinutes = 330;

        function convertToIST(utcTimestamp) {
          const utcDate = new Date(utcTimestamp);
          const istDate = new Date(
            utcDate.getTime() + istOffsetMinutes * 60000
          );
          return istDate.toISOString();
        }

        const istCreatedAt = convertToIST(utcCreatedAt);
        const istUpdatedAt = convertToIST(utcUpdatedAt);

        iterator.created_at = istCreatedAt;
        iterator.updated_at = istUpdatedAt;
      }

      if (getSupplierDetails.length === 0) {
        return res.status(400).json({
          error: true,
          message: "Supplier does not exist with this department or status",
        });
      }

      const supplierDetails = [];
      for (const supplier of getSupplierDetails) {
        const supplierId = supplier.id;

        const getBusinessDetails = await knex("business_details").where({
          company_id: supplierId,
        });

        const businessDetailsData = getBusinessDetails[0];

        const getFinancialDetails = await knex("financial_details").where({
          company_id: supplierId,
        });

        const financialDetailsData = getFinancialDetails[0];

        const getTaxDetails = await knex("tax_details").where({
          company_id: supplierId,
        });

        if (
          getTaxDetails[0].msmeImage !== "" &&
          getTaxDetails[0].msmeImage !== null
        ) {
          getTaxDetails[0].msmeImage = await s3.getTempUrl(
            getTaxDetails[0].msmeImage
          );
        }

        if (
          getTaxDetails[0].panCardImage !== "" &&
          getTaxDetails[0].panCardImage !== null
        ) {
          getTaxDetails[0].panCardImage = await s3.getTempUrl(
            getTaxDetails[0].panCardImage
          );
        }

        if (
          getTaxDetails[0].cancelledChequeImage !== "" &&
          getTaxDetails[0].cancelledChequeImage !== null
        ) {
          getTaxDetails[0].cancelledChequeImage = await s3.getTempUrl(
            getTaxDetails[0].cancelledChequeImage
          );
        }

        if (
          getTaxDetails[0].gstImage !== "" &&
          getTaxDetails[0].gstImage !== null
        ) {
          getTaxDetails[0].gstImage = await s3.getTempUrl(
            getTaxDetails[0].gstImage
          );
        }

        const taxDetailsData = getTaxDetails[0];

        supplierDetails.push({
          srno: supplierDetails.length + 1,
          ...supplier,
          BussinessDetails: businessDetailsData,
          FinancialDetails: financialDetailsData,
          TaxDetails: taxDetailsData,
        });
      }

      return res.json({
        error: false,
        message: "Here are the details of the supplier",
        total: supplierDetails.length,
        data: supplierDetails,
      });
    } catch (error) {
      return res.status(500).json({
        error: true,
        message: "Something went wrong",
      });
    }
  } catch (error) {
    return res.json({
      error: true,
      message: "Can't fetch Supplier filtered list",
    });
  }
};

const view = async (req, res) => {
  try {
    const { error, value } = validation.view(req.params);
    if (error) {
      return res.json({
        error: true,
        message: error.details[0].message,
      });
    }

    const { id } = value;

    const getSupplierDetails = await knex("supplier_details")
      .where("id", id)
      .first();

    if (getSupplierDetails == undefined) {
      return res.json({
        error: true,
        message: "Supplier details do not exist",
      });
    }

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

    const getdeapartmentName = await knex("business_partner_groups")
      .where("id", getSupplierDetails.department_id)
      .select("name");

    const deapartmentName = getdeapartmentName[0]
      ? getdeapartmentName[0].name
      : "";
    getSupplierDetails.department = deapartmentName;

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

    return res.json({
      error: false,
      data: getSupplierDetails,
    });
  } catch (error) {
    return res.json({
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
      return res.json({
        error: true,
        message: error.details[0].message,
      });
    }

    const { name } = value;

    const createMajorCustomer = await knex("major_customer").insert({ name });

    if (!createMajorCustomer) {
      return res.json({
        error: true,
        message: "Major customer creation failed",
      });
    }

    return res.json({
      error: false,
      message: "Major customer created successfully",
      data: createMajorCustomer,
    });
  } catch (error) {
    return res.json({
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
      return res.json({
        error: true,
        message: "Major customer list not found",
      });
    }

    return res.json({
      error: false,
      message: "Major customer list successfully retrived",
      data: selectRecords,
    });
  } catch (error) {
    return res.json({
      error: true,
      message: "Can't create major customer",
      data: JSON.stringify(error),
    });
  }
};

//todo

const createDetailsOfMajorOrder = async (req, res) => {
  try {
    const { error, value } = validation.createDetailsOfMajorOrder(req.body);
    if (error) {
      return res.json({
        error: true,
        message: error.details[0].message,
      });
    }

    const { name } = value;

    const insertRecord = await knex("major_order").insert({ name });

    if (!insertRecord) {
      return res.json({
        error: true,
        message: "Major order creation failed",
      });
    }

    return res.json({
      error: false,
      message: "Major order created successfully",
      data: insertRecord,
    });
  } catch (error) {
    return res.json({
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
      return res.json({
        error: true,
        message: "No Major order found",
      });
    }

    return res.json({
      error: false,
      message: "Major order list successfully retrived",
      data: getRecords,
    });
  } catch (error) {
    return res.json({
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
      return res.json({
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
      return res.json({
        error: true,
        message: "Supplier already exist",
      });
    }

    return res.json({
      error: false,
      message: "Welcome to onboarding...",
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

const analytics = async (req, res) => {
  try {
    const getApprovedCount = await knex("supplier_details").where(
      "status",
      "=",
      "approved"
    );

    const getTotalCount = await knex("supplier_details");

    const getRejectedCount = await knex("supplier_details").where(
      "status",
      "=",
      "rejected"
    );

    const getVerifiedCount = await knex("supplier_details").where(
      "status",
      "=",
      "verified"
    );

    const getPendingCount = await knex("supplier_details").where(
      "status",
      "=",
      "pending"
    );

    const getQueriedCount = await knex("supplier_details").where(
      "status",
      "=",
      "queried"
    );

    const getGstRegistered = await knex("supplier_details").where(
      "gstNo",
      "!=",
      ""
    );

    const getPanRegistered = await knex("supplier_details")
      .where("panNo", "!=", "")
      .where("gstNo", "=", "");

    return res.json({
      error: false,
      message: "Analytics retrived successfully",
      data: {
        pending: getPendingCount.length,
        queried: getQueriedCount.length,
        verified: getVerifiedCount.length,
        approved: getApprovedCount.length,
        rejected: getRejectedCount.length,
        gstRegistered: getGstRegistered.length,
        panRegistered: getPanRegistered.length,
        total: getTotalCount.length,
      },
    });
  } catch (error) {
    return res.json({
      error: true,
      message: "Something went wrong",
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
    });
  }
};

//if level 1 is verfied then show the list
const levelVerifeidList = async (req, res) => {
  const searchFrom = ["supplier_name"];
  const { error, value } = validation.levelVerifeidList(req.body);

  if (error) {
    return res.json({
      error: true,
      message: error.details[0].message,
    });
  }

  const { offset, limit, sort, order, status, search } = value;

  try {
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
    });
  }
};

//updating tds in supplier_details table
const updateTds = async (req, res) => {
  try {
    const { error, value } = validation.updateTds(req.body);
    if (error) {
      return res.json({ error: true, message: error.details[0].message });
    }

    const { id, itWitholding } = value;

    const itWitholding_are = JSON.stringify(itWitholding);

    const updateTds = await knex("additional_company_details")
      .update({
        itWitholding: itWitholding_are,
      })
      .where("supplier_id", id);

    if (!updateTds) {
      return res.json({
        error: true,
        message: "Supplier does not exist",
      });
    }

    return res.json({
      error: false,
      message: "Supplier updated successfully",
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

const count = async (req, res) => {
  try {
    const checkRecords = await knex("supplier_details");
    if (checkRecords.length <= 0) {
      return res.json({
        error: true,
        message: "No records found",
      });
    }

    const checkRecordsSupplierStatus = await knex("supplier_details");
    if (checkRecordsSupplierStatus.length <= 0) {
      return res.json({ error: true, message: "No records found" });
    }

    const getSapCodeCount = await knex("supplier_details")
      .whereNotNull("sap_code")
      .andWhere("sap_code", "!=", "")
      .select();

    console.log("sap", getSapCodeCount);
    const getNoSapCode = await knex("supplier_details")
      .whereNull("sap_code")
      .orWhere("sap_code", "=", "")
      .select();
    const getVerfiedVendorCount = await knex("supplier_details")
      .where("level1status", "verified")
      .select();
    const getApprovedVendorCount = await knex("supplier_details")
      .where("level2status", "approved")
      .select();
    const getRejectedVendorCout = await knex("supplier_details")
      .where("status", "rejected")
      .select();

    const getGstRegisteredCouunt = await knex("supplier_details")
      .whereNotNull("gstNo")
      .select();

    const getPanRegisteredCount = await knex("supplier_details")
      .where("gstNo", null | "")
      .select();

    const getPendingSupplierCount = await knex("supplier_details").where(
      "status",
      "pending"
    );

    const getTotalVendorCount = await knex("supplier_details").select();

    return res.json({
      sapCodeCount: getSapCodeCount.length,
      noSapCodeCount: getNoSapCode.length,
      pendingVendorCount: getPendingSupplierCount.length,
      verifiedVendorCount: getVerfiedVendorCount.length,
      approvedVendorCount: getApprovedVendorCount.length,
      rejectedVendorCount: getRejectedVendorCout.length,
      gstRegisteredCount: getGstRegisteredCouunt.length,
      panRegisteredCount: getPanRegisteredCount.length,
      totalRegisteredVendors: getTotalVendorCount.length,
    });
  } catch (error) {
    return res.json({
      error: true,
      message: "Data not found",
    });
  }
};

const shortCount = async (req, res) => {
  try {
    const checkRecords = await knex("supplier_details");
    if (checkRecords.length <= 0) {
      return res.json({
        error: true,
        message: "No records found",
      });
    }

    const checkRecordsSupplierStatus = await knex("supplier_details");
    if (checkRecordsSupplierStatus.length <= 0) {
      return res.json({ error: true, message: "No records found" });
    }

    const getSapCodeCount = await knex("supplier_details")
      .whereNotNull("sap_code")
      .select();
    const getNoSapCode = await knex("supplier_details")
      .where("status", "pending")
      .select();
    const getVerfiedVendorCount = await knex("supplier_details")
      .where("level1status", "verified")
      .select();
    const getApprovedVendorCount = await knex("supplier_details")
      .where("status", "approved")
      .select();
    const getRejectedVendorCout = await knex("supplier_details")
      .where("status", "rejected")
      .select();

    const getGstRegisteredCouunt = await knex("supplier_details")
      .whereNotNull("gstNo")
      .select();
    const getPanRegisteredCount = await knex("supplier_details")
      .whereNotNull("panNo")
      .whereNull("gstNo")
      .select();

    const getQueriedCount = await knex("supplier_details")
      .where("status", "queried")
      .select();

    const totalRecords = checkRecords.length;
    const approvedVendorCount = getApprovedVendorCount.length;
    const percentageApprovedVendors = (
      (approvedVendorCount / totalRecords) *
      100
    ).toFixed(2);

    return res.json({
      sapCodeCount: getSapCodeCount.length,
      noSapCodeCount: getNoSapCode.length,
      verifiedVendorCount: getVerfiedVendorCount.length,
      approvedVendorCount: approvedVendorCount,
      rejectedVendorCount: getRejectedVendorCout.length,
      gstRegisteredCount: getGstRegisteredCouunt.length,
      panRegisteredCount: getPanRegisteredCount.length,
      percentageApprovedVendors: parseFloat(percentageApprovedVendors),
      queriedVendors: getQueriedCount.length,
      totalRecords: totalRecords,
    });
  } catch (error) {
    return res.json({
      error: true,
      message: "Data not found",
    });
  }
};

const countTimeBound = async (req, res) => {
  try {
    let today = new Date();
    let today2 = new Date();
    let yesterday = new Date();

    const monthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];

    const collection_sapcode = [];
    const collection_pending = [];
    const collection_approved = [];
    const collection_verified = [];

    const collection_dates = [];
    const collection_yeterdays = [];
    //getting values for pending
    for (let i = 0; i < 10; i++) {
      today = new Date();
      today.setDate(today.getDate() - i);

      collection_dates.push(
        today.getDate() + "-" + monthNames[today.getMonth()]
      );
      today2 = new Date();
      yesterday = new Date();
      yesterday.setDate(today2.getDate() - (i + 1));

      collection_yeterdays.push(
        yesterday.getDate() + "-" + monthNames[yesterday.getMonth() - 1]
      );

      const checkDataInTable = await knex("supplier_details");
      if (checkDataInTable.length <= 0) {
        return res.json({
          error: true,
          message: "No data found",
        });
      }

      const getReport = await knex("supplier_details")
        .where("created_at", "<=", today)
        .where("created_at", ">", yesterday)
        .where("status", "pending");
      collection_pending.push(getReport.length);
    }

    //getting values for created
    for (let i = 0; i < 10; i++) {
      today = new Date();
      today.setDate(today.getDate() - i);

      //collection_dates.push(today.getDate());
      today2 = new Date();
      yesterday = new Date();
      yesterday.setDate(today2.getDate() - (i + 1));

      //collection_yeterdays.push(yesterday.getDate());
      const getReport = await knex("supplier_details")
        .where("sap_code_time", "<=", today)
        .where("sap_code_time", ">", yesterday)
        .where("status", "approved");
      collection_sapcode.push(getReport.length);
    }

    //getting values for approved
    for (let i = 0; i < 10; i++) {
      today = new Date();
      today.setDate(today.getDate() - i);

      //collection_dates.push(today.getDate());
      today2 = new Date();
      yesterday = new Date();
      yesterday.setDate(today2.getDate() - (i + 1));

      //collection_yeterdays.push(yesterday.getDate());
      const getReport = await knex("supplier_status")
        .where("created_at", "<=", today)
        .where("created_at", ">", yesterday)
        .where("status", "approved");
      collection_approved.push(getReport.length);
    }

    //getting values for verified
    for (let i = 0; i < 10; i++) {
      today = new Date();
      today.setDate(today.getDate() - i);
      ``;
      //collection_dates.push(today.getDate());
      today2 = new Date();
      yesterday = new Date();
      yesterday.setDate(today2.getDate() - (i + 1));

      //collection_yeterdays.push(yesterday.getDate());
      const getReport = await knex("supplier_status")
        .where("created_at", "<=", today)
        .where("created_at", ">", yesterday)
        .where("status", "verified");
      collection_verified.push(getReport.length);
    }

    return res.json({
      error: false,
      message: "data retrived",
      pending_vendor: collection_pending,
      created_vendor: collection_sapcode,
      approved_vendor: collection_approved,
      verified_vendor: collection_verified,
      dates: collection_dates,
    });
  } catch (error) {
    return res.json({
      error: true,
      message: "Data not found",
    });
  }
};

export default {
  registerSupplier,
  updateSupplier,
  checkIfEmailExist,
  sendOtp,
  listSupplier,
  changestatus,
  queriedSupplier,
  approvedSupplier,
  rejectedSupplier,
  verifySupplier,
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
  analytics,
  createdSupplierList,
  pendingSupplierList,
  levelVerifeidList,
  updateTds,
  count,
  countTimeBound,
  shortCount,
};
