import fs from "fs";
import https from "https";
import constants from "./constants.js";
import knex from "../config/mysql_db.js";
import { error, log } from "console";
import dynamodb from "../../src/config/dynamo_db.js";
import { callbackPromise } from "nodemailer/lib/shared/index.js";
import jwt from "jsonwebtoken";
import axios from "axios";
import stream from "stream";
import moment from "moment-timezone";
import winston from "winston";
import po from "../services/poFromSap.js";
import { v4 as uuidv4 } from "uuid";
import AWS from "aws-sdk";
import path from "path";
import XLSX from "xlsx";
import os from "os";
import Joi from "joi";
import ExcelJS from "exceljs";
import crypto from "crypto";

async function takeSnapShot(tableName, tableId) {
  // console.log("takeSnapShot Run with ", tableName, tableId);
  try {
    const data = await knex(tableName).where({ id: tableId }).first();
    // console.log("data:-", data);
    const storeData = await knex("snapShot").insert({
      table: tableName,
      tableId: tableId,
      oldData: JSON.stringify(data),
    });
    return storeData;
  } catch (error) {
    // console.log("error occured in takeSnapShot function");
    return 0;
  }
}

const getRollNameByHeader = async (token) => {
  if (token == undefined) {
    console.log("token not found");
    return 0;
  }
  const payload = jwt.decode(token.split(" ")[1], jwt.secret);
  return payload.permissions;
};

const SetModifiedBy = async (token, tablename, columnName, value) => {
  try {
    if (token == undefined) {
      console.log("token not found");
      return 0;
    }
    const payload = jwt.decode(token.split(" ")[1], jwt.secret);
    const modifyRecord = await knex(tablename)
      .where(columnName, value)
      .update({ modifiedBy: payload.permissions });
    return modifyRecord;
  } catch (error) {
    console.log("error occured in SetModifiedBy function:" + error);
    return 0;
  }
};

const checkInSapDuplicateVendor = async (gstin, pan) => {
  try {
    const getCredentials = await knex("sapConfiguration")
      .where("name", "sapCreds")
      .first();

    if (getCredentials == undefined) {
      console.log("3rd Party API(sapCreds) values not found");
      return "3rd Party API(sapCreds) values not found";
    }

    console.log(getCredentials);

    const axiosConfig = {
      method: "get",
      maxBodyLength: Infinity,
      url:
        getCredentials.url + getCredentials.tokenPath + getCredentials.client,
      headers: {
        GSTIN: gstin,
        PANNO: pan,
        Cookie: getCredentials.cookie + getCredentials.client,
      },
      auth: {
        username: getCredentials.username,
        password: getCredentials.password,
      },
      httpsAgent: new https.Agent({
        rejectUnauthorized: false,
      }),
    };

    const response = await axios.request(axiosConfig);
    return response.data;
  } catch (error) {
    console.error(error);
    return "Internal Server Error";
  }
};

/*
const checkInSapDuplicateVendor_old = async (gstin, pan) => {
  try {
    const axiosConfig = {
      method: "get",
      maxBodyLength: Infinity,
      url: constants.sapCreds.url,
      headers: {
        GSTIN: gstin,
        PANNO: pan,
        Authorization: constants.sapCreds.authentication,
        Cookie: constants.sapCreds.cookie,
      },
    };

    const response = await axios.request(axiosConfig);
    return response.data;
  } catch (error) {
    console.error(error);
    return "Internal Server Error";
  }
};

*/

const getRandomFileName = (name) => {
  let ext = name.split(".");
  ext = ext[ext.length - 1];
  return (
    Math.ceil(Math.random() * 100000) +
    name.replace(/[^a-z0-9]/gi, "_").toLowerCase() +
    "." +
    ext
  );
};

const getStaticUrl = (fileName) => {
  return `${constants.BASE_URL}${constants.STATIC_PATH}/${fileName}`;
};

const sendEmail = async (subject, sendTo, text, html) => {
  return new Promise((resolve) => {
    const mailData = {
      from: constants.mailConfig.mail,
      to: sendTo,
      subject: subject,
      text: text,
      html: html,
    };
    constants.transporter.sendMail(mailData, async (error, success) => {
      if (success) {
        return resolve({
          error: false,
          message: "mail sent",
        });
      }
      return resolve({
        error: true,
        message: "Server is down! Please try after sometime",
        data: error,
      });
    });
  });
};

const removeFile = (filePath, oldImage) => {
  return new Promise((resolve, reject) => {
    fs.unlink(`${filePath}${oldImage}`, async (err) => {
      if (err) {
        return reject({
          error: true,
          data: err,
        });
      }
    });

    return resolve({
      error: false,
    });
  });
};

const uploadFile = (filePath, imageFile) => {
  return new Promise(async (resolve, reject) => {
    const newName = getRandomFileName(imageFile.name);

    await imageFile.mv(`${filePath}${newName}`, async (err) => {
      if (err) {
        return reject({
          error: true,
          data: err,
        });
      }
    });

    return resolve({
      error: false,
      data: newName,
    });
  });
};

const getPagesByPanel = async (pannelId) => {
  let [pages, pageGroup] = await Promise.all([
    knex("pages").whereIn("name", [
      "Countries",
      "Languages",
      "Region",
      "Role",
      "Users",
      "Dashboard",
    ]),
    knex("page_group"),
  ]); //.whereIn for testing purpose added
  pages = pages.map((val) => ({
    ...val,
    key: replaceSpecialCharactersWithHyphen(val.name),
  }));
  let primaryPages = pages.filter((val) => val.is_primary == "1");

  let groups = pageGroup.map((group) => ({
    key: replaceSpecialCharactersWithHyphen(group.group_name),
    ...group,
    children: pages
      .filter((val) => val.is_primary == "0" && group.id == val.group_id)
      .sort((a, b) => a.sort - b.sort),
  }));
  let nav = [...groups, ...primaryPages].sort((a, b) => a.sort - b.sort);
  return nav;
};

function replaceSpecialCharactersWithHyphen(inputString) {
  console.log(inputString);
  // Define the regular expression to find special characters and spaces
  var pattern = /[^\w]/g;

  // Use replace() to replace all occurrences of special characters and spaces with a hyphen
  var modifiedString = inputString.replace(pattern, "-").toLowerCase();

  return modifiedString;
}
// check code or id is unique or not

const verifyCode = async (tableName, columnName, value) => {
  const data = await knex(tableName)
    .where({
      [columnName]: value,
    })
    .andWhere({isDeleted:'0'});

  if (Array.isArray(data) && data.length != 0) {
    return {
      error: true,
    };
  }
  return {
    error: false,
  };
};

// check code or id is Exists or not

const checkCodeExists = async (tableName, columnName, value) => {
  const data = await knex(tableName).where({
    [columnName]: value,
  });
  if (Array.isArray(data) && data.length == 0) {
    return {
      error: true,
    };
  }

  return {
    error: false,
  };
};

const genratePassword = async (
  length = 12,
  password = "",
  chars = "0123456789abcdefghijklmnopqrstuvwxyz!@#$%^&*()ABCDEFGHIJKLMNOPQRSTUVWXYZ"
) => {
  for (var i = 0; i <= length; i++) {
    const randomNumber = Math.floor(Math.random() * chars.length);
    password += chars.substring(randomNumber, randomNumber + 1);
  }
  return password;
};

const getFieldConfig = async (module_name, panel_id = 1, required = true) => {
  let data = await knex("fields_config").where({
    module_name,
    panel_id,
  });
  const groupedData = {};

  function convertArrayToObject(inputArray) {
    const result = {};

    for (const category of Object.keys(inputArray)) {
      const categoryDetails = inputArray[category];
      const categoryObject = {};

      for (const detail of categoryDetails) {
        if (required) {
          categoryObject[detail.key] = detail.required;
        } else {
          categoryObject[detail.key] = {
            id: detail.id,
            required: detail.required,
          };
        }
      }

      result[category] = categoryObject;
    }

    return result;
  }

  data = data.forEach((item) => {
    const groupName = item.group_name;
    if (!groupedData[groupName]) {
      groupedData[groupName] = [];
    }
    groupedData[groupName].push({
      id: item.id,
      key: item.key,
      required: item.required == "1",
    });
  });
  return convertArrayToObject(groupedData);
};

const getFieldConfigInternational = async (module_name, panel_id = 1, required = true) => {
  let data = await knex("fields_config").where({
    module_name,
    panel_id,
  });
  const groupedData = {};

  function convertArrayToObject(inputArray) {
    const result = {};

    for (const category of Object.keys(inputArray)) {
      const categoryDetails = inputArray[category];
      const categoryObject = {};

      for (const detail of categoryDetails) {
        if (required) {
          categoryObject[detail.key] = detail.required;
        } else {
          categoryObject[detail.key] = {
            id: detail.id,
            required: detail.required,
          };
        }
      }

      result[category] = categoryObject;
    }

    return result;
  }

  data = data.forEach((item) => {
    const groupName = item.group_name;
    if (!groupedData[groupName]) {
      groupedData[groupName] = [];
    }
    groupedData[groupName].push({
      id: item.id,
      key: item.key,
      required: item.international_required == "1",
    });
  });
  return convertArrayToObject(groupedData);
};


const sendErrorLog = (req, error) => {};

const addLog = (req, error) => {};

const getSupplierData = async (
  id = "",
  status = "",
  search = "",
  offset = "0",
  limit = "10",
  sort = "id",
  order = "desc"
) => {
  try {
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

    let srno = 0;

    data = await Promise.all(
      data.map(async (element) => {
        srno++;
        delete element.password;
        element.sr = srno;
        const b_details = await knex("business_details").where(
          "company_id",
          element.id
        );
        element.business_details = b_details;
        return element;
      })
    );

    data = await Promise.all(
      data.map(async (element) => {
        const f_details = await knex("financial_details").where(
          "company_id",
          element.id
        );
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
        element.tax_details = t_details;
        return element;
      })
    );
    return data;
  } catch (error) {
    return error.detail[0].message;
  }
};

function conversion(number, numerator, denominator) {
  return (number * denominator) / numerator;
}

function fieldCreate(
  name,
  module_name,
  panel_id,
  group_name,
  type,
  is_primary,
  display = "0",
  display_name,
  required = false
) {
  try {
    let insertStatus = "";

    if (is_primary === "1" && display === "0") {
      insertStatus = "Please select Display";
    }
    if (display === "0" && required === "1") {
      insertStatus = "Please select Display";
    }

    if (display === "1" && required === "0") {
      insertStatus = "Please select Required";
    }
    if (insertStatus === "") {
      const insertfield = knex("fields_config").insert({
        key: name,
        field_type: type,
        module_name,
        is_primary,
        display,
        required,
        group_name,
        panel_id,
        display_name,
      });

      insertStatus = insertfield;
    }

    return insertStatus;
  } catch (error) {
    return error.detail[0].message;
  }
}

const fieldDelete = async (id) => {
  try {
    const deletefield = knex("fields_config").where("id", id).del();
    return deletefield;
  } catch (error) {
    return error.detail[0].message;
  }
};

// Helper function to insert data into DynamoDB
async function insertData(params) {
  try {
    const result = await dynamodb.put(params).promise();
    return result;
  } catch (error) {
    console.error("Error inserting data into DynamoDB:", error);
    throw error;
  }
}

async function getData(tableName) {
  try {
    let params = {
      TableName: tableName,
    };
    const result = await dynamodb.scan(params).promise();
    return result;
  } catch (error) {
    console.error("Error getting data from DynamoDB:", error);
    throw error;
  }
}

async function deleteData(tableName, id, createdAt) {
  try {
    let params = {
      TableName: tableName,
      Key: { supplier_id: id, created_at: createdAt },
    };

    const check_record = await dynamodb.get(params).promise();
    // console.log(check_record);
    if (JSON.stringify(check_record) === "{}") {
      return "record does not exist";
    }
    await dynamodb.delete(params).promise();
    return true;
  } catch (error) {
    console.error("Error deleting data from DynamoDB:", error);
    return error;
  }
}

async function viewData(tableName, id, createdAt) {
  try {
    let params = {
      TableName: tableName,
      Key: { supplier_id: id, created_at: createdAt },
    };

    const check_record = await dynamodb.get(params).promise();

    return check_record;
  } catch (error) {
    return error;
  }
}

async function deleteInvoiceData(tableName, id) {
  try {
    let params = {
      TableName: tableName,
      Key: { id: id },
    };

    const check_record = await dynamodb.get(params).promise();
    console.log(check_record);
    if (JSON.stringify(check_record) === "{}") {
      return "record does not exist";
    }
    await dynamodb.delete(params).promise();
    return true;
  } catch (error) {
    console.error("Error deleting data from DynamoDB:", error);
    return error;
  }
}

async function viewInvoiceData(tableName, id) {
  try {
    let params = {
      TableName: tableName,
      Key: { id: id },
    };

    const check_record = await dynamodb.get(params).promise();

    return check_record;
  } catch (error) {
    return error;
  }
}

async function fetchUsernames(knex, userIdOrIds) {
  if (Array.isArray(userIdOrIds)) {
    const usernames = [];

    for (const userId of userIdOrIds) {
      const user = await knex("users")
        .where("id", userId)
        .select("username")
        .first();

      if (user) {
        usernames.push(user.username);
      }
    }

    return usernames;
  } else {
    const user = await knex("users")
      .where("id", userIdOrIds)
      .select("username")
      .first();

    if (user) {
      return [user.username];
    } else {
      return [];
    }
  }
}

async function supplierDetailsForLogin(user_id) {
  console.log("this is user id------->", user_id);

  const getUserLevel = await knex("users")
    .select("level")
    .where({ id: user_id });
  const level = getUserLevel[0].level;
  console.log("level", level);

  const getDeptId = await knex("approvers").select("department_id");
  console.log("getDeptId", getDeptId);

  if (level == 1) {
    const getDeptIdFrom = await knex("approvers")
      .select("department_id")
      .whereIn(
        user_id,
        knex.raw('JSON_UNQUOTE(JSON_EXTRACT(level_1_user_id, "$[0]"))')
      );
    console.log("level 1", getDeptIdFrom);
  }
  if (level == 2) {
    const getDeptIdFrom = await knex("approvers")
      .select("department_id")
      .whereIn(
        user_id,
        knex.raw('JSON_UNQUOTE(JSON_EXTRACT(level_2_user_id, "$[0]"))')
      );
    console.log("level 2", getDeptIdFrom);
  }
  if (level == 3) {
    const getDeptIdFrom = await knex("approvers")
      .select("department_id")
      .whereIn(
        user_id,
        knex.raw('JSON_UNQUOTE(JSON_EXTRACT(level_3_user_id, "$[0]"))')
      );
    console.log("level 3", getDeptIdFrom);
  }
  if (level == 4) {
    const getDeptIdFrom = await knex("approvers")
      .select("department_id")
      .whereIn(
        user_id,
        knex.raw('JSON_UNQUOTE(JSON_EXTRACT(level_4_user_id, "$[0]"))')
      );
    console.log("level 4", getDeptIdFrom);
    var depId = getDeptIdFrom[0].department_id;
  }

  console.log("this is department id from level 4", depId);

  const getSupplierDetails = await knex("supplier_details").where({
    department_id: depId,
  });

  if (getSupplierDetails == "") {
    return "supplier with this department id does not exist";
  }
  let supplierId = getSupplierDetails[0].id;

  const getBusinessDetails = await knex("business_details").where({
    company_id: supplierId,
  });

  const businessDetailsData = getBusinessDetails[0];

  const getFinancialDetails = await knex("financial_details").where({
    company_id: supplierId,
  });

  const financialDetailsData = getBusinessDetails[0];

  const getTaxDetails = await knex("tax_details").where({
    company_id: supplierId,
  });

  const taxDetailsData = getBusinessDetails[0];

  getSupplierDetails[0].BussinessDetails = businessDetailsData;
  getSupplierDetails[0].FinancialDetails = financialDetailsData;
  getSupplierDetails[0].TaxDetails = taxDetailsData;

  return getSupplierDetails;
}

const checkRoleMiddleware = async (req, res, next) => {
  const tokenTest = req.headers.authorization;

  if (tokenTest) {
    const token = tokenTest.split(" ")[1];

    try {
      const { jwtConfig } = constants;
      const decoded = jwt.verify(token, jwtConfig.secret);
      const userId = decoded.id;

      const user = await knex("users").where({ id: userId }).first();

      if (!user) {
        return res.status(401).json({ error: true, message: "User not found" });
      }

      const getAdminRoleId = await knex("role")
        .where("name", "Admin")
        .orWhere("name", "admin")
        .select("id")
        .first();
      const getSapUserRoleId = await knex("role")
        .where("name", "sapuser")
        .orWhere("name", "SapUser")
        .select("id")
        .first();

      if (
        user.role !== getAdminRoleId.id &&
        user.role !== getSapUserRoleId.id
      ) {
        return res
          .status(403)
          .json({ message: "You do not have permission for this" });
      }

      req.user = decoded;
      next();
    } catch (error) {
      return res.status(401).json({ error: true, message: "Invalid token" });
    }
  }

  if (!tokenTest) {
    return res.status(401).json({ error: true, message: "Token not provided" });
  }
};

import logUserActivity from "../../src/logs/logs.js"; // Adjust the path accordingly
import { get } from "http";

// const userActivityMiddleware = (req, res, next) => {
//   // Assuming you have a user object attached to the request
//   const userId = req.user.id;

//   console.log("userid is", userId);
//   const email = req.user.email;
//   console.log("email is", email);
//   const action = req.originalUrl === "/login" ? "Login" : "Accessed Endpoint";
//   // console.log("this is action",action);
//   const description = `${req.method} ${req.originalUrl} endpoint`;

//   // Log user activity
//   logUserActivity(userId, email, action, description);

//   next();
// };

const userActivityMiddleware = (req, res, next) => {
  // Assuming you have a user object attached to the request
  const userId = req.user.id;
  const email = req.user.email;
  const action = req.originalUrl === "/login" ? "Login" : "Accessed Endpoint";
  const description = `${req.method} ${req.originalUrl} endpoint`;
  const response =
    res.error && res.message
      ? { error: res.error, message: res.message }
      : null;
  // Log user activity to database
  logUserActivity(userId, email, action, description, null, response);

  next();
};

//useractivity of specific user view function
const getUserActivities = async (userId) => {
  try {
    // Fetch all activities for the user
    const userActivities = await knex("logs")
      .where({ userId: userId })
      .select("activities");

    console.log("userid", userId);

    // Return activities array if user exists, otherwise return an empty array
    return userActivities.length > 0
      ? JSON.parse(userActivities[0].activities)
      : [];
  } catch (error) {
    console.error("Error fetching user activities:", error);
    // Handle the error appropriately
    throw error;
  }
};

//For PODetail
const fetchSupplierDetail = async (sap_code = "") => {
  try {
    let data; //for getting exact result

    if (sap_code == "") {
      return data;
    }

    data = await knex("supplier_details");

    data = await Promise.all(
      data.map(async (element) => {
        srno++;
        delete element.password;
        element.sr = srno;
        const b_details = await knex("business_details").where(
          "company_id",
          element.id
        );
        element.business_details = b_details;
        return element;
      })
    );

    data = await Promise.all(
      data.map(async (element) => {
        const f_details = await knex("financial_details").where(
          "company_id",
          element.id
        );
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
        element.tax_details = t_details;
        return element;
      })
    );
    return data;
  } catch (error) {
    return error.detail[0].message;
  }
};

//For Approver name
const getApproverName = async (supplierId) => {
  try {
    let data = [];

    const getDepartmentId = await knex("supplier_details")
      .select("department_id")
      .where("id", supplierId);
    if (getDepartmentId.length <= 0) {
      return {
        error: true,
        message: "Can not find department Id.",
        data: [],
      };
    }

    const getDepartmentName = await knex("departments")
      .select("name")
      .where("id", getDepartmentId[0].department_id);
    if (getDepartmentName.length > 0) {
      data.push(getDepartmentName[0]);
    }

    const getUserId = await knex("approvers2")
      .select("level_1_user_id")
      .where(getDepartmentId[0]);

    if (getUserId.length <= 0) {
      return {
        error: true,
        message: "Can not find User.",
        data: [],
      };
    }

    getUserId[0].level_1_user_id = getUserId[0].level_1_user_id.replace(
      /\[|\]/g,
      ""
    );
    const getApproverName = await knex("users")
      .select("firstname", "lastname")
      .where("id", getUserId[0].level_1_user_id.replace(/\[|\]/g, ""));
    if (getApproverName.length <= 0) {
      return {
        error: true,
        message: "Can not find Approver Name",
        data: [],
      };
    }

    data.push(getApproverName[0]);
    return {
      error: false,
      message: "Approver Name fetched successfully.",
      data: data,
    };
  } catch (error) {
    return {
      error: true,
      message: error.message,
      data: [],
    };
  }
};

async function fetchPODetails(poNumber) {
  try {
    const data = JSON.stringify({
      PoNumber: poNumber,
    });

    const getSapKeys = await knex("sapConfiguration")
      .where("name", "sap-fetchPoList")
      .first();

    // console.log("this is sap keys",getSapKeys)

    const result = await po.createCSRF();
    // console.log("this is result",result)
    const token = result.token;
    const cookie = result.cookie;
    //${constants.admindetails.homePageUrl}
    const config = {
      method: "post",
      maxBodyLength: Infinity,
      url:
        `${constants.admindetails.homePageUrl}` +
        `/api/supplier/po/fetchPODetails`,
      //url: "https://dev.supplierx.aeonx.digital/api/supplier/po/fetchPODetails",
      headers: {
        "x-csrf-token": token,
        "Content-Type": "application/json",
        Cookie: `${cookie}`,
      },
      data: data,
    };

    const response = await po.fetchPoDetails(poNumber, token, cookie);
    if (response.error) {
      return response;
    }
    // console.log(JSON.stringify(response));
    return response;
  } catch (error) {
    const response = {
      error: true,
    };
    return response;
    console.error(error);
    // throw error;
  }
}

function validateEmail(email) {
  // Regular expression for RFC 5322 compliant email validation
  const regex =
    /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

  return regex.test(email);
}

const getPermissions = async (role, role_name) => {
  try {
    if (!role) {
      return {
        error: true,
        message: "Please provide Role.",
      };
    }
    const getRole = await knex("users_roles").where({ id: role });
    if (getRole.length <= 0) {
      return {
        error: true,
        message: "Role does not exist.",
      };
    }

    const getPermissions = await knex("roles_permissions").where({
      role_id: role,
    });
    if (getPermissions.length <= 0) {
      return {
        error: true,
        message: "This role have no permissions.",
      };
    }

    getPermissions[0].module_permission = JSON.parse(
      getPermissions[0].module_permission
    );

    getPermissions[0].module_permission =
      getPermissions[0].module_permission.module_permissions;

    let ids = [];

    getPermissions[0].module_permission.map((item) => {
      ids.push(item.id);
    });

    const module_keys = await knex("modules")
      .whereIn("id", ids)
      .select("module_key");
    if (module_keys.length != ids.length) {
      return {
        error: true,
        message: "Module not found",
        // data: permission,
      };
    }

    let permission = [];
    permission.push(role_name);
    getPermissions[0].module_permission.map((item, index) => {
      getPermissions[0].module_permission[index].name =
        module_keys[index].module_key;
      delete getPermissions[0].module_permission[index].id;
      item.permission.forEach((items, index2) => {
        if (items == 1) {
          switch (index2) {
            case 0:
              permission.push(`${module_keys[index].module_key}:Create`);
              break;
            case 1:
              permission.push(`${module_keys[index].module_key}:Read`);
              break;
            case 2:
              permission.push(`${module_keys[index].module_key}:Update`);
              break;
            case 3:
              permission.push(`${module_keys[index].module_key}:Delete`);
              break;
          }
        }
      });
    });
    // console.log("this is permission", permission);
    return {
      error: false,
      message: "permission added",
      data: permission,
    };
  } catch (error) {
    return {
      error: true,
      message: error.message,
    };
  }
};

///with ip and device
// async function newLogUserActivity(req, res, next) {
//   const { method, originalUrl, ip, headers } = req;
//   const timestamp = moment.tz("Asia/Kolkata").format("YYYY-MM-DD HH:mm:ss");
//   const userAgent = headers["user-agent"];
//   let responseData = [];

//   const originalWrite = res.write;
//   res.write = function (chunk, encoding, callback) {
//     responseData.push(chunk.toString());
//     return originalWrite.apply(res, arguments);
//   };

//   const originalEnd = res.end;
//   res.end = function (chunk, encoding, callback) {
//     if (chunk) {
//       responseData.push(chunk.toString());
//     }

//     let responseDataObj;
//     try {
//       responseDataObj = JSON.parse(responseData.join(""));
//     } catch (error) {
//       responseDataObj = {};
//     }

//     const { error, message } = responseDataObj;

//     const token = req.headers["authorization"];
//     if (token) {
//       const { jwtConfig } = constants;
//       const payload = jwt.decode(token.split(" ")[1], jwtConfig.secret);
//       const statusChangerId = payload.id;

//       knex("logstest")
//         .insert({
//           user_id: statusChangerId,
//           activity_type: "page_access",
//           route: originalUrl,
//           timestamp,
//           ip_address: ip,
//           device: userAgent,
//           browser: userAgent,
//           response: JSON.stringify({ error, message }),
//         })
//         .then(() => {
//           originalEnd.apply(res, arguments);
//         })
//         .catch(next);
//     } else {
//       res.status(401).json({
//         error: true,
//         message: "Token is required.",
//       });
//     }
//   };

//   next();
// }

// async function newLogUserActivity(req, res, next) {
//   const { method, originalUrl, headers } = req;
//   const userAgent = headers['user-agent'];
//   const timestamp = moment.tz("Asia/Kolkata").format("YYYY-MM-DD HH:mm:ss");
//   let responseData = [];

//   const originalWrite = res.write;
//   res.write = function(chunk, encoding, callback) {
//     responseData.push(chunk.toString());
//     return originalWrite.apply(res, arguments);
//   };

//   const originalEnd = res.end;
//   res.end = function(chunk, encoding, callback) {
//     if (chunk) {
//       responseData.push(chunk.toString());
//     }

//     let responseDataObj;
//     try {
//       responseDataObj = JSON.parse(responseData.join(''));
//     } catch (error) {
//       responseDataObj = {};
//     }

//     const { error, message } = responseDataObj;

//     const token = req.headers["authorization"];
//     if (token) {
//       const { jwtConfig } = constants;
//       const payload = jwt.decode(token.split(" ")[1], jwtConfig.secret);
//       const statusChangerId = payload.id;

//       knex('logstest').insert({
//         user_id: statusChangerId,
//         activity_type: 'page_access',
//         route: originalUrl,
//         timestamp,
//         response: JSON.stringify({ error, message })
//       }).then(() => {
//         originalEnd.apply(res, arguments);
//       }).catch(next);
//     } else {
//       res.status(401).json({
//         error: true,
//         message: "Token is required.",
//       });
//     }
//   };

//   // Call next to proceed with the request handling
//   next();
// }

async function newLogUserActivity(req, res, next) {
  const { method, originalUrl, ip, headers } = req;
  const userAgent = headers["user-agent"];
  const timestamp = moment.tz("Asia/Kolkata").format("YYYY-MM-DD HH:mm:ss");
  let responseData = [];

  const originalWrite = res.write;
  res.write = function (chunk, encoding, callback) {
    responseData.push(chunk.toString());
    return originalWrite.apply(res, arguments);
  };

  const originalEnd = res.end;
  res.end = function (chunk, encoding, callback) {
    if (chunk) {
      responseData.push(chunk.toString());
    }

    let responseDataObj;
    try {
      responseDataObj = JSON.parse(responseData.join(""));
    } catch (error) {
      responseDataObj = {};
    }

    const { error, message } = responseDataObj;

    const token = req.headers["authorization"];
    if (token) {
      const { jwtConfig } = constants;
      const payload = jwt.decode(token.split(" ")[1], jwtConfig.secret);
      const statusChangerId = payload.id;

      // Extract user ID from response locals (assuming it's stored there)
      const userId = responseDataObj?.data?.userData?.id;

      knex("logstest")
        .insert({
          user_id: userId || statusChangerId,
          activity_type: "page_access",
          route: originalUrl,
          method: method,
          ip_address: ip,
          device: userAgent,
          browser: userAgent,
          timestamp,
          response: JSON.stringify({ error, message }),
        })
        .then(() => {
          originalEnd.apply(res, arguments);
        })
        .catch(next);
    } else {
      res.status(401).json({
        error: true,
        message: "Token is required.",
      });
    }
  };

  // Call next to proceed with the request handling
  next();
}

// const mapping = async (data) => {
//   const extractedKeys = Object.keys(data.data);
//   const header = data.headers
//   const rows = data.rows
//   const getSapInvoice = await knex("form_field_configuration")
//     .select("fields")
//     .where("moduleName", "=", "sapInvoice");
//   if (getSapInvoice.length <= 0) {
//     return {
//       error: true,
//     };
//   }
//   let sapInvoice = JSON.parse(getSapInvoice[0].fields);
//   sapInvoice = sapInvoice[0];
//   const headerKeys = [];
//   for (const item of sapInvoice.header) {
//     headerKeys.push(item.key);
//   }

//   const itemKeys = [];
//   for (const item of sapInvoice.Items) {
//     itemKeys.push(item.key);
//   }

//   const mappedKeys=[]
//   const keys = []

//     for (const iterator2 of extractedKeys) {
//       switch (iterator2) {
//         case "Currency :":
//           mappedKeys.push({currency:extractedKeys['Currency :']})
//           keys.push('Currency :')
//           break
//         case "Invoice Date :":
//         mappedKeys.push({documentDate:extractedKeys['Invoice Date :']})
//         keys.push('Invoice Date :')
//         break
//         case "Date :":
//           mappedKeys.push({postingDate:extractedKeys['Date :']})
//           keys.push('Date :')
//           break;
//         case "Total":
//           mappedKeys.push({totalInvoiceAmount:extractedKeys["Total"]})
//           keys.push('Total')
//           break
//         case "VAT @ 5.00":
//           mappedKeys.push({taxAmount:extractedKeys['VAT @ 5.00']})
//           keys.push('VAT @ 5.00')
//           break
//       }
//     }
//     let QUANTITY = []
//     let UNIT_PRICE = []
//     let PRICE = []
//     let ITEMS = []

//     for (let i = 0; i < header.length; i++) {
//       const iterator = header[i];

//       for (let n=0; n<iterator.length; n++) {
//           iterator[i]=="QUANTITY"?QUANTITY.push(i):""
//           iterator[i]=="UNIT_PRICE"?UNIT_PRICE.push(i):""
//           iterator[i]=="PRICE"?PRICE.push(i):""
//       }
//       if (iterator.length > 0) {
//         const temp = []
//         for (let j = 0; j < rows[i].length; j++) {
//           console.log(rows[i][j],"this is rows")
//           // Your code logic for iterator2 here
//           const obj = {
//             quantity: rows[i][j][QUANTITY[0]],
//             unitPrice: rows[i][j][UNIT_PRICE[0]],
//             amount: rows[i][j][PRICE[0]],
//           }
//           temp.push(obj)
//         }
//         ITEMS.push(temp)
//       }
//     }

//     const sapKeys = {
//       header: headerKeys,
//       Items: itemKeys,
//     }
//     const mapped = {
//       header:mappedKeys,
//       Items: ITEMS,
//     }
//     const id = uuidv4()
//     const currentDateIST = moment
//     .tz("Asia/Kolkata")
//     .format("YYYY-MM-DD HH:mm:ss");
//     const insertIntoDb = await knex("field_mapping").insert({
//       mapId:id,
//       extractedKeys:JSON.stringify(extractedKeys),
//       sapKeys:JSON.stringify(sapKeys),
//       mappedKeys:JSON.stringify(mapped),
//       patternKeys:JSON.stringify(keys),
//       createdAt: currentDateIST,
//       updatedAt: currentDateIST,
//     })

//     if(insertIntoDb < 0){
//       return {
//         error: true,
//       };
//     }

//     return {
//       error: false,
//       data: {
//         keys,
//         mappedKeys,
//         ITEMS
//       }}
// };

const mapping = async (data) => {
  const extractedKeys = Object.keys(data.data);
  const header = data.headers;
  const rows = data.rows;

  // Fetch SAP fields configuration
  const getSapInvoice = await knex("form_field_configuration")
    .select("fields")
    .where("moduleName", "=", "sapInvoice");

  if (getSapInvoice.length <= 0) {
    return {
      error: true,
    };
  }

  let sapInvoice = JSON.parse(getSapInvoice[0].fields);
  sapInvoice = sapInvoice[0];

  const headerKeys = sapInvoice.header.map((item) => item.key);
  const itemKeys = sapInvoice.Items.map((item) => item.key);

  const mappedKeys = [];
  const keys = [];

  // Mapping extracted keys to SAP keys
  for (const iterator2 of extractedKeys) {
    switch (iterator2) {
      case "Currency :":
        mappedKeys.push({ currency: iterator2 });
        keys.push("Currency :");
        break;
      case "Invoice Date :":
        mappedKeys.push({ documentDate: iterator2 });
        keys.push("Invoice Date :");
        break;
      case "Date :":
        mappedKeys.push({ postingDate: iterator2 });
        keys.push("Date :");
        break;
      case "Total":
        mappedKeys.push({ totalInvoiceAmount: iterator2 });
        keys.push("Total");
        break;
      case "VAT @ 5.00":
        mappedKeys.push({ taxAmount: iterator2 });
        keys.push("VAT @ 5.00");
        break;
    }
  }

  let QUANTITY = [];
  let UNIT_PRICE = [];
  let PRICE = [];
  let ITEMS = [];

  for (let i = 0; i < header.length; i++) {
    const iterator = header[i];

    for (let n = 0; n < iterator.length; n++) {
      if (iterator[n] == "QUANTITY") QUANTITY.push(n);
      if (iterator[n] == "UNIT_PRICE") UNIT_PRICE.push(n);
      if (iterator[n] == "PRICE") PRICE.push(n);
    }
    if (iterator.length > 0) {
      const temp = [];
      for (let j = 0; j < rows[i].length; j++) {
        // Your code logic for iterator2 here
        const obj = {
          quantity: rows[i][j][QUANTITY[0]],
          unitPrice: rows[i][j][UNIT_PRICE[0]],
          amount: rows[i][j][PRICE[0]],
        };
        temp.push(obj);
      }
      ITEMS.push(temp);
    }
  }

  const sapKeys = {
    header: headerKeys,
    Items: itemKeys,
  };

  const mapped = {
    header: mappedKeys,
    Items: ITEMS,
  };

  const id = uuidv4();
  const currentDateIST = moment
    .tz("Asia/Kolkata")
    .format("YYYY-MM-DD HH:mm:ss");

  // const insertIntoDb = await knex("field_mapping").insert({
  //   mapId: id,
  //   extractedKeys: JSON.stringify(extractedKeys),
  //   sapKeys: JSON.stringify(sapKeys),
  //   mappedKeys: JSON.stringify(mapped),
  //   patternKeys: JSON.stringify(keys),
  //   createdAt: currentDateIST,
  //   updatedAt: currentDateIST,
  // });

  // if (insertIntoDb < 0) {
  //   return {
  //     error: true,
  //   };
  // }

  return {
    error: false,
    data: {
      keys,
      mappedKeys,
      ITEMS,
    },
  };
};

function parseDate(inputDate) {
  // Normalize input to avoid issues with delimiters
  let cleanedInput = inputDate.replace(/[\/\-\.\s]/g, " ").trim();

  // Define month mappings for abbreviated month names
  const monthMap = {
    Jan: 0,
    Feb: 1,
    Mar: 2,
    Apr: 3,
    May: 4,
    Jun: 5,
    Jul: 6,
    Aug: 7,
    Sep: 8,
    Oct: 9,
    Nov: 10,
    Dec: 11,
  };

  let formats = [
    {
      regex: /^\d{4} \d{2} \d{2}$/,
      parse: (parts) => new Date(parts[0], parts[1] - 1, parts[2]),
    }, // YYYY MM DD
    {
      regex: /^\d{2} \d{2} \d{4}$/,
      parse: (parts) => new Date(parts[2], parts[1] - 1, parts[0]),
    }, // DD MM YYYY
    { regex: /^[A-Za-z]+ \d{1,2}, \d{4}$/, parse: (str) => new Date(str) }, // Month DD, YYYY
    { regex: /^\d{1,2} [A-Za-z]+ \d{4}$/, parse: (str) => new Date(str) }, // DD Month YYYY
    { regex: /^\d{4} [A-Za-z]+ \d{1,2}$/, parse: (str) => new Date(str) }, // YYYY Month DD
    {
      regex: /^\d{8}$/,
      parse: (str) =>
        new Date(str.slice(0, 4), str.slice(4, 6) - 1, str.slice(6, 8)),
    }, // YYYYMMDD
    {
      regex: /^\d{2} \d{2} \d{4}$/,
      parse: (parts) => new Date(parts[2], parts[1] - 1, parts[0]),
    }, // DD.MM.YYYY
    {
      regex: /^\d{1,2} [A-Za-z]+ \d{2}$/,
      parse: (parts) => {
        let day = parseInt(parts[0], 10);
        let month = monthMap[parts[1]];
        let year = parseInt(parts[2], 10) + 2000; // Handling 2-digit year as 2000+
        return new Date(year, month, day);
      },
    }, // DD-MMM-YY
  ];

  let dateObject = null;

  for (let format of formats) {
    let match = cleanedInput.match(format.regex);
    if (match) {
      if (typeof format.parse === "function") {
        dateObject = format.parse(match[0].split(" "));
      } else {
        dateObject = new Date(format.parse(...match[0].split(" ")));
      }
      break;
    }
  }

  // Check for valid date object
  if (!dateObject || isNaN(dateObject.getTime())) {
    return "Invalid Date";
  }

  // Extract year, month, and day components from the date object
  let year = dateObject.getFullYear();
  let month = (dateObject.getMonth() + 1).toString().padStart(2, "0");
  let day = dateObject.getDate().toString().padStart(2, "0");

  // Concatenate components to form the formatted date string
  let formattedDate = `${year}-${month}-${day}`;

  return formattedDate;
}

const sapMapping = async (data, poNumber) => {
  const extractedKeys = Object.keys(data.data);
  const extractedData = data.data;
  const getFieldMappings = await knex("field_mapping")
    .select("*")
    .whereNotNull("patternKeys");
  let longestMatchMapId = null;
  let longestMatchLength = 0;
  let obj2 = [];

  const getHeaders = data.headers;
  const getRows = data.rows;
  let items = [];
  let j = 0;
  const storageLocation = await knex("storage_locations")
    .select("code")
    .first();
  for (const header of getHeaders) {
    const row = getRows[j];
    for (let i = 0; i < row.length; i++) {
      const obj = {
        invoiceItemId: 0,
        itemName: "",
        PO_Item: "",
        amount: 0,
        TaxCode: "",
        plant: "",
        quantity: 0,
        hsnCode: "",
        poUnit: "",
        grnDoc: "",
        grnDocYear: "",
        grnDocItem: "",
        SES: "",
        serviceActivity: "",
      };
      obj.invoiceItemId = i + 1;
      for (let k = 0; k < header.length; k++) {
        switch (header[k]) {
          case "QUANTITY":
            const quantity = row[i][k] ? row[i][k].replace(/,/g, "") : 0;
            obj.quantity = parseFloat(quantity);

            break;
          case "ITEM":
            // console.log(row[i][k])
            obj.itemName = row[i][k];

            break;
          case "UNIT_PRICE":
            const price = row[i][k]
              ? row[i][k].replace(/,/g, "").replace(/[^\d.]/g, "")
              : 0;
            obj.price = parseFloat(price);

            break;

          case "PRODUCT_CODE":
            obj.hsnCode = row[i][k];

            break;
          case "PRICE":
            const amount = row[i][k]
              ? row[i][k].replace(/,/g, "").replace(/[^\d.]/g, "")
              : 0;
            obj.amount = parseFloat(amount);
            break;
        }
      }

      items.push(obj);
    }
    j++;
  }

  // getFieldMappings.forEach((mapping, index) => {
  //   let arr = [];
  //   const mappedKeysString = mapping.patternKeys;
  //   const dbpatternKeys = JSON.parse(mappedKeysString);
  //   const mapId = mapping.mapId;
  //   // const allMatched = dbpatternKeys.every(key => extractedKeys.includes(key));
  //   // if (allMatched) {
  //   //     if (dbpatternKeys.length > longestMatchLength) {
  //   //         longestMatchMapId = mapId;
  //   //         longestMatchLength = dbpatternKeys.length;
  //   //     }
  //   // }

  //   let counter = 0;
  //   const matchedKeys = dbpatternKeys.filter((key) =>
  //     extractedKeys.includes(key)
  //   );
  //   // let i = 0;

  //   // for (const iterator of dbpatternKeys) {
  //   //   let j = 0;
  //   //   for (const iterator2 of extractedKeys) {
  //   //     const processedStr1 = iterator
  //   //       .replace(/[^a-zA-Z0-9 ]/g, "")
  //   //       .toLowerCase()
  //   //       .replace(/\s/g, "");
  //   //     const processedStr2 = iterator2
  //   //       .replace(/[^a-zA-Z0-9 ]/g, "")
  //   //       .toLowerCase()
  //   //       .replace(/\s/g, "");
  //   //     if (processedStr1 == processedStr2) {
  //   //       console.log(processedStr1,processedStr2)
  //   //       counter++;
  //   //       const abc = { key: `${i}`, value: `${j}` };
  //   //       obj2.push(abc);
  //   //     }
  //   //     j++;
  //   //   }
  //   //   i++;
  //   // }
  //   for (let i = 0; i < dbpatternKeys.length; i++) {
  //     const iterator = dbpatternKeys[i];
  //     for (let j = 0; j < extractedKeys.length; j++) {
  //       const iterator2 = extractedKeys[j];
  //       const processedStr1 = iterator
  //         .replace(/[^a-zA-Z0-9 ]/g, "")
  //         .toLowerCase()
  //         .replace(/\s/g, "");
  //       const processedStr2 = iterator2
  //         .replace(/[^a-zA-Z0-9 ]/g, "")
  //         .toLowerCase()
  //         .replace(/\s/g, "");
  //       if (processedStr1 === processedStr2) {
  //         if (arr.includes(processedStr1)) {
  //           continue;
  //         } else {
  //           arr.push(processedStr1);
  //           counter++;
  //           const abc = { key: `${iterator}`, value: `${iterator2}` };
  //           obj2.push(abc);
  //         }
  //       }
  //     }
  //   }
  //   const matchLength = matchedKeys.length;
  //   if (counter > longestMatchLength) {
  //     longestMatchMapId = mapId;
  //     longestMatchLength = matchLength;
  //   }
  // });
  let arr2 = [];
  for (const mapping of getFieldMappings) {
    let arr = [];
    const mappedKeysString = mapping.patternKeys;
    const dbpatternKeys = JSON.parse(mappedKeysString);
    const mapId = mapping.mapId;

    let counter = 0;
    const matchedKeys = dbpatternKeys.filter((key) =>
      extractedKeys.includes(key)
    );

    for (const iterator of dbpatternKeys) {
      for (const iterator2 of extractedKeys) {
        const processedStr1 = iterator
          .replace(/[^a-zA-Z0-9 ]/g, "")
          .toLowerCase()
          .replace(/\s/g, "");
        const processedStr2 = iterator2
          .replace(/[^a-zA-Z0-9 ]/g, "")
          .toLowerCase()
          .replace(/\s/g, "");
        if (processedStr1 === processedStr2) {
          if (arr.includes(processedStr1)) {
            continue;
          } else {
            arr.push(processedStr1);
            counter++;
            const abc = { key: `${iterator}`, value: `${iterator2}` };
            obj2.push(abc);
          }
        }
      }
    }
    const matchLength = matchedKeys.length;
    if (counter > longestMatchLength) {
      longestMatchMapId = mapId;
      longestMatchLength = matchLength;
    }
  }

  if (longestMatchMapId !== null) {
    const getmappedKeys = await knex("field_mapping")
      .select("mappedKeys", "patternKeys", "sapKeys")
      .where({ mapId: longestMatchMapId });
    const mappedKeysString = getmappedKeys[0].mappedKeys;
    const patternKeysString = getmappedKeys[0].patternKeys;
    const mappedKeys = JSON.parse(mappedKeysString);
    const patternKeys = JSON.parse(patternKeysString);
    const mappedKeys2 = Object.keys(mappedKeys);

    const sapKeysString = getmappedKeys[0].sapKeys;
    const sapKeys = JSON.parse(sapKeysString);

    const obj = {};
    for (const iterator2 of obj2) {
      const index = iterator2["value"];
      const keyIndex = iterator2["key"];
      obj[keyIndex] = extractedData[index];
    }
    const object = {};
    let ind = 0;
    for (const iterator of sapKeys) {
      const val = mappedKeys[iterator];
      // console.log("val",val)
      const temp = obj[val];
      if (temp) {
        object[iterator] = temp;
      } else {
        object[iterator] = "";
      }

      ind++;
    }
    let poDetails;
    poDetails = await fetchPODetails(poNumber);
    if (poDetails.error == true) {
      const checkInDb = await knex("purchase_orders").where("poNo", poNumber);
      if (checkInDb.length > 0) {
        poDetails = [];
        poDetails = JSON.parse(checkInDb[0].poItems);
      } else {
        poDetails = [];
      }
    }

    const grnANDses = async (poDetails, ite, type) => {
      if (type == "ZSER") {
        const items = ite;
        const currentDateIST = moment.tz("Asia/Kolkata").format("YYYY-MM-DD");
        const header = {
          SERVICE_ENTERY_SHEET: "",
          SHORT_TEXT: "service",
          PURCHASING_DOCUMENT: "",
          ITEM: "",
          DOCUMENT_DATE: poDetails.PO_HEADER.DOC_DATE,
          POSTING_DATE: currentDateIST,
          REFERENCE: poDetails.PO_NUMBER,
          DOCUMENT_HEADER_TEXT: poDetails.PO_HEADER_TEXTS,
          GROSS_VALUE: 0,
          INVOICE_NUMBER: "",
          INVOICE_DATE: currentDateIST,
        };
        const UNIQUE_TRANSACTION_ID = uuidv4();
        let temp = 1;
        let total = 0;
        const ITEM = [];
        items.forEach((i, index) => {
          if (i.quantity >= 0) {
            ITEM.push({
              ACTIVITY_NUMBER: temp,
              LINE_NUMBER: temp,
              SHORT_TEXT: i.serviceName
                ? i.serviceName
                : poDetails.PO_ITEM_SERVICES[index]
                ? poDetails.PO_ITEM_SERVICES[index].SHORT_TEXT
                : poDetails.PO_ITEM_SERVICES[0].SHORT_TEXT,
              QUANTITY: i.quantity == "" || i.quantity == 0 ? 1 : i.quantity,
              UOM: i.uom
                ? i.uom
                : poDetails.PO_ITEMS[index]
                ? poDetails.PO_ITEMS[index].UNIT
                : poDetails.PO_ITEMS[0].UNIT,
              NET_VALUE: i.price
                ? i.price
                : poDetails.PO_ITEMS[index] != undefined
                ? poDetails.PO_ITEMS[index].NET_PRICE
                : poDetails.PO_ITEMS[0].NET_PRICE,
              GROSS_PRICE:
                i.amount || i.amount == 0
                  ? i.amount
                  : items[index].quantity *
                    (poDetails.PO_ITEMS[index] != undefined
                      ? poDetails.PO_ITEMS[index].NET_PRICE
                      : poDetails.PO_ITEMS[0].NET_PRICE),
              TAX_CODE: i.PO_Item,
              TAX_TARRIF_CODE: poDetails.PO_NUMBER,
            });
            temp++;
            total +=
              i.amount || i.amount == 0
                ? i.amount
                : items[index].quantity == 0 || items[index].quantity == ""
                ? 1
                : items[index].quantity *
                  (poDetails.PO_ITEMS[index] != undefined
                    ? poDetails.PO_ITEMS[index].NET_PRICE
                    : poDetails.PO_ITEMS[0].NET_PRICE);
          }
        });
        header.GROSS_VALUE = total;
        return {
          KEY: "X",
          UNIQUE_TRANSACTION_ID: UNIQUE_TRANSACTION_ID,
          poNo: poDetails.PO_NUMBER,
          header,
          ITEM,
          TIME_STAMP: currentDateIST,
        };
      }

      const currentDateIST = moment.tz("Asia/Kolkata").format("YYYY-MM-DD");
      const items = ite;
      let ITEM = [];
      let GRNITEM = [];
      let BATCH = [];
      const UNIQUE_TRANSACTION_ID = uuidv4();
      items.forEach((i, index) => {
        if (i.quantity >= 0) {
          ITEM.push({
            DOCUMENT_DATE: poDetails.PO_HEADER.DOC_DATE,
            DELIVERY_DATE: currentDateIST,
            SHORT_TEXT: poDetails.PO_ITEMS[index]
              ? poDetails.PO_ITEMS[index].SHORT_TEXT
              : i.itemName,
            STORAGE_LOC:
              i.storageLocation != "" && i.storageLocation != undefined
                ? i.storageLocation
                : poDetails.PO_ITEMS[index]
                ? poDetails.PO_ITEMS[index].STORE_LOC != "" &&
                  poDetails.PO_ITEMS[index].STORE_LOC != undefined
                  ? poDetails.PO_ITEMS[index].STORE_LOC
                  : storageLocation.code
                : storageLocation.code,
            QUANTITY: i.quantity == "" || i.quantity == 0 ? 1 : i.quantity,
            PO_ITEM: i.po_Item
              ? i.po_Item
              : poDetails.PO_ITEMS[index]
              ? poDetails.PO_ITEMS[index].PO_ITEM
              : poDetails.PO_ITEMS[0].PO_ITEM,
            REFERENCE: poDetails.PO_NUMBER,
          });
        }
      });

      // const insertGrn = await knex("grns").insert({
      //   poNo: poNo.PO_NUMBER,
      //   // asn_id: asn_id,
      //   grnUniqueId: UNIQUE_TRANSACTION_ID,
      //   postingDate: poDetails.PO_HEADER.DOC_DATE,
      //   item: JSON.stringify(ITEM),
      //   documentDate: poDetails.PO_HEADER.DOC_DATE,
      //   companyCode: poDetails.PO_HEADER.CO_CODE,
      //   batchNo: poDetails.PO_ITEM_SCHEDULES.BATCH,
      //   created_at: currentDateIST,
      // });

      const getVendorCode = await knex("purchase_orders_list")
        .select("supplierId")
        .where("poNumber", poDetails.PO_NUMBER)
        .first();

      items.forEach((i, index) => {
        if (i.quantity >= 0) {
          GRNITEM.push({
            MATERIAL_NO: i.material
              ? i.material
              : poDetails.PO_ITEMS[index]
              ? poDetails.PO_ITEMS[index].MATERIAL
              : poDetails.PO_ITEMS[0].MATERIAL,
            STORAGE_LOC:
              i.storageLocation != "" && i.storageLocation != undefined
                ? i.storageLocation
                : poDetails.PO_ITEMS[index]
                ? poDetails.PO_ITEMS[index].STORE_LOC != "" &&
                  poDetails.PO_ITEMS[index].STORE_LOC != undefined
                  ? poDetails.PO_ITEMS[index].STORE_LOC
                  : storageLocation.code
                : storageLocation.code,
            QUANTITY: i.quantity != "" && i.quantity != 0 ? i.quantity : 1,
            UOM: i.uom
              ? i.uom
              : poDetails.PO_ITEMS[index]
              ? poDetails.PO_ITEMS[index].BASE_UOM_ISO
              : poDetails.PO_ITEMS[0].BASE_UOM_ISO,
            STOCK_TYPE: "",
            SPECIAL_STOCK_INDICATOR: poDetails.PO_ITEMS[index]
              ? poDetails.PO_ITEMS[index].SPEC_STOCK
              : i.specStock,
            PO_ITEM: i.po_Item
              ? i.po_Item
              : poDetails.PO_ITEMS[index]
              ? poDetails.PO_ITEMS[index].PO_ITEM
              : poDetails.PO_ITEMS[0].PO_ITEM,
            PO_NUMBER: poDetails.PO_NUMBER,
          });
          BATCH.push(
            poDetails.PO_ITEM_SCHEDULES[index]
              ? poDetails.PO_ITEM_SCHEDULES[index].BATCH
              : poDetails.PO_ITEM_SCHEDULES[0].BATCH
          );
        }
      });

      const grn = {
        UNIQUE_TRANSACTION_ID: UNIQUE_TRANSACTION_ID,
        POSTING_DATE: currentDateIST,
        ITEM: GRNITEM,
        DOCUMENT_DATE: poDetails.PO_HEADER.DOC_DATE,
        COMPANY_CODE: poDetails.PO_HEADER.CO_CODE,
        BATCH_NO: BATCH,
        TIME_STAMP: currentDateIST,
      };

      return {
        UNIQUE_TRANSACTION_ID: UNIQUE_TRANSACTION_ID,
        PO_NUMBER: poDetails.PO_NUMBER,
        VENDOR: getVendorCode != undefined ? getVendorCode.supplierId : "",
        ITEM: ITEM,
        GRN: grn,
      };
    };

    const reference = poNumber;
    let header = {};
    const Items = [];
    const timeNow = moment.tz("Asia/Kolkata").format("YYYY-MM-DD");
    if (poDetails) {
      header = {
        supplierGST: object["supplierGST"] ? object["supplierGST"] : "",
        companyGST: object["companyGST"] ? object["companyGST"] : "",
        GST_invoiceNo: object["GST_InvoiceNo"] ? object["GST_InvoiceNo"] : "",
        postingDate: object["postingDate"] ? object["postingDate"] : timeNow,
        documentDate: object["documentDate"]
          ? object["documentDate"]
          : poDetails.PO_HEADER.DOC_DATE,
        reference: reference,
        headerText: object["headerText"]
          ? object["headerText"]
          : poDetails.PO_HEADER_TEXTS,
        companyCode: object["companyCode"]
          ? object["companyCode"]
          : poDetails.PO_HEADER.CO_CODE,
        currency: object["currency"]
          ? object["currency"]
          : poDetails.PO_HEADER.CURRENCY,
        baselineDate: object["baselineDate"] ? object["baselineDate"] : timeNow,
        totalInvoiceAmount: object["totalInvoiceAmount"]
          ? object["totalInvoiceAmount"]
          : "",
        parkPostIndicator: items.invoiceType
          ? items.invoiceType == "parkInvoiced"
            ? "park"
            : "post"
          : "park",
        taxAmount: object["taxAmount"] ? object["taxAmount"] : 0,
      };
      let processedItems = [];
      let taxAmount = header["taxAmount"];
      let total = 0;
      let tax = 0;
      let temp = 1;

      const taxesByCode = {};
      for (const iterator of poDetails.IT_TAXES) {
        taxesByCode[iterator.ITEM] = taxesByCode[iterator.ITEM]
          ? parseFloat(taxesByCode[iterator.ITEM]) +
            parseFloat(iterator.TAX_PER)
          : parseFloat(iterator.TAX_PER);
      }
      const taxKeys = Object.keys(taxesByCode);

      // const arrayA = items.map((item) => item.itemName.split("\n")[0]);
      // const arrayB =
      //   poDetails.PO_HEADER.DOC_TYPE != "ZSER"
      //     ? poDetails.PO_ITEMS.map((item) => item.SHORT_TEXT)
      //     : poDetails.PO_ITEM_SERVICES.map((item) => item.SHORT_TEXT);
      //     console.log("this is array from textract",arrayA)
      //     console.log("this is array from PO",arrayB)
      //     const matchingIndexes = arrayA
      //     .map((item, index) => {
      //         const indexInB = arrayB.findIndex(
      //             (bItem) => bItem.toLowerCase().includes(item.toLowerCase())
      //         );
      //         if (indexInB !== -1) {
      //             items[index].index = indexInB;
      //             return { item, matchedPart: item, indexInB };
      //         }
      //         return null;
      //     })
      //     .filter((result) => result !== null);
      //   // console.log("this is mathcing result",matchingIndexes)
      // items.sort((a, b) => a.index - b.index);
      items.forEach((i, index) => {
        if (i.quantity >= 0) {
          i.subTotal ? (taxAmount += i.gst ? i.gst : 0) : (taxAmount += 0);
          total += i.amount;
          if (taxAmount == 0 || taxAmount == "") {
            const amt =
              i.amount || i.amount == 0
                ? i.amount
                : items[index].quantity != "" && items[index].quantity != 0
                ? items[index].quantity
                : 1 *
                  (i.amount
                    ? i.amount
                    : poDetails.PO_ITEMS[index] != undefined
                    ? poDetails.PO_ITEMS[index].NET_PRICE
                    : 0);

            const tx = taxesByCode[taxKeys[index]]
              ? taxesByCode[taxKeys[index]]
              : 0;
            tax += i.gst ? i.gst : (amt * tx) / 100;
          }
          Items.push({
            itemName: i.itemName ? i.itemName : "",
            pricePerUnit: i.price ? i.price : 0,
            invoiceItemId: temp,
            // po: i.poNo ? i.poNo : poNumber,
            PO_Item: i.PO_Item
              ? i.PO_Item
              : poDetails.PO_ITEMS[index]
              ? poDetails.PO_ITEMS[index].PO_ITEM.toString()
              : "",
            SES: "",
            amount:
              i.amount || i.amount == 0
                ? i.amount
                : items[index]
                ? items[index].quantity != "" && items[index].quantity != 0
                  ? items[index].quantity
                  : 1 * poDetails.PO_ITEMS[index].NET_PRICE
                : 0,
            TaxCode: poDetails.PO_ITEMS[index]
              ? poDetails.PO_ITEMS[index].TAX_CODE
              : "",
            plant: poDetails.PO_ITEMS[i.index]
              ? poDetails.PO_ITEMS[index].PLANT
              : "",
            quantity: i.quantity != "" && i.quantity != 0 ? i.quantity : 1,
            serviceActivity: "",
            hsnCode: i.hsnCode ? i.hsnCode.replace(/[^a-zA-Z0-9]/g, "") : "",
            hsnCodePO: poDetails.PO_ITEMS[i.index]
              ? poDetails.PO_ITEMS[index].CTR_KEY_QM
              : poDetails.PO_ITEMS[index]
              ? poDetails.PO_ITEMS[index].CTR_KEY_QM
              : "",
            poUnit: i.unit
              ? i.unit
              : poDetails.PO_HEADER.DOC_TYPE != "ZSER"
              ? poDetails.PO_ITEMS[index]
                ? poDetails.PO_ITEMS[index].BASE_UOM
                  ? poDetails.PO_ITEMS[index].BASE_UOM
                  : poDetails.PO_ITEMS[index].BASE_UOM_ISO
                : ""
              : poDetails.PO_ITEM_SERVICES[index]
              ? poDetails.PO_ITEM_SERVICES[index].BASE_UOM
                ? poDetails.PO_ITEM_SERVICES[index].BASE_UOM
                : poDetails.PO_ITEM_SERVICES[index].BASE_UOM_ISO
              : "",
            grnDoc: "",
            grnDocYear: "",
            grnDocItem: "",
          });
          // Items.push(...processedItems)
          temp++;
          // items[index]=i
        }
      });

      // Items.push(...processedItems)
      header.taxAmount =
        taxAmount != "" ? parseFloat(taxAmount.replace(/[^0-9.]/g, "")) : tax;
      header.totalInvoiceAmount = total;
      // const checkPoDetails = await knex("invoicesToSap").where(
      //   "poNo",
      //   poNumber
      // );
      // // .andWhere("asn_id", asn_id);
      // const uniqId = uuidv4();
      // if (checkPoDetails.length <= 0) {
      //   const emptyArray = [];
      //   const insertPoDetails = await knex("invoicesToSap").insert({
      //     poNo: poNumber,
      //     // asn_id: asn_id,
      //     invoiceUniqueId: uniqId,
      //     invoiceCode: JSON.stringify(emptyArray),
      //     header: JSON.stringify(header),
      //     items: JSON.stringify(Items),
      //   });
      // }
      function formatDate(inputDate) {
        console.log(inputDate);
        // Create a new Date object from the input date string
        let dateObject = new Date(inputDate);

        // Extract year, month, and day components from the date object
        let year = dateObject.getFullYear();
        let month = (dateObject.getMonth() + 1).toString().padStart(2, "0"); // Add 1 to month because it is zero-based
        let day = dateObject.getDate().toString().padStart(2, "0");

        // Concatenate components to form the formatted date string
        let formattedDate = `${year}-${month}-${day}`;

        return formattedDate;
      }
      header.postingDate = parseDate(header.postingDate);
      header.documentDate = parseDate(header.documentDate);
      header.baselineDate = parseDate(header.baselineDate);

      const frieght = {
        freightConditionCode: "",
        poItem: Items[0] ? Items[0].PO_Item : "",
        grnDoc: "",
        grnDocYear: "",
        grnDocItem: "",
        taxCode: Items[0] ? Items[0].TaxCode : "",
        frieghtAmount: "",
        Quantity: "",
      };

      const grn = await grnANDses(
        poDetails,
        Items,
        poDetails.PO_HEADER.DOC_TYPE
      );
      // console.log("this is header",header)
      return {
        error: false,
        IRN: object["IRN"] ? object["IRN"] : "",
        warning: "",
        data: header,
        items: Items,
        frieght: frieght,
        grn: grn,
      };
    } else {
      function formatDate(inputDate) {
        console.log(inputDate);
        // Create a new Date object from the input date string
        let dateObject = new Date(inputDate);

        // Extract year, month, and day components from the date object
        let year = dateObject.getFullYear();
        let month = (dateObject.getMonth() + 1).toString().padStart(2, "0"); // Add 1 to month because it is zero-based
        let day = dateObject.getDate().toString().padStart(2, "0");

        // Concatenate components to form the formatted date string
        let formattedDate = `${year}-${month}-${day}`;

        return formattedDate;
      }
      object.postingDate
        ? (object.postingDate = parseDate(object.postingDate))
        : object.postingDate;
      object.documentDate
        ? (object.documentDate = parseDate(object.documentDate))
        : object.documentDate;
      object.baselineDate
        ? (object.baselineDate = parseDate(object.baselineDate))
        : object.baselineDate;
      object.totalInvoiceAmount = object.totalInvoiceAmount
        ? object.totalInvoiceAmount.replace(/[^0-9]/g, "")
        : object.totalInvoiceAmount;
      return {
        error: false,
        data: object,
        items: items,
      };
    }

    // object.postingDate = timeNow;
  } else {
    const getSapInvoice = await knex("form_field_configuration")
      .select("fields")
      .where("moduleName", "=", "sapInvoice");

    if (getSapInvoice.length <= 0) {
      return {
        error: true,
      };
    }

    let sapInvoice = JSON.parse(getSapInvoice[0].fields);
    sapInvoice = sapInvoice[0];

    const headerKeys = sapInvoice.header.map((item) => item.key);
    const itemKeys = sapInvoice.Items.map((item) => item.key);

    const getHeaders = data.headers;
    const getRows = data.rows;

    let items = [];
    let j = 0;
    for (const header of getHeaders) {
      const row = getRows[j];
      for (let i = 0; i < row.length; i++) {
        const obj = {
          invoiceItemId: 0,
          itemName: "",
          PO_Item: "",
          amount: 0,
          TaxCode: "",
          plant: "",
          quantity: 0,
          hsnCode: "",
          poUnit: "",
          grnDoc: "",
          grnDocYear: "",
          grnDocItem: "",
          SES: "",
          serviceActivity: "",
        };
        obj.invoiceItemId = i + 1;
        for (let k = 0; k < header.length; k++) {
          switch (header[k]) {
            case "QUANTITY":
              const quantity = row[i][k] ? row[i][k].replace(/,/g, "") : 0;
              obj.quantity = parseFloat(quantity);

              break;
            case "ITEM":
              obj.itemName = row[i][k];

              break;
            case "UNIT_PRICE":
              const price = row[i][k]
                ? row[i][k].replace(/,/g, "").replace(/[^\d.]/g, "")
                : 0;
              obj.price = parseFloat(price);

              break;

            case "PRODUCT_CODE":
              obj.hsnCode = row[i][k] ? row[i][k] : "";

            case "PRICE":
              const amount = row[i][k]
                ? row[i][k].replace(/,/g, "").replace(/[^\d.]/g, "")
                : 0;
              obj.amount = parseFloat(amount);
              break;
          }
        }

        items.push(obj);
      }
      j++;
    }

    const object = data.data;

    let poDetails;
    poDetails = await fetchPODetails(poNumber);
    if (poDetails.error == true) {
      const checkInDb = await knex("purchase_orders").where("poNo", poNumber);
      if (checkInDb.length > 0) {
        poDetails = [];
        poDetails = JSON.parse(checkInDb[0].poItems);
      } else {
        poDetails = [];
      }
    }
    const grnANDses = async (poDetails, ite, type) => {
      if (type == "ZSER") {
        const items = ite;
        const currentDateIST = moment.tz("Asia/Kolkata").format("YYYY-MM-DD");
        const header = {
          SERVICE_ENTERY_SHEET: "",
          SHORT_TEXT: "service",
          PURCHASING_DOCUMENT: "",
          ITEM: "",
          DOCUMENT_DATE: poDetails.PO_HEADER.DOC_DATE,
          POSTING_DATE: poDetails.PO_HEADER.DOC_DATE,
          REFERENCE: poDetails.PO_NUMBER,
          DOCUMENT_HEADER_TEXT: poDetails.PO_HEADER_TEXTS,
          GROSS_VALUE: 0,
          INVOICE_NUMBER: "",
          INVOICE_DATE: currentDateIST,
        };
        const UNIQUE_TRANSACTION_ID = uuidv4();
        let temp = 1;
        let total = 0;
        const ITEM = [];
        items.forEach((i, index) => {
          // console.log("this is item", i);
          if (i.quantity >= 0) {
            ITEM.push({
              ACTIVITY_NUMBER: temp,
              LINE_NUMBER: temp,
              SHORT_TEXT: i.serviceName
                ? i.serviceName
                : poDetails.PO_ITEM_SERVICES[index]
                ? poDetails.PO_ITEM_SERVICES[index].SHORT_TEXT
                : poDetails.PO_ITEM_SERVICES[0].SHORT_TEXT,
              QUANTITY: i.quantity != "" && i.quantity != 0 ? i.quantity : 1,
              UOM: i.uom
                ? i.uom
                : poDetails.PO_ITEMS[index]
                ? poDetails.PO_ITEMS[index].UNIT
                : poDetails.PO_ITEMS[0].UNIT,
              NET_VALUE: i.price
                ? i.price
                : poDetails.PO_ITEMS[index] != undefined
                ? poDetails.PO_ITEMS[index].NET_PRICE
                : poDetails.PO_ITEMS[0].NET_PRICE,
              GROSS_PRICE:
                i.amount || i.amount == 0
                  ? i.amount
                  : items[index].quantity != "" && items[index].quantity != 0
                  ? items[index].quantity
                  : 1 *
                    (poDetails.PO_ITEMS[index] != undefined
                      ? poDetails.PO_ITEMS[index].NET_PRICE
                      : poDetails.PO_ITEMS[0].NET_PRICE),
              TAX_CODE: i.PO_Item,
              TAX_TARRIF_CODE: poDetails.PO_NUMBER,
            });
            temp++;
            total +=
              i.amount || i.amount == 0
                ? i.amount
                : items[index].quantity != "" && items[index].quantity != 0
                ? items[index].quantity
                : 1 *
                  (poDetails.PO_ITEMS[index] != undefined
                    ? poDetails.PO_ITEMS[index].NET_PRICE
                    : poDetails.PO_ITEMS[0].NET_PRICE);
          }
        });
        header.GROSS_VALUE = total;
        return {
          KEY: "X",
          UNIQUE_TRANSACTION_ID: UNIQUE_TRANSACTION_ID,
          poNo: poDetails.PO_NUMBER,
          header,
          ITEM,
          TIME_STAMP: currentDateIST,
        };
      } else {
        const items = ite;

        const currentDateIST = moment
          .tz("Asia/Kolkata")
          .format("YYYY-MM-DD HH:mm:ss");
        let ITEM = [];
        let GRNITEM = [];
        let BATCH = [];
        const UNIQUE_TRANSACTION_ID = uuidv4();
        items.forEach((i, index) => {
          if (i.quantity >= 0) {
            ITEM.push({
              DOCUMENT_DATE: poDetails.PO_HEADER.DOC_DATE,
              DELIVERY_DATE: currentDateIST,
              SHORT_TEXT: poDetails.PO_ITEMS[index]
                ? poDetails.PO_ITEMS[index].SHORT_TEXT
                : i.itemName,
              STORAGE_LOC:
                i.storageLocation != "" && i.storageLocation != undefined
                  ? i.storageLocation
                  : poDetails.PO_ITEMS[index]
                  ? poDetails.PO_ITEMS[index].STORE_LOC != "" &&
                    poDetails.PO_ITEMS[index].STORE_LOC != undefined
                    ? poDetails.PO_ITEMS[index].STORE_LOC
                    : storageLocation.code
                  : storageLocation.code,
              QUANTITY: i.quantity != "" && i.quantity != 0 ? i.quantity : 1,
              PO_ITEM: i.po_Item
                ? i.po_Item
                : poDetails.PO_ITEMS[index]
                ? poDetails.PO_ITEMS[index].PO_ITEM
                : poDetails.PO_ITEMS[0].PO_ITEM,
              REFERENCE: poDetails.PO_NUMBER,
            });
          }
        });

        items.forEach((i, index) => {
          if (i.quantity >= 0) {
            GRNITEM.push({
              MATERIAL_NO: i.material
                ? i.material
                : poDetails.PO_ITEMS[index]
                ? poDetails.PO_ITEMS[index].MATERIAL
                : poDetails.PO_ITEMS[0].MATERIAL,
              STORAGE_LOC:
                i.storageLocation != "" && i.storageLocation != undefined
                  ? i.storageLocation
                  : poDetails.PO_ITEMS[index]
                  ? poDetails.PO_ITEMS[index].STORE_LOC != "" &&
                    poDetails.PO_ITEMS[index].STORE_LOC != undefined
                    ? poDetails.PO_ITEMS[index].STORE_LOC
                    : storageLocation.code
                  : storageLocation.code,
              QUANTITY: i.quantity != "" && i.quantity != 0 ? i.quantity : 1,
              UOM: i.uom
                ? i.uom
                : poDetails.PO_ITEMS[index]
                ? poDetails.PO_ITEMS[index].BASE_UOM_ISO
                : poDetails.PO_ITEMS[0].BASE_UOM_ISO,
              STOCK_TYPE: "",
              SPECIAL_STOCK_INDICATOR: poDetails.PO_ITEMS[index]
                ? poDetails.PO_ITEMS[index].SPEC_STOCK
                : i.specStock,
              PO_ITEM: i.po_Item
                ? i.po_Item
                : poDetails.PO_ITEMS[index]
                ? poDetails.PO_ITEMS[index].PO_ITEM
                : poDetails.PO_ITEMS[0].PO_ITEM,
              PO_NUMBER: poDetails.PO_NUMBER,
            });
            BATCH.push(
              poDetails.PO_ITEM_SCHEDULES[index]
                ? poDetails.PO_ITEM_SCHEDULES[index].BATCH
                : poDetails.PO_ITEM_SCHEDULES[0].BATCH
            );
          }
        });

        const grn = {
          UNIQUE_TRANSACTION_ID: UNIQUE_TRANSACTION_ID,
          POSTING_DATE: currentDateIST,
          ITEM: GRNITEM,
          DOCUMENT_DATE: poDetails.PO_HEADER.DOC_DATE,
          COMPANY_CODE: poDetails.PO_HEADER.CO_CODE,
          BATCH_NO: BATCH,
          TIME_STAMP: currentDateIST,
        };

        // const currentDateIST = moment.tz("Asia/Kolkata").format("YYYY-MM-DD");
        // const insertGrn = await knex("grns").insert({
        //   poNo: poNo.PO_NUMBER,
        //   // asn_id: asn_id,
        //   grnUniqueId: UNIQUE_TRANSACTION_ID,
        //   postingDate: poDetails.PO_HEADER.DOC_DATE,
        //   item: JSON.stringify(ITEM),
        //   documentDate: poDetails.PO_HEADER.DOC_DATE,
        //   companyCode: poDetails.PO_HEADER.CO_CODE,
        //   batchNo: poDetails.PO_ITEM_SCHEDULES.BATCH,
        //   created_at: currentDateIST,
        // });
        const getVendorCode = await knex("purchase_orders_list")
          .select("supplierId")
          .where("poNumber", poDetails.PO_NUMBER)
          .first();
        return {
          UNIQUE_TRANSACTION_ID: UNIQUE_TRANSACTION_ID,
          PO_NUMBER: poDetails.PO_NUMBER,
          VENDOR: getVendorCode != undefined ? getVendorCode.supplierId : "",
          ITEM: ITEM,
          GRN: grn,
        };
      }
    };

    const reference = poNumber;
    let header = {};
    const Items = [];
    const timeNow = moment.tz("Asia/Kolkata").format("YYYY-MM-DD");
    if (poDetails) {
      header = {
        supplierGST: object["supplierGST"] ? object["supplierGST"] : "",
        companyGST: object["companyGST"] ? object["companyGST"] : "",
        GST_invoiceNo: object["GST_InvoiceNo"] ? object["GST_InvoiceNo"] : "",
        postingDate: object["postingDate"] ? object["postingDate"] : timeNow,
        documentDate: object["documentDate"]
          ? object["documentDate"]
          : poDetails.PO_HEADER.DOC_DATE,
        reference: reference,
        headerText: object["headerText"]
          ? object["headerText"]
          : poDetails.PO_HEADER_TEXTS,
        companyCode: object["companyCode"]
          ? object["companyCode"]
          : poDetails.PO_HEADER.CO_CODE,
        currency: object["currency"]
          ? object["currency"]
          : poDetails.PO_HEADER.CURRENCY,
        baselineDate: object["baselineDate"] ? object["baselineDate"] : timeNow,
        totalInvoiceAmount: object["totalInvoiceAmount"]
          ? object["totalInvoiceAmount"]
          : "",
        parkPostIndicator: items.invoiceType
          ? items.invoiceType == "parkInvoiced"
            ? "park"
            : "post"
          : "park",
        taxAmount: object["taxAmount"] ? object["taxAmount"] : 0,
      };
      let processedItems = [];
      let taxAmount = header["taxAmount"];
      let total = 0;
      let tax = 0;
      let temp = 1;

      const taxesByCode = {};
      for (const iterator of poDetails.IT_TAXES) {
        taxesByCode[iterator.ITEM] = taxesByCode[iterator.ITEM]
          ? parseFloat(taxesByCode[iterator.ITEM]) +
            parseFloat(iterator.TAX_PER)
          : parseFloat(iterator.TAX_PER);
      }
      const taxKeys = Object.keys(taxesByCode);

      // const arrayA = items.map((item) => item.itemName.split("\n")[0]);
      // const arrayB =
      //   poDetails.PO_HEADER.DOC_TYPE != "ZSER"
      //     ? poDetails.PO_ITEMS.map((item) => item.SHORT_TEXT)
      //     : poDetails.PO_ITEM_SERVICES.map((item) => item.SHORT_TEXT);
      // const matchingIndexes = arrayA
      //   .map((item, index) => {
      //     const indexInB = arrayB.findIndex(
      //       (bItem) => bItem.toLowerCase() === item.toLowerCase()
      //     );
      //     indexInB !== -1 ? (items[index].index = indexInB) : "";
      //     return indexInB !== -1 ? { item, indexInB } : null;
      //   })
      //   .filter((result) => result !== null);

      // items.sort((a, b) => a.index - b.index);

      items.forEach((i, index) => {
        if (i.quantity >= 0) {
          // console.log(i,"this is data")
          index > items.length ? (index = 0) : (index = index);
          i.subTotal ? (taxAmount += i.gst ? i.gst : 0) : (taxAmount += 0);
          total +=
            i.amount || i.amount == 0
              ? i.amount
              : items[index].quantity *
                (poDetails.PO_ITEMS[index] != undefined
                  ? poDetails.PO_ITEMS[index].NET_PRICE
                  : 0);
          const amt =
            i.amount || i.amount == 0
              ? i.amount
              : items[index].quantity *
                (i.amount
                  ? i.amount
                  : poDetails.PO_ITEMS[index] != undefined
                  ? poDetails.PO_ITEMS[index].NET_PRICE
                  : 0);
          const tx = taxesByCode[taxKeys[index]]
            ? taxesByCode[taxKeys[index]]
            : 0;
          tax += i.gst ? i.gst : (amt * tx) / 100;

          Items.push({
            invoiceItemId: temp,
            // po: i.poNo ? i.poNo : poNumber,
            PO_Item: i.PO_Item
              ? i.PO_Item
              : poDetails.PO_ITEMS[index]
              ? poDetails.PO_ITEMS[index].PO_ITEM.toString()
              : "",
            SES: "",
            amount:
              i.amount || i.amount == 0
                ? i.amount
                : items[index]
                ? items[index].quantity != "" && items[index].quantity != ""
                  ? items[index].quantity
                  : 1 * poDetails.PO_ITEMS[index].NET_PRICE
                : 0,
            TaxCode: poDetails.PO_ITEMS[index]
              ? poDetails.PO_ITEMS[index].TAX_CODE
              : "",
            plant: poDetails.PO_ITEMS[index]
              ? poDetails.PO_ITEMS[index].PLANT
              : "",
            quantity: i.quantity != "" && i.quantity != 0 ? i.quantity : 1,
            serviceActivity: "",
            hsnCode: i.hsnCode ? i.hsnCode.replace(/[^a-zA-Z0-9]/g, "") : "",
            hsnCodePO: poDetails.PO_ITEMS[i.index]
              ? poDetails.PO_ITEMS[index].CTR_KEY_QM
              : poDetails.PO_ITEMS[index]
              ? poDetails.PO_ITEMS[index].CTR_KEY_QM
              : "",
            poUnit: i.unit
              ? i.unit
              : poDetails.PO_ITEMS[index]
              ? poDetails.PO_ITEMS[index].BASE_UOM
                ? poDetails.PO_ITEMS[index].BASE_UOM
                : poDetails.PO_ITEMS[index].BASE_UOM_ISO
              : "",
            grnDoc: "",
            grnDocYear: "",
            grnDocItem: "",
          });
          // Items.push(...processedItems)
          temp++;
          // items[index]=i
        }
      });

      // Items.push(...processedItems)

      header.taxAmount =
        header.taxAmount != ""
          ? parseFloat(header.taxAmount.replace(/[^0-9.]/g, ""))
          : tax;
      header.totalInvoiceAmount =
        header.totalInvoiceAmount != ""
          ? parseFloat(header.totalInvoiceAmount.replace(/[^0-9.]/g, ""))
          : total + tax;
    }
    function formatDate(inputDate) {
      console.log(inputDate);
      // Create a new Date object from the input date string
      let dateObject = new Date(inputDate);

      // Extract year, month, and day components from the date object
      let year = dateObject.getFullYear();
      let month = (dateObject.getMonth() + 1).toString().padStart(2, "0"); // Add 1 to month because it is zero-based
      let day = dateObject.getDate().toString().padStart(2, "0");

      // Concatenate components to form the formatted date string
      let formattedDate = `${year}-${month}-${day}`;

      return formattedDate;
    }
    header.postingDate = parseDate(header.postingDate);
    header.documentDate = parseDate(header.documentDate);
    header.baselineDate = parseDate(header.baselineDate);
    console.log(Items, "this is items");
    const frieght = {
      freightConditionCode: "",
      poItem: Items[0] ? Items[0].PO_Item : "",
      grnDoc: "",
      grnDocYear: "",
      grnDocItem: "",
      taxCode: Items[0] ? Items[0].TaxCode : "",
      frieghtAmount: "",
      Quantity: "",
    };

    const grn = await grnANDses(poDetails, Items, poDetails.PO_HEADER.DOC_TYPE);
    return {
      error: false,
      IRN: object["IRN"] ? object["IRN"] : "",
      warning: "Please map the invoice format for accurate results.",
      type: poDetails.PO_HEADER.DOC_TYPE,
      data: header,
      items: Items,
      frieght: frieght,
      grn: grn,
    };
  }
};

const checkForeignId = async (table, id) => {
  try {
    const result = await knex(table).select("*").where({ id: id }).first();
    if (!result) {
      throw new Error(`${table} not found`);
    }
    return result;
  } catch (error) {
    throw new Error(`Invalid foreign key: ${error.message}`);
  }
};

const uploadToS3 = async (uploadParams) => {
  const credentials = new AWS.Credentials({
    accessKeyId: constants.s3Creds.accessKey,
    secretAccessKey: constants.s3Creds.secret,
    region: constants.aws.region,
  });
  AWS.config.credentials = credentials;

  const s3 = new AWS.S3({
    credentials: credentials,
  });

  const data = await s3
    .upload(uploadParams)
    .promise()

    // const response = await data
    .then((data) => {
      return {
        error: false,
        message: "Upload Success",
        data: data.Location,
      };
    })
    .catch((err) => {
      return {
        error: true,
        message: "Upload failed",
        data: err.message,
      };
    });
  return data;
};

function generatePresignedUrl(bucketName, objectKey, expirationInSeconds) {
  const credentials = new AWS.Credentials({
    accessKeyId: constants.s3Creds.accessKey,
    secretAccessKey: constants.s3Creds.secret,
    region: constants.aws.region,
  });
  AWS.config.credentials = credentials;

  const s3 = new AWS.S3({
    credentials: credentials,
  });
  const params = {
    Bucket: bucketName,
    Key: objectKey,
    Expires: expirationInSeconds,
  };

  return s3.getSignedUrl("getObject", params);
}

function applyFilter(rows, columnName, filterValue) {
  if (
    filterValue !== undefined &&
    filterValue !== null &&
    filterValue.length > 0
  ) {
    return rows.whereIn(columnName, filterValue);
  }
  return rows;
}

const getTime = async () => {
  const timezones = moment.tz.names();
  // console.log(timezones);
  const time = moment.tz("Asia/Kolkata").format("YYYY-MM-DD HH:mm:ss");
  return time;
};

// function logAPICalls(req, res, next) {
//   try {
//     const controllerName = req.route.stack[req.route.stack.length - 1].name;
//     const route = req.originalUrl
//     knex('api_calls').insert({
//       timestamp: new Date(),
//       controller: controllerName,
//       route: route
//     }).then(() => {
//       next();
//     }).catch(error => {
//       console.error('Error logging API call:', error);
//       res.status(500).json({ error: 'Internal server error' });
//     });
//   } catch (error) {
//     console.error('Error logging API call:', error);
//     res.status(500).json({ error: 'Internal server error' });
//   }
// }

async function logAPICalls(controllerName, route, serviceName) {
  try {
    await knex("api_calls").insert({
      controller: controllerName,
      route: route,
      serviceName: serviceName,
    });
    console.log("API call logged successfully.");
  } catch (error) {
    console.error("Error logging API call:", error);
    // Handle the error appropriately, such as throwing it or returning false
    // throw error;
    // return false;
  }
}

const credentials = new AWS.Credentials({
  accessKeyId: constants.s3Creds.accessKey,
  secretAccessKey: constants.s3Creds.secret,
  region: constants.aws.region,
});
AWS.config.credentials = credentials;

const s3 = new AWS.S3({
  credentials: credentials,
});

async function deleteObjectFromBucket(objectKey) {
  const params = {
    Bucket: constants.s3Creds.bucket,
    Key: objectKey,
  };

  try {
    const data = await s3.deleteObject(params).promise();
    console.log(`Successfully deleted ${objectKey}`);
    return data;
  } catch (err) {
    console.error(`Error deleting ${objectKey}`, err);
    throw err;
  }
}

// Functions for excel export
function generateExcelContent(rows) {
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(rows);

  XLSX.utils.book_append_sheet(wb, ws, "Sheet1");

  return XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
}

async function generateUniqueFilePath(baseFileName) {
  let filePath = path.join(os.homedir(), "Downloads", baseFileName);

  let fileExists = await checkFileExists(filePath);
  let counter = 1;

  while (fileExists) {
    filePath = path.join(
      os.homedir(),
      "Downloads",
      `${path.basename(
        baseFileName,
        path.extname(baseFileName)
      )} (${counter})${path.extname(baseFileName)}`
    );

    fileExists = await checkFileExists(filePath);
    counter++;
  }

  return filePath;
}

async function checkFileExists(filePath) {
  return new Promise((resolve) => {
    fs.access(filePath, fs.constants.F_OK, (err) => {
      if (err) {
        resolve(false); // File does not exist
      } else {
        resolve(true); // File exists
      }
    });
  });
}
const extractTime = async (time_unit, day, date, time) => {
  if (!time_unit) {
    return null;
  }

  const formattedTimeUnit = time_unit.toLowerCase();
  let cronExpression = "";

  if (formattedTimeUnit === "daily") {
    const [hour, minute, second] = time.split(":");
    cronExpression = `${minute} ${hour} * * *`;
  } else if (formattedTimeUnit === "hourly") {
    cronExpression = `0 * * * *`;
  } else if (formattedTimeUnit === "weekly") {
    if (!day || !time) {
      return null;
    }
    const [hour, minute, second] = time.split(":");
    const weekdayNumber = getWeekdayNumber(day);
    cronExpression = `${minute} ${hour} * * ${weekdayNumber}`;
  } else if (
    // formattedTimeUnit === "monthly" ||
    formattedTimeUnit === "yearly"
  ) {
    if (!date || !time) {
      return null;
    }
    const [hour, minute, second] = time.split(":");
    const dateString = date.toISOString().split("T")[0]; // Convert date object to string in "YYYY-MM-DD" format
    const [year, month, dayOfMonth] = dateString.split("-");
    cronExpression = `${minute} ${hour} ${dayOfMonth} ${month} *`;
  } else if (formattedTimeUnit == "monthly") {
    if (!date || !time) {
      return null;
    }
    const [hour, minute, second] = time.split(":");
    const dateString = date.toISOString().split("T")[0]; // Convert date object to string in "YYYY-MM-DD" format
    const [year, month, dayOfMonth] = dateString.split("-");
    cronExpression = `${minute} ${hour} ${dayOfMonth} * *`;
  }

  return cronExpression;
};

function getWeekdayNumber(day) {
  const weekdays = [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
  ];
  const index = weekdays.indexOf(day.toLowerCase());
  return index !== -1 ? index : 0; // Default to Sunday if day is not found
}

async function urlToBuffer(imageUrl) {
  try {
    const response = await axios.get(imageUrl, {
      responseType: "arraybuffer",
    });
    return Buffer.from(response.data, "binary");
  } catch (error) {
    if (error.response && error.response.status === 404) {
      // Suppress logging for 404 errors
      return "";
    } else {
      console.error("Error fetching image from URL:", error);
      return null;
    }
  }
}

const decodeAccessToken = async (accessToken) => {
  try {
    // Verify JWT token
    const decodedToken = jwt.verify(
      accessToken.replace("Bearer ", ""),
      process.env.JWT_SECRET
    );
    const { id, role, email } = decodedToken;
    const idArray = `[${id}]`;
    const userRole = await knex("users_roles")
      .select("role_name")
      .where({ id: role })
      .first();

    if (userRole.role_name === "Approver") {
      // Get department information for approver
      const departmentInfo = await knex("approvers2")
        .select("department_id", "portal_code")
        .whereRaw("JSON_CONTAINS(level_1_user_id, ?)", idArray);
      if (departmentInfo.length === 0) {
        return {
          decodedToken: decodedToken,
          department_id: null,
          department: null,
        };
      }
      const { department_id, portal_code: department } = departmentInfo[0];
      return { decodedToken, department_id, department };
    } else if (userRole.role_name === "Supplier") {
      // Get supplier details
      const supplierDetails = await knex("supplier_details")
        .select("sap_code")
        .where("emailID", email);
      if (supplierDetails.length === 0) {
        return { decodedToken, sap_code: null };
      }
      const { sap_code } = supplierDetails[0];
      return { decodedToken, sap_code };
    } else {
      return { decodedToken };
    }
  } catch (error) {
    console.log("Error:", error);
    return { decodedToken: null, department_id: null, sap_code: null };
  }
};

async function getDataByID(table_name) {
  try {
    // Fetch foreign key columns of the base table
    const foreignKeyColumns = await knex("information_schema.key_column_usage")
      .select(
        "column_name as column_name",
        "referenced_table_name as referenced_table_name",
        "referenced_column_name as referenced_column_name"
      )
      .where("table_schema", "supplierx_dev")
      .andWhere("table_name", table_name)
      .whereNotNull("referenced_table_name");

    // Group foreign key columns by referenced table name
    const foreignKeyMap = foreignKeyColumns.reduce((acc, fk) => {
      acc[fk.referenced_table_name] = acc[fk.referenced_table_name] || [];
      acc[fk.referenced_table_name].push(fk);
      return acc;
    }, {});

    const referencedColumns = [];

    // Fetch referencing columns for each referenced table
    for (const [referencedTable, columnNames] of Object.entries(
      foreignKeyMap
    )) {
      let referencingColumns;

      if (referencedTable === "states") {
        referencingColumns = await knex("information_schema.columns")
          .select("table_name as table_name", "column_name as column_name")
          .where("table_name", referencedTable)
          .andWhere("column_name", "stateDesc");
      } else if (referencedTable === "users") {
        referencingColumns = await knex("information_schema.columns")
          .select("table_name as table_name", "column_name as column_name")
          .where("table_name", referencedTable)
          .andWhere("column_name", "firstname");
      } else {
        referencingColumns = await knex("information_schema.columns")
          .select("table_name as table_name", "column_name as column_name")
          .where("table_name", referencedTable)
          .andWhere((builder) => {
            builder
              .where("column_name", "name")
              .orWhere("column_name", "description")
              .orWhere("column_name", "Description")
              .orWhere("column_name", "Name");
          });
      }

      referencedColumns.push(
        ...referencingColumns.map((column) => ({
          table_name: table_name,
          column_name: columnNames[0].column_name,
          referenced_table_name: referencedTable,
          referenced_column_name: columnNames[0].referenced_column_name,
          column_to_select: column.column_name,
        }))
      );
    }

    return referencedColumns;
  } catch (error) {
    throw new Error(
      `Error fetching data for table ${table_name}: ${error.message}`
    );
  }
}

const bulkDeleteRecords = async (tableName, ids, req) => {
  const schema = Joi.array().items(Joi.string().required()).required();
  const { error, value } = schema.validate(ids);

  if (error) {
    return {
      error: true,
      message: error.details[0].message,
      data: error,
    };
  }

  const deleteErrors = [];
  const deleteMessages = [];

  for (const id of value) {
    try {
      const check = await knex(tableName)
        .where("id", id)
        .update("isDeleted", 1);

      if (!check) {
        deleteErrors.push(
          `${tableName.slice(0, -1)} with ID ${id} could not be deleted`
        );
      } else {
        deleteMessages.push(
          `${tableName.slice(0, -1)} with ID ${id} deleted successfully`
        );
      }
    } catch (error) {
      fun.sendErrorLog(req, error);
      deleteErrors.push(
        `Error deleting ${tableName.slice(0, -1)} with ID ${id}: ${
          error.message
        }`
      );
    }
  }

  return {
    error: deleteErrors.length > 0,
    messages: deleteMessages,
    errors: deleteErrors,
  };
};


const bulkDeleteRecordsUsers = async (tableName, ids, req) => {
  const schema = Joi.array().items(Joi.string().required()).required();
  const { error, value } = schema.validate(ids);

  if (error) {
    return {
      error: true,
      message: error.details[0].message,
      data: error,
    };
  }

  const deleteErrors = [];
  const deleteMessages = [];

  for (const id of value) {
    try {
      const check = await knex(tableName)
        .where("id", id)
        .delete();

      if (!check) {
        deleteErrors.push(
          `${tableName.slice(0, -1)} with ID ${id} could not be deleted`
        );
      } else {
        deleteMessages.push(
          `${tableName.slice(0, -1)} with ID ${id} deleted successfully`
        );
      }
    } catch (error) {
      fun.sendErrorLog(req, error);
      deleteErrors.push(
        `Error deleting ${tableName.slice(0, -1)} with ID ${id}: ${
          error.message
        }`
      );
    }
  }

  return {
    error: deleteErrors.length > 0,
    messages: deleteMessages,
    errors: deleteErrors,
  };
};

const readExcelData = async (file, headerMappings) => {
  try {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(file);

    const worksheet = workbook.worksheets[0];

    const rows = [];
    let header = [];
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) {
        header = row.values.map((cell) => (cell ? cell.toString().trim() : ""));
      }
      if (rowNumber !== 1) {
        rows.push({ rowNumber, values: row.values });
      }
    });

    const Header = header.map((item) => item.toLowerCase());
    const missingHeaders = Object.keys(headerMappings).filter(
      (essentialHeader) => !Header.includes(essentialHeader)
    );
    if (missingHeaders.length > 0) {
      throw new Error(
        `Essential headers are missing in the uploaded file: ${missingHeaders.join(
          ", "
        )}`
      );
    }

    const data = [];
    const srNoIndex = header.indexOf("sr no");

    for (const { rowNumber, values: row } of rows) {
      if (
        srNoIndex !== -1 &&
        row[srNoIndex].toString().trim().toLowerCase() === "sr no"
      ) {
        continue;
      }

      const rowData = {};
      Header.forEach((column, index) => {
        const databaseColumn = headerMappings[column];
        if (databaseColumn) {
          let cellValue = row[index] ? row[index].toString().trim() : "";
          let cell = worksheet.getRow(rowNumber).getCell(index);
          if (cell.hyperlink && cell.text) {
            cellValue = cell.text;
          }

          rowData[databaseColumn.toLowerCase()] = cellValue;
        }
      });

      rowData.rowNumber = rowNumber; // Store the row number for error reporting
      data.push(rowData);
    }

    return { header, data };
  } catch (error) {
    throw new Error(`Error reading Excel file: ${error.message}`);
  }
};

// email footer
const generateEmailBody = (content) => {
  return `
  <table style="border:1px solid orange; width:100%;">
    <tr style="padding:15px;">
        <td style="width:20%;"></td>
        <td style="width:60%">
             ${content}
           <p>Regards,<br><b>${constants.admindetails.companyShortName}</b></p>
            <p><center>
                ${constants.admindetails.address1}, ${constants.admindetails.address2}, ${constants.admindetails.state}, ${constants.admindetails.country}</p>
                <p><img style="max-width:80px" src="${constants.admindetails.homePageUrl}mailTruck.png" /></p>
                <p> Powered By ${constants.admindetails.companyShortName}
                <br>Note: Do not reply this email. This is auto-generated email.</p>
            </center></p>
        </td>
        <td style="width:20%"></td>
    </tr>
</table>
  `;
};

function checkPermission(module_key, action) {
  return async (req, res, next) => {
    try {
      const userId = req.user.id;
      // Fetch the user role
      const userRole = await knex("users").where({ id: userId }).first();
      if (!userRole) {
        return res.status(403).json({
          error: true,
          message: "User role not found",
        });
      }

      // Fetch the module
      const module = await knex("module")
        .where({ name: module_key })
        .whereNot({ parent_id: null })
        .first();
      if (!module) {
        return res.status(403).json({
          error: true,
          message: "Module not found",
        });
      }

      // Check permissions for the role
      const rolePermissions = await knex("permission")
        .where("role_id", userRole.role_id)
        .andWhere("module_id", module.id)
        .first();

      if (!rolePermissions || !rolePermissions[action + "P"]) {
        return res.status(403).json({
          error: true,
          message: `You do not have permission to ${action} for the ${module.name} module.`,
        });
      }

      next();
    } catch (error) {
      res.status(500).json({
        error: true,
        message: "An error occurred while checking permissions",
        data: { error: error.message },
      });
    }
  };
}

const getRecordById = async (tableName, columnId, id) => {
  const data = await knex(tableName).where(columnId, id).first();
  if (!data) {
    throw new Error(`Record with id ${id} does not exist in ${tableName}`);
  }
  return data;
};

const validateField = async (tableName, fieldName, value, message) => {
  if (value == undefined || value == null || value == "") {
    throw Error(`${fieldName} is not provided.`);
  }
  fieldName =
    typeof fieldName == "string"
      ? fieldName.toLocaleLowerCase().trim()
      : fieldName;
  value = typeof value == "string" ? value.toLocaleLowerCase().trim() : value;
  try {
    const data = await knex(tableName)
      .select(fieldName)
      .where(fieldName, "=", value)
      .first();
    if (data) {
      throw new Error(`${message ? message : fieldName} already exists.`);
    }
  } catch (error) {
    throw new Error(error.message);
  }
};

function generateFileHash(fileBuffer) {
  return crypto.createHash("sha256").update(fileBuffer).digest("hex");
}

async function checkForDuplicateInvoice(fileHash) {
  const existingInvoice = await knex("invoices_textract")
    .where("file_hash", fileHash)
    .first();
  if (existingInvoice) {
    return { error: true };
  }
  return { error: false };
}

async function returnStatusCount(status){
  const result = status.reduce((acc, { status, count }) => {
    acc[status] = count;
    return acc;
  }, {})

return result
}

export default {
  deleteObjectFromBucket,
  mapping,
  sapMapping,
  fetchPODetails,
  sendErrorLog,
  addLog,
  getRandomFileName,
  getStaticUrl,
  sendEmail,
  uploadFile,
  removeFile,
  getPagesByPanel,
  verifyCode,
  checkCodeExists,
  genratePassword,
  getFieldConfig,
  getFieldConfigInternational,
  getSupplierData,
  conversion,
  fieldCreate,
  fieldDelete,
  insertData,
  getData,
  deleteData,
  viewData,
  fetchUsernames,
  supplierDetailsForLogin,
  checkRoleMiddleware,
  viewInvoiceData,
  deleteInvoiceData,
  userActivityMiddleware,
  fetchSupplierDetail,
  getApproverName,
  checkInSapDuplicateVendor,
  validateEmail,
  getPermissions,
  getUserActivities,
  newLogUserActivity,
  checkForeignId,
  uploadToS3,
  applyFilter,
  generatePresignedUrl,
  getTime,
  logAPICalls,
  generateExcelContent,
  generateUniqueFilePath,
  extractTime,
  urlToBuffer,
  decodeAccessToken,
  getDataByID,
  SetModifiedBy,
  takeSnapShot,
  bulkDeleteRecords,
  readExcelData,
  checkPermission,
  getRecordById,
  validateField,
  generateEmailBody,
  getRollNameByHeader,
  generateFileHash,
  checkForDuplicateInvoice,
  returnStatusCount,
  bulkDeleteRecordsUsers
};
