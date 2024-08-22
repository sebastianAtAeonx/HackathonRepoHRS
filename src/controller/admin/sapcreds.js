import knex from "../../config/mysql_db.js";
import functions from "../../helpers/functions.js";
import logs from "../../middleware/logs.js";
import validation from "../../validation/admin/sapcreds.js";

const paginateCred = async (req, res) => {
  try {
    const tableName = "sapConfiguration";
    const searchFrom = ["name"];

    const { error, value } = validation.paginate(req.body);
    if (error) {
      return res.status(400).json({
        error: true,
        message: error.details[0].message,
        data: error,
      });
    }

    let { offset, limit, order, sort, search, status } = value;
    let total = 0;
    let results = knex(tableName);

    results = results.where(function () {
      if (search != undefined && search != "") {
        searchFrom.forEach((element) => {
          this.orWhereILike(element, `%${search}%`);
        });
      }
    });

    if (status != "") {
      results = results.where({ status });
    }

    total = await results.count("id as total").first();

    let rows = knex(tableName);

    if (status != "") {
      rows = rows.where({ status });
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
        //delete row.password;
        data_rows.push(row);
        sr++;
      });
    } else {
      let sr = total.total - limit * offset;
      await rows.forEach((row) => {
        row.sr = sr;
        //delete row.password;
        data_rows.push(row);
        sr--;
      });
    }
    return res.status(200).json({
      error: false,
      message: "SapCred data is retrieved successfully.",
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

const createCred = async (req, res) => {
  try {
    const { error, value } = validation.create(req.body);
    if (error) {
      return res.status(400).json({
        error: true,
        message: error.details[0].message,
      });
    }

    const { name, client, username, password, url, tokenPath, cookie, status } =
      value;

    const check_name = await knex("sapConfiguration")
      .where("name", name)
      .first();
    if (check_name != undefined) {
      return res.status(409).json({
        error: true,
        message: "Credentials are already exist",
      });
    }

    const insertData = await knex("sapConfiguration").insert({
      name,
      client,
      username,
      password,
      url,
      tokenPath,
      cookie,
      status,
    });

    if (!insertData) {
      return res.status(500).json({
        error: true,
        message: "Credentials not inserted",
      });
    }

    return res.status(201).json({
      error: false,
      message: "Credentials are added successfully.",
      data: insertData,
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: "Could not create record.",
      data: JSON.stringify(error),
    });
  }
};

const updateCred = async (req, res) => {
  try {
    const tableName = "sapConfiguration";

    const { error, value } = validation.update(req.body);
    if (error) {
      return res.status(400).json({
        error: true,
        message: error.details[0].message,
      });
    }
    const {
      id,
      name,
      client,
      username,
      password,
      url,
      tokenPath,
      cookie,
      status,
    } = value;

    try {
      await logs.logOldValues(tableName, id, value, req);
    } catch {
      console.log(error);
    }

    const check_id = await knex("sapConfiguration").where("id", id).first();
    if (check_id == undefined) {
      return res.status(404).json({
        error: true,
        message: "Credentials not exist",
      });
    }

    const check_name = await knex("sapConfiguration")
      .where("name", name)
      .where("id", "!=", id)
      .first();
    if (check_name != undefined) {
      return res
        .status(409)
        .json({
          error: true,
          message: "Credentials are already exist",
        })
        .end();
    }

    const updationDataIs = await functions.takeSnapShot("sapConfiguration", id);

    const updateData = await knex("sapConfiguration").where({ id: id }).update({
      name,
      client,
      username,
      password,
      url,
      tokenPath,
      cookie,
      status,
    });

    if (!updateData) {
      return res
        .status(500)
        .json({
          error: true,
          message: "Credentials not updated",
        })
        .end();
    }

    if (id) {
      const modifiedByTable1 = await functions.SetModifiedBy(
        req.headers["authorization"],
        "sapConfiguration",
        "id",
        id
      );
      console.log("isUpdated:-", modifiedByTable1);
    }
    return res
      .status(200)
      .json({
        error: false,
        message: "Credentials are updated successfully.",
      })
      .end();
  } catch (error) {
    return res.json({
      error: true,
      message: "Could not update record.",
      data: JSON.stringify(error),
    });
  }
};
const viewCred = async (req, res) => {
  try {
    const { error, value } = validation.view(req.params);
    if (error) {
      return res.status(400).json({
        error: true,
        message: error.details[0].message,
      });
    }

    const { id } = value;

    const result = await knex("sapConfiguration").where({
      id: id,
    });
    if (result.length <= 0) {
      return res.status(404).json({
        error: true,
        message: "Credentials data does not exist",
      });
    }
    return res.status(200).json({
      error: false,
      message: "Credentials data is found Successfully",
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
const deleteCred = async (req, res) => {
  try {
    const tableName = "sapConfiguration";

    const { error, value } = validation.del(req.params);
    if (error) {
      return res
        .status(400)
        .json({
          error: true,
          message: error.details[0].message,
        })
        .end();
    }
    const { id } = value;

    try {
      await logs.logOldValues(tableName, id, value, req);
    } catch {
      console.log(error);
    }

    const deleteRecord = await knex("sapConfiguration")
      .where({ id })
      .where("status", "0")
      .del();

    if (!deleteRecord) {
      return res
        .status(500)
        .json({
          error: true,
          message: "Can't delete",
        })
        .end();
    }

    return res
      .status(200)
      .json({
        error: false,
        message: "Deleted Successfully.",
      })
      .end();
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: "Could not delete record.",
      data: JSON.stringify(error),
    });
  }
};

const delteMultipleRecords = async (req, res) => {
  try {
    const tableName = "sapConfiguration";
    const { ids } = req.body;

    const result = await functions.bulkDeleteRecords(tableName, ids, req);

    if (result.error) {
      return res.status(500).json({
        error: true,
        message: "Failed to delete one or more records",
        errors: result.errors,
        deltedIds: result.messages,
      });
    }

    return res.status(200).json({
      error: false,
      message: "Deleted all selected records successfully",
      errors: result.errors,
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: "Could not delete record.",
      data: JSON.stringify(error),
    });
  }
};

export default {
  createCred,
  updateCred,
  viewCred,
  deleteCred,
  paginateCred,
  delteMultipleRecords,
};
