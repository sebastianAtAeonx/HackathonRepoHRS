import knex from "../../config/mysql_db.js";
import functions from "../../helpers/functions.js";
import logs from "../../middleware/logs.js";
import validation from "../../validation/supplier/typeOfRecipent.js";

const createTypeOfRecipent = async (req, res) => {
  try {

    const { error, value } = validation.create(req.body);

    if (error) {
      return res
        .status(400)
        .json({
          error: true,
          message: error.details[0].message,
          data: [],
        })
        .end();
    }

    const { code, name, status } = value;
    const data = {
      code,
      name,
      status,
    };

    const checkTyOfRecipent = await knex("type_of_recipients")
      .where(data)
      .select("*");
    if (checkTyOfRecipent.length > 0) {
      return res.status(409).json({
        error: true,
        message: "Type of recipient already exists.",
      });
    }
    const insertTyOfRecipent = await knex("type_of_recipients").insert(data);
    if (!insertTyOfRecipent) {
      return res
        .status(500)
        .json({
          error: true,
          message: "Could not create record.",
        })
        .end();
    }

    return res
      .status(201)
      .json({
        error: false,
        message: "Type of recipient created.",
      })
      .end();
  } catch (error) {
    return res
      .status(500)
      .json({
        error: true,
        message: "Could not create record.",
        data: JSON.stringify(error),
      })
      .end();
  }
};

const updateTypeOfRecipent = async (req, res) => {
  try {

    const { error, value } = validation.update(req.body);

    if (error) {
      return res
        .status(400)
        .json({
          error: true,
          message: error.details[0].message,
          data: [],
        })
        .end();
    }

    const { id, code, name, status } = value;
    const tableName = "type_of_recipients";
    try {
      await logs.logOldValues(tableName, id, value, req);
    } catch {
      console.log(error);
    }

    const data = {
      code,
      name,
      status,
    };

    const checkTypeOfRecipent = await knex("type_of_recipients")
      .select("*")
      .where(data)
      .where("id", "!=", id);

    if (checkTypeOfRecipent.length > 0) {
      return res.status(409).json({
        error: true,
        message: "Type of recipient already exists.",
      });
    }

    const updationDataIs = await functions.takeSnapShot(
      "type_of_recipients",
      id
    );

    const updateTypeOfRecipent = await knex("type_of_recipients")
      .where({ id })
      .update(data);
    if (!updateTypeOfRecipent) {
      return res.status(500)
        .json({
          error: false,
          message: "Could not update record.",
        })
        .end();
    }
    if (id) {
      const modifiedByTable1 = await functions.SetModifiedBy(
        req.headers["authorization"],
        "type_of_recipients",
        "id",
        id
      );
      console.log("isUpdated:-", modifiedByTable1);
    }
    return res
      .status(200)
      .json({
        error: false,
        message: "Type of recipient updated.",
      })
      .end();
  } catch (error) {
    return res
      .status(500)
      .json({
        error: true,
        message: "Could not update record.",
        data: JSON.stringify(error),
      })
      .end();
  }
};

const viewTypeOfRecipent = async (req, res) => {
  try {

    const { error, value } = validation.view(req.params);

    if (error) {
      return res
        .status(400)
        .json({
          error: true,
          message: error.details[0].message,
          data: [],
        })
        .end();
    }

    const { id } = value;

    const result = await knex("type_of_recipients").select().where({ id });
    if (result.length == 0) {
      return res
        .status(404)
        .json({
          error: true,
          message: "Type of recipient not found",
          data: error,
        })
        .end();
    }
    delete result[0].updated_at;
    delete result[0].created_at;

    return res
      .status(200)
      .json({
        error: false,
        message: "View successful",
        data: result,
      })
      .end();
  } catch (error) {
    return res
      .status(500)
      .json({
        error: true,
        message: "Could not fetch record.",
        data: JSON.stringify(error),
      })
      .end();
  }
};

const deleteTypeOfRecipent = async (req, res) => {
  try {

    const { error, value } = validation.del(req.params);

    if (error) {
      return res
        .status(400)
        .json({
          error: true,
          message: error.details[0].message,
          data: [],
        })
        .end();
    }

    const { id } = value;

    const tableName = "type_of_recipients";
    try {
      await logs.logOldValues(tableName, id, value, req);
    } catch {
      console.log(error);
    }

    const delete_pg = await knex("type_of_recipients").where({ id }).update('isDeleted', 1);  
    if (delete_pg) {
      return res
        .status(200)
        .json({
          error: false,
          message: "Record deleted successfully",
        })
        .end();
    } else {
      return res
        .status(404)
        .json({
          error: true,
          message: "Record not found",
        })
        .end();
    }
  } catch (error) {
    return res
      .status(500)
      .json({
        error: true,
        message: "Could not delete record.",
        data: JSON.stringify(error),
      })
      .end();
  }
};

const paginateTypeOfRecipent = async (req, res) => {
  try {
    const tableName = "type_of_recipients";
    const searchFrom = ["code", "name"];

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
    res.status(200).json({
      error: false,
      message: "retrieved successfully.",
      data: {
        total: total.total,
        rows: data_rows,
      },
    });
  } catch (error) {
    return res
      .status(500)
      .json({
        error: true,
        message: "Could not load record.",
        data: JSON.stringify(error),
      })
      .end();
  }
};

const delteMultipleRecords = async (req, res) => {
  try {
    const tableName = "type_of_recipients";
    const { ids } = req.body;

    const result = await functions.bulkDeleteRecords(tableName, ids, req);

    if (result.error) {
      return res.status(400).json({
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
  createTypeOfRecipent,
  updateTypeOfRecipent,
  viewTypeOfRecipent,
  deleteTypeOfRecipent,
  paginateTypeOfRecipent,
  delteMultipleRecords,
};
