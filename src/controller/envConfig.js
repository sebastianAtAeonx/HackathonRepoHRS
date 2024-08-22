import knex from "../config/mysql_db.js";
import CryptoJS from "crypto-js";
import dotenv from "dotenv";
import functions from "../helpers/functions.js";
import constants from "../helpers/constants.js";
import validation from "../validation/envConfig.js";
dotenv.config();
const tableName = "environment_variables";

const create = async (req, res) => {
  try {
    const { error, value } = validation.create(req.body);
    if (error) {
      return res.json({
        error: true,
        message: error.details[0].message,
      });
    }
    let secretKey = process.env.JWT_SECRET;
    value.env_value = encryptData(value.env_value, secretKey);

    const select = await knex("environment_variables")
      .where({
        env_key: value.env_key,
      })
      .first();

    if (select) {
      return res.json({ error: true, message: "ENV variable already exists." });
    }

    await knex("environment_variables").insert(value);
    return res.status(200).json({
      error: false,
      message: "Created Successfully !",
      data: value,
    });
  } catch (error) {
    return res.json({
      error: true,
      message: "Something went wrong.",
      data: error.message,
    });
  }
};

const update = async (req, res) => {
  try {
    const { error, value } = validation.update(req.body);
    if (error) {
      return res.json({
        error: true,
        message: error.details[0].message,
      });
    }

    let secretKey = process.env.JWT_SECRET;

    const select = await knex("environment_variables")
      .where({ id: value.id })
      .first();

    if (!select) {
      return res
        .status(404)
        .json({ error: true, message: "ENV variable not found." });
    }
    console.log(value);
    if (select.env_key === "SAP_SERVER") {
      if (value.env_value !== "true" && value.env_value !== "false") {
        return res.status(400).json({
          error: true,
          message: "Only 'true' and 'false' are allowed for SAP_SERVER.",
        });
      }
    }
    value.env_value = encryptData(value.env_value, secretKey);
    await knex("environment_variables").update(value).where({ id: value.id });
    return res.status(200).json({
      error: false,
      message: "Updated Successfully !",
      data: value,
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: "Could not update record.",
      data: error.message,
    });
  }
};

const deleteEnv = async (req, res) => {
  try {
    const { error, value } = validation.del(req.params);
    if (error) {
      return res.json({
        error: true,
        message: error.details[0].message,
        data: error,
      });
    }

    const { id } = value;

    const result = await knex(tableName).where({ id }).update("isDeleted", 1);
    if (!result) {
      return res.json({
        error: true,
        message: "Record not found",
      });
    }
    return res.json({
      error: false,
      message: "Record deleted successfully",
    });
  } catch (error) {
    return res.json({
      error: true,
      message: "Something went wrong",
      data: JSON.stringify(error.message),
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
        data: [],
      });
    }

    const { id } = value;

    const result = await knex(`${tableName}`).where({ id: id }).first();

    let secretKey = process.env.JWT_SECRET;
    result.env_value = decryptData(result.env_value, secretKey);
    if (result.length == 0) {
      return res.json({
        error: true,
        message: "Records not found",
        data: error,
      });
    }
    return res.json({
      error: false,
      message: "Purchase Requisitions found successfully",
      data: result,
    });
  } catch (error) {
    console.log(error.message);
    return res.json({
      error: true,
      message: "Something went wrong",
      data: error.message,
    });
  }
};

const paginate = async (req, res) => {
  try {
    const searchFrom = ["env_key", "env_key_description"];
    const { error, value } = validation.paginate(req.body);
    if (error) {
      return res.json({
        error: true,
        message: error.details[0].message,
        data: error,
      });
    }

    let { offset, limit, order, sort, search } = value;

    let results = knex(`${tableName}`).where({'isDeleted' : '0'});
    const total = await results.count(`${tableName}.id as total`).first();

    results = results.where(function () {
      if (search != undefined && search != "") {
        searchFrom.forEach((element) => {
          this.orWhereILike(`${tableName}.${element}`, `%${search}%`);
        });
      }
    });

    let rows = knex(`${tableName}`).where({'isDeleted' : '0'});

    rows = rows.where(function () {
      if (search != undefined && search != "") {
        this.where(function () {
          searchFrom.forEach((element) => {
            this.orWhereILike(`${element}`, `%${search}%`);
          });
        });
      }
    });

    rows = await rows
      .orderBy(`${tableName}.${sort}`, order)
      .limit(limit)
      .offset(offset);

    let data_rows = [];
    let sr;
    if (order === "desc") {
      sr = offset + 1;
    } else {
      sr = total.total - limit * offset;
    }
    rows.map(async (row) => {
      // Assign the pr_data array to the row
      let secretKey = process.env.JWT_SECRET;
      row.env_value = decryptData(row.env_value, secretKey);
      row.sr = sr;
      if (order == "desc") {
        sr++;
      } else {
        sr--;
      }
      data_rows.push(row);
    });
    return res.status(200).json({
      error: false,
      message: "Data retrieved successfully.",
      data: {
        total: total.total,
        rows: data_rows,
      },
    });
  } catch (error) {
    console.log(error);
    return res.json({
      error: true,
      message: "Something went wrong",
      data: error.message,
    });
  }
};

function encryptData(data, secretKey) {
  const encryptedData = CryptoJS.AES.encrypt(data, secretKey).toString();
  return encryptedData;
}

function decryptData(encryptedData, secretKey) {
  const bytes = CryptoJS.AES.decrypt(encryptedData, secretKey);
  const decryptedData = bytes.toString(CryptoJS.enc.Utf8);
  return decryptedData;
}

const genSettings = async (req, res) => {
  try {
    const { error, value } = validation.genSetting(req.body);
    if (error) {
      return res.json({
        error: true,
        message: error.details[0].message,
      });
    }

    let attachmentFileName;
    let uploadParams = {};
    let path;
    if (req.files && req.files.CO_LOGO) {
      const attachment = req.files.CO_LOGO;
      attachmentFileName = new Date().getTime() + "-" + attachment.name;
      // Upload attachment to S3
      uploadParams = {
        Bucket: constants.s3Creds.bucket,
        Key: "content-server/generalSettings/" + attachmentFileName,
        Body: attachment.data,
      };
      path = constants.admindetails.homePageUrl + uploadParams.Key;
      const uploadResult = await functions.uploadToS3(uploadParams);
      if (uploadResult) {
        console.log("File uploaded Successfully", path);
      }
      if (uploadResult.error) {
        throw new Error(uploadResult.message);
      }
      value.CO_LOGO = path;
    }

    //store values in db...
    let keys = Object.keys(value);
    let values = Object.values(value);

    values = await Promise.all(
      values.map(async (val) => {
        return await encryptData(val, process.env.JWT_SECRET);
      })
    );
    const updatePromises = keys.map((key, index) => {
      return knex("environment_variables")
        .where("env_key", key)
        .update({ env_value: values[index] });
    });
    await Promise.all(updatePromises);

    return res.json({
      error: false,
      message: "Settings updated successfully",
    });
  } catch (error) {
    return res.json({
      error: true,
      message: "Something went wrong !",
      data: error.message,
    });
  }
};

const viewGenSettings = async (req, res) => {
  try {
    const CO_SHORT_NAME = await knex("environment_variables")
      .where("env_key", "CO_SHORT_NAME")
      .first();

    const CO_FULL_NAME = await knex("environment_variables")
      .where("env_key", "CO_FULL_NAME")
      .first();

    const CO_ADD_1 = await knex("environment_variables")
      .where("env_key", "CO_ADD_1")
      .first();

    const CO_ADD_2 = await knex("environment_variables")
      .where("env_key", "CO_ADD_2")
      .first();

    const CO_COUNTRY = await knex("environment_variables")
      .where("env_key", "CO_COUNTRY")
      .first();

    const CO_STATE = await knex("environment_variables")
      .where("env_key", "CO_STATE")
      .first();

    const CO_URL = await knex("environment_variables")
      .where("env_key", "CO_URL")
      .first();

    const CO_PIN = await knex("environment_variables")
      .where("env_key", "CO_PIN")
      .first();

    const CO_LOGO = await knex("environment_variables")
      .where("env_key", "CO_LOGO")
      .first();

    let secreat = process.env.JWT_SECRET;

    return res.json({
      error: false,
      message: "Settings retrieved successfully",
      data: {
        CO_SHORT_NAME: decryptData(CO_SHORT_NAME.env_value, secreat),
        CO_FULL_NAME: decryptData(CO_FULL_NAME.env_value, secreat),
        CO_ADD_1: decryptData(CO_ADD_1.env_value, secreat),
        CO_ADD_2: decryptData(CO_ADD_2.env_value, secreat),
        CO_COUNTRY: decryptData(CO_COUNTRY.env_value, secreat),
        CO_STATE: decryptData(CO_STATE.env_value, secreat),
        CO_URL: decryptData(CO_URL.env_value, secreat),
        CO_PIN: decryptData(CO_PIN.env_value, secreat),
        CO_LOGO: decryptData(CO_LOGO.env_value, secreat),
      },
    });
  } catch (error) {
    return res.json({
      error: true,
      message: "Something went wrong !",
      data: error.message,
    });
  }
};

const delteMultipleRecords = async (req, res) => {
  try {
    const { ids } = req.body;

    const result = await functions.bulkDeleteRecords(tableName, ids, req);

    if (result.error) {
      return res.json({
        error: true,
        message: "Failed to delete one or more records",
        errors: result.errors,
        deltedIds: result.messages,
      });
    }

    return res.json({
      error: false,
      message: "Deleted all selected records successfully",
      errors: result.errors,
    });
  } catch (error) {
    return res.json({
      error: true,
      message: "Something went wrong",
      data: JSON.stringify(error),
    });
  }
};

export default {
  create,
  update,
  deleteEnv,
  paginate,
  view,
  genSettings,
  viewGenSettings,
  delteMultipleRecords,
};
