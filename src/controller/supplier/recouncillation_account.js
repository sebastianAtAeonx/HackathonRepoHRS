import knex from "../../config/mysql_db.js";
import s3 from "../../../src/s3/s3.js";
import constants from "../../helpers/constants.js";
import functions from "../../helpers/functions.js";
import fs from "fs";
import { Console } from "console";
import logs from "../../middleware/logs.js";
import validation from "../../validation/supplier/recouncillation_account.js";

const createSubscriberDetails = async (req, res) => {
  try {
    const { error, value } = validation.createSubscriber(req.body);
    if (error) {
      return res.status(400).json({
        error: true,
        message: error.details[0].message,
        data: error,
      });
    }

    const { subscriber_id } = value;

    //upload files process
    const logo_path = await s3.recieveUploadAndStore(
      req.files.logo,
      req.files.logo.name,
      "subscribers/logo/logo_"
    );

    const favicon_path = await s3.recieveUploadAndStore(
      req.files.favicon,
      req.files.favicon.name,
      "subscribers/favicon/favicon_"
    );

    const halflogo_path = await s3.recieveUploadAndStore(
      req.files.halflogo,
      req.files.halflogo.name,
      "subscribers/halflogo/halflogo_"
    );

    //insert file name process
    const insertRecord = await knex("subscriber_details").insert({
      subscriber_id,
      logo: logo_path.Key,
      half_logo: halflogo_path.Key,
      favicon: favicon_path.Key,
    });

    if (insertRecord.length == 0) {
      return res.status(500).json({
        error: true,
        message: "Something went wrong, Try Again",
      });
    }

    return res.status(201).json({
      error: false,
      message: "Subscriber Details Created Successfully",
      data: insertRecord,
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: "Could not create record.",
      data: JSON.stringify(error),
    });
  }
};

const viewSubscriberDetails = async (req, res) => {
  try {
    const tableName = "subscriber_details";

    const { error, value } = validation.viewSubscriber(req.params);
    if (error) {
      return res.status(400).json({
        error: true,
        message: error.details[0].message,
        data: error,
      });
    }

    const { id } = value;

    const result = await knex(tableName)
      .where({
        id,
      })
      .first();

    if (result == undefined) {
      return res.status(404).json({
        error: true,
        message: "Record not found",
      });
    }

    result.logo = await s3.getTempUrl(result.logo);
    result.half_logo = await s3.getTempUrl(result.half_logo);
    result.favicon = await s3.getTempUrl(result.favicon);

    return res.status(200).json({
      error: false,
      message: "Record found Successfully",
      data: {
        result,
      },
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: "Could not fetch record.",
      data: JSON.stringify(error),
    });
  }
};

const updateSubscriberDetails2 = async (req, res) => {
  try {
    const tableName = "subscriber_details";

    const { error, value } = validation.updateSubscriber(req.body);
    if (error) {
      return res.status(400).json({
        error: true,
        message: error.details[0].message,
        data: [],
      });
    }

    const { id, for_user_id, updated_by } = value;

    try {
      await logs.logOldValues(tableName, id, value, req);
    } catch {
      console.log(error);
    }

    if (req.files === null) {
      return res.status(500).json({
        error: true,
        message: "Select all files to update",
      });
    }

    if (req.files.logo) {
    } else {
      return res.status(400).json({
        error: true,
        message: "Select Logo File",
      });
    }

    if (req.files.favicon) {
    } else {
      return res.status(400).json({
        error: true,
        message: "Select Favicon File",
      });
    }
    if (req.files.halflogo) {
    } else {
      return res.status(400).json({
        error: true,
        message: "Select Half Logo File",
      });
    }

    //upload new files process
    const logo_path = await s3.recieveUploadAndStore(
      req.files.logo,
      req.files.logo.name,
      "subscribers/logo/logo_"
    );

    const get_key = await knex("subscriber_details").where({ id: id });
    if (get_key.length == 0) {
      return res.status(404).json({
        error: true,
        message: "Record not found",
      });
    }

    const check_user_id = await knex("users").where("Id", for_user_id);
    if (check_user_id.length == 0) {
      return res.status(404).json({
        error: true,
        message: "User does not exist",
      });
    }

    //store temporary path of old files
    const old_logo = get_key[0].logo;
    const old_favicon = get_key[0].favicon;
    const old_half_logo = get_key[0].half_logo;

    //delete file
    let delete_result = await s3.deleteObject(get_key[0].logo);
    if (delete_result != true) {
      return res.status(404).json({
        error: true,
        message: "File does not exist",
      });
    }
    delete_result = await s3.deleteObject(get_key[0].half_logo);
    if (delete_result != true) {
      return resres.status(404).json({
        error: true,
        message: "File does not exist",
      });
    }
    delete_result = await s3.deleteObject(get_key[0].favicon);
    if (delete_result != true) {
      return resres.status(404).json({
        error: true,
        message: "File does not exist",
      });
    }

    const favicon_path = await s3.recieveUploadAndStore(
      req.files.favicon,
      req.files.favicon.name,
      "subscribers/favicon/favicon_"
    );

    const halflogo_path = await s3.recieveUploadAndStore(
      req.files.halflogo,
      req.files.halflogo.name,
      "subscribers/halflogo/halflogo_"
    );

    let archive_result = await s3.archive_record(
      old_logo,
      constants.s3Creds.archiveBucket,
      constants.s3Creds.bucket,
      updated_by,
      "update",
      for_user_id
    );

    if (archive_result.length == 0 || archive_result === "error") {
      return resres.status(500).json({
        error: true,
        message: "File can not be archived",
        data: archive_result,
      });
    }

    archive_result = await s3.archive_record(
      old_favicon,
      constants.s3Creds.archiveBucket,
      constants.s3Creds.bucket,
      updated_by,
      "update",
      for_user_id
    );

    if (archive_result.length == 0 || archive_result === "error") {
      return res.json({
        error: true,
        message: "File can not be archived",
        data: archive_result,
      });
    }

    archive_result = await s3.archive_record(
      old_half_logo,
      constants.s3Creds.archiveBucket,
      constants.s3Creds.bucket,
      updated_by,
      "update",
      for_user_id
    );

    if (archive_result.length == 0 || archive_result === "error") {
      return res.json({
        error: true,
        message: "File can not be archived",
        data: archive_result,
      });
    }

    const updationDataIs = await functions.takeSnapShot(
      "subscriber_details",
      id
    );

    const result_of_update = await knex("subscriber_details")
      .update({
        logo: logo_path.Key,
        half_logo: halflogo_path.Key,
        favicon: favicon_path.Key,
      })
      .where({ id: id });

    if (result_of_update.length == 0) {
      return resres.status(404).json({
        error: true,
        message: "Record not found",
      });
    }
    if (id) {
      const modifiedByTable1 = await functions.SetModifiedBy(
        req.headers["authorization"],
        "subscriber_details",
        "id",
        id
      );
      console.log("isUpdated:-", modifiedByTable1);
    }
    return res.status(200).json({
      error: false,
      message: "Subscriber Details Updated Successfully",
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: "Could not update record.",
      data: JSON.stringify(error),
    });
  }
};

const deleteSubscriberDetails = async (req, res) => {
  try {
    const tableName = "subscriber_details";

    const { error, value } = validation.deleteSubscriber(req.body);
    if (error) {
      return res.status(400).json({
        error: true,
        message: error.details[0].message,
        data: error,
      });
    }
    const { id, deleted_by, for_user_id } = value;

    try {
      await logs.logOldValues(tableName, id, value, req);
    } catch {
      console.log(error);
    }

    const get_key = await knex(tableName).where({ id: id }).first();

    console.log("get-key:-", get_key);

    const check = await knex(tableName)
      .where({
        id: id,
      })
      .del();

    if (!check) {
      return res.status(500).json({
        error: true,
        message: "Delete Failed.",
      });
    }

    //delete from s3 bucket

    let result = s3.archive_record(
      get_key.logo,
      constants.s3Creds.archiveBucket,
      constants.s3Creds.bucket,
      deleted_by,
      "delete",
      for_user_id
    );
    console.log("result:-", result);

    result = s3.archive_record(
      get_key.half_logo,
      constants.s3Creds.archiveBucket,
      constants.s3Creds.bucket,
      deleted_by,
      "delete",
      for_user_id
    );
    console.log("result:-", result);

    result = s3.archive_record(
      get_key.favicon,
      constants.s3Creds.archiveBucket,
      constants.s3Creds.bucket,
      deleted_by,
      "delete",
      for_user_id
    );
    console.log("result:-", result);

    s3.deleteObject(get_key.logo);
    s3.deleteObject(get_key.half_logo);
    s3.deleteObject(get_key.favicon);

    return res.status(200).json({
      error: false,
      message: "Deleted Successfully.",
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: "Could not delete record.",
      data: JSON.stringify(error),
    });
  }
};

const updateSubscriberDetails = async (req, res) => {
  try {
    const tableName = "subscriber_details";
    let logo_status, halflogo_status, favicon_status;

    const { error, value } = validation.updateSubscriber(req.body);

    if (error) {
      return res.status(400).json({
        error: true,
        message: error.details[0].message,
      });
    }

    const { id, for_user_id, updated_by } = value;

    try {
      await logs.logOldValues(tableName, id, value, req);
    } catch {
      console.log(error);
    }

    if (req.files === null) {
      return res.status(400).json({
        error: true,
        message: "Please upload a file",
      });
    }

    //step 02
    const get_old_path = await knex("subscriber_details")
      .where({ id: id })
      .first();
    //step 01
    if (req.files.logo) {
      //step 03
      const archive_result = await s3.archive_record(
        get_old_path.logo,
        constants.s3Creds.archiveBucket,
        constants.s3Creds.bucket,
        updated_by,
        "delete",
        for_user_id
      );
      if (archive_result[0] <= 0) {
        return req.status(500).json({
          error: true,
          message: "Something went wrong. Please try again later.",
        });
      }
      //step 04, 05
      const delete_result = await s3.deleteObject(get_old_path.logo);
      if (delete_result === true) {
        //archive and delete done properly
      } else {
        return res.status(500).json({
          error: true,
          message: "Something went wrong. Please try again later.(2)",
        });
      }
      //step 06
      const insertedId = await s3.recieveUploadAndStore(
        req.files.logo,
        req.files.logo.name,
        "subscribers/logo/logo_"
      );

      //step 07
      const updationDataIs = await functions.takeSnapShot(
        "subscriber_details",
        id
      );
      const update_subscriber_details = await knex("subscriber_details")
        .where({ id: id })
        .update({
          logo: insertedId.key,
        });

      if (update_subscriber_details) {
        logo_status = true;
      }
      if (id) {
        const modifiedByTable1 = await functions.SetModifiedBy(
          req.headers["authorization"],
          "subscriber_details",
          "id",
          id
        );
        console.log("isUpdated:-", modifiedByTable1);
      }
    }
    if (req.files.halflogo) {
      //step 03
      const archive_result = await s3.archive_record(
        get_old_path.half_logo,
        constants.s3Creds.archiveBucket,
        constants.s3Creds.bucket,
        updated_by,
        "delete",
        for_user_id
      );
      if (archive_result[0] <= 0) {
        return req.status(500).json({
          error: true,
          message: "Something went wrong. Please try again later.(3)",
        });
      }
      //step 04, 05
      const delete_result = await s3.deleteObject(get_old_path.half_logo);
      if (delete_result === true) {
        //archive and delete done properly
      } else {
        return res.status(500).json({
          error: true,
          message: "Something went wrong. Please try again later.(4)",
        });
      }
      //step 06
      const insertedId = await s3.recieveUploadAndStore(
        req.files.halflogo,
        req.files.halflogo.name,
        "subscribers/halflogo/halflogo_"
      );

      //step 07

      const updationDataIs = await functions.takeSnapShot(
        "subscriber_details",
        id
      );
      const update_subscriber_details = await knex("subscriber_details")
        .where({ id: id })
        .update({
          half_logo: insertedId.key,
        });
      if (id) {
        const modifiedByTable1 = await functions.SetModifiedBy(
          req.headers["authorization"],
          "subscriber_details",
          "id",
          id
        );
        console.log("isUpdated:-", modifiedByTable1);
      }

      if (update_subscriber_details) {
        halflogo_status = true;
      }
    }
    if (req.files.favicon) {
      //step 03
      const archive_result = await s3.archive_record(
        get_old_path.favicon,
        constants.s3Creds.archiveBucket,
        constants.s3Creds.bucket,
        updated_by,
        "delete",
        for_user_id
      );
      if (archive_result[0] <= 0) {
        return req.status(500).json({
          error: true,
          message: "Something went wrong. Please try again later.(5)",
        });
      }
      //step 04, 05
      const delete_result = await s3.deleteObject(get_old_path.favicon);
      if (delete_result === true) {
        //archive and delete done properly
      } else {
        return res.status(500).json({
          error: true,
          message: "Something went wrong. Please try again later.(6)",
        });
      }
      //step 06
      const insertedId = await s3.recieveUploadAndStore(
        req.files.favicon,
        req.files.favicon.name,
        "subscribers/favicon/favicon_"
      );

      //step 07

      const updationDataIs = await functions.takeSnapShot(
        "subscriber_details",
        id
      );

      const update_subscriber_details = await knex("subscriber_details")
        .where({ id: id })
        .update({
          favicon: insertedId.key,
        });
      if (id) {
        const modifiedByTable1 = await functions.SetModifiedBy(
          req.headers["authorization"],
          "subscriber_details",
          "id",
          id
        );
        console.log("isUpdated:-", modifiedByTable1);
      }
      if (update_subscriber_details) {
        favicon_status = true;
      }
    }

    if (
      logo_status === false &&
      halflogo_status === false &&
      favicon_status === false
    ) {
      return res.status(500).json({
        error: true,
        message: "Something went wrong. Please try again later.(7)",
      });
    }

    return res.status(200).json({
      error: false,
      message: "Subscriber Details Updated Successfully",
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: "Could not update record.",
      data: JSON.stringify(error),
    });
  }
};

const paginateReconciliation = async (req, res) => {
  try {
    const tableName = "reconciliation_ac";
    const searchFrom = ["id"];

    const { error, value } = validation.paginate(req.body);
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
      message: "Retrieved successfully.",
      data: {
        rows: data_rows,
        total: total.total,
      },
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: "Could not load record.",
      data: JSON.stringify(error),
    });
  }
};

const createReconciliation = async (req, res) => {
  try {
    const { error, value } = validation.create(req.body);
    if (error) {
      return res.status(400).json({
        error: true,
        message: error.details[0].message,
      });
    }
    const { code, name, co_names } = value;

    const check_code = await knex("reconciliation_ac").where({ code: code });

    if (check_code.length > 0)
      return res.status(409).json({
        error: true,
        message: "Code Already Exists",
      });

    const insertedId = await knex("reconciliation_ac").insert({
      code,
      name,
      co_names,
    });

    if (insertedId <= 0) {
      return res.status(500).json({
        error: true,
        message: "Record could not be created",
      });
    }

    return res.status(201).json({
      error: false,
      message: "Record created successfully",
      data: insertedId,
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: "Could not create record.",
      data: JSON.stringify(error),
    });
  }
};

export default {
  paginateReconciliation,
  createReconciliation,
};
