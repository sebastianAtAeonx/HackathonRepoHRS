import knex from "../config/mysql_db.js";
import dotenv from "dotenv";
import functions from "../helpers/functions.js";
import constants from "../helpers/constants.js";
import validation from "../validation/bulkUploads.js";
dotenv.config();
const tableName = "bulk_uploads";

const create = async (req, res) => {
  try {
    const { error, value } = validation.create(req.body);
    if (error) {
      return res.json({
        error: true,
        message: error.details[0].message,
      });
    }
    if (!req.files || !req.files.attachment) {
      return res.status(400).json({
        error: true,
        message: "Attachment is required.",
      });
    }
    let attachmentFileName;
    let uploadParams = {};
    let path;
    if (req.files && req.files.attachment) {
      const attachment = req.files.attachment;
      const allowedFileTypes = ["xlsx"];
      const fileExtension = attachment.name.split(".").pop().toLowerCase();

      if (!allowedFileTypes.includes(fileExtension)) {
        return res.status(400).json({
          error: true,
          message: "Only xlsx file format is allowed",
        });
      }
      attachmentFileName = new Date().getTime() + "-" + attachment.name;

      // Upload attachment to S3
      uploadParams = {
        Bucket: constants.s3Creds.bucket,
        Key: "content-server/bulk-upload/" + attachmentFileName,
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
    }
    value.attachment = path;
    const data = await knex(tableName).insert(value);
    return res.status(200).json({
      error: false,
      message: "Created Successfully !",
      data: value,
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: "Could not create record.",
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
    const select = await knex(tableName)
      .where({ id: value.id, isDeleted: "0" })
      .first();
    if (!select) {
      return res.status(404).json({
        error: true,
        message: "Record not found !",
      });
    }
    // if (!req.files || !req.files.attachment) {
    //   return res.status(400).json({
    //     error: true,
    //     message: "Attachment is required.",
    //   });
    // }

    let attachmentFileName;
    let uploadParams = {};
    let path;
    if (req.files && req.files.attachment) {
      const attachment = req.files.attachment;
      const allowedFileTypes = ["xlsx"];
      const fileExtension = attachment.name.split(".").pop().toLowerCase();

      if (!allowedFileTypes.includes(fileExtension)) {
        return res.status(400).json({
          error: true,
          message: "Only xlsx file format is allowed",
        });
      }
      attachmentFileName = new Date().getTime() + "-" + attachment.name;

      // Upload attachment to S3
      uploadParams = {
        Bucket: constants.s3Creds.bucket,
        Key: "content-server/bulk-upload/" + attachmentFileName,
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
    }
    value.attachment = path;

    const data = await knex(tableName).update(value).where({ id: value.id });
    return res.status(200).json({
      error: false,
      message: "Updated Successfully",
      data: value,
    });
  } catch (error) {
    return res.json({
      error: true,
      message: "Could not update record.",
      data: error.message,
    });
  }
};

const del = async (req, res) => {
  try {
    const { error, value } = validation.del(req.params);
    if (error) {
      return res.status(400).json({
        error: true,
        message: error.details[0].message,
        data: error,
      });
    }

    const { id } = value;
    const select = await knex(tableName).where({ id, isDeleted: "0" }).first();
    if (!select) {
      return res.status(404).json({
        error: true,
        message: "Record not found !",
      });
    }
    const result = await knex(tableName)
      .where({ id })
      .update({ isDeleted: "1" });
    if (!result) {
      return res.json({
        error: true,
        message: "Could not delete record",
      });
    }
    return res.status(200).json({
      error: false,
      message: "Record deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: "Could not delete record",
      data: JSON.stringify(error.message),
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
        data: [],
      });
    }

    const { id } = value;

    const result = await knex(`${tableName}`)
      .where({ id: id, isDeleted: "0" })
      .first();
    if (!result) {
      return res.status(404).json({
        error: true,
        message: "Records not found",
        data: error,
      });
    }
    return res.status(200).json({
      error: false,
      message: "Record found successfully",
      data: result,
    });
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({
      error: true,
      message: "Could not load record",
      data: error.message,
    });
  }
};

const paginate = async (req, res) => {
  try {
    const searchFrom = ["table_name"];

    const { error, value } = validation.paginate(req.body);
    if (error) {
      return res.status(400).json({
        error: true,
        message: error.details[0].message,
        data: error,
      });
    }

    let { offset, limit, order, sort, search } = value;

    let rows = knex(`${tableName}`).where({ isDeleted: "0" });

    rows = rows.where(function () {
      if (search != undefined && search != "") {
        this.where(function () {
          searchFrom.forEach((element) => {
            this.orWhereILike(`${element}`, `%${search}%`);
          });
        });
      }
    });
    const total = await rows.clone().count(`${tableName}.id as total`).first();
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
      message: "Could not load record(s).",
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
  del,
  paginate,
  view,
  delteMultipleRecords,
};
