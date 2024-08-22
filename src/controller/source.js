import knex from "../config/mysql_db.js";
import md5 from "md5";
import fun from "../helpers/functions.js";
import functions from "../helpers/functions.js";
import valdiation from "../validation/source.js";

const createSource = async (req, res) => {
  try {

    const { error, value } = valdiation.create(req.body);
    if (error) {
      return res.json({
        error: true,
        message: error.details[0].message,
        data: error,
      });
    }

    const { name, status, email, password } = value;

    if (fun.validateEmail(email)) {
      console.log("Email is valid");
    } else {
      console.log("Email is invalid");
      return res.json({ error: true, message: "Email is invalid" }).end();
    }

    const check = await knex("company_source").where({ email });
    if (check.length != 0)
      return res.json({
        error: true,
        message: "Email Already Exists",
      });
    const insertId = await knex("company_source").insert({
      name,
      email,
      status,
      password: md5(password),
    });

    if (!insertId) {
      return res.json({
        error: true,
        message: "Inserting in the database Failed",
      });
    }

    return res.json({
      error: false,
      message: "Source added successfully.",
      data: {
        insertId,
      },
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

const paginateSources = async (req, res) => {
  try {
    const tableName = "company_source";
    const searchFrom = ["name", "email"];
    const { error, value } = valdiation.paginate(req.body);
    if (error) {
      return res.json({
        error: true,
        message: error.details[0].message,
        data: error,
      });
    }

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
    const total = await results.count("id as total").first();
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
    fun.sendErrorLog(req, error);
    return res.json({
      error: true,
      message: "Something went wrong.",
      data: { error: JSON.stringify(error) },
    });
  }
};

const updateSource = async (req, res) => {
  try {
    const { error, value } = valdiation.update(req.body);
    if (error) {
      return res.json({
        error: true,
        message: error.details[0].message,
        data: error,
      });
    }

    const { name, status, email, id } = value;

    if (fun.validateEmail(email)) {
      console.log("Email is valid");
    } else {
      console.log("Email is invalid");
      return res.json({ error: true, message: "Email is invalid" }).end();
    }

    const updationDataIs = await functions.takeSnapShot("company_source",id);

    const insertId = await knex("company_source")
      .update({ name, email, status })
      .where({ id });
    if (!insertId) {
      return res.json({
        error: true,
        message: "Update in the database Failed",
      });
    }

    if(id){
    const modifiedByTable1 = await functions.SetModifiedBy(req.headers["authorization"],"company_source","id",id);
      console.log("isUpdated:-", modifiedByTable1);
  }
    return res.json({
      error: false,
      message: "Source Updated successfully.",
      data: {
        insertId,
      },
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

const deleteSource = async (req, res) => {
  try {
    const tableName = "company_source";

    const { error, value } = valdiation.del(req.body);
    if (error) {
      return res.json({
        error: true,
        message: error.details[0].message,
        data: error,
      });
    }

    const { id } = value;

    const check = await knex(tableName).where({ id }).del();
    if (!check) {
      return res.json({
        error: true,
        message: "Delete Failed.",
      });
    }
    return res.json({
      error: false,
      message: "Deleted Successfully.",
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

const delteMultipleRecords=async(req,res)=>{
  try {
    const tableName = "company_source";
    const { ids } = req.body;
  
    const result = await functions.bulkDeleteRecords(tableName, ids, req);
  
    if (result.error) {
      return res.json({
        error: true,
        message: "Failed to delete one or more records",
        errors: result.errors,
        deltedIds:result.messages,
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
}
export default {
  createSource,
  paginateSources,
  updateSource,
  deleteSource,
  delteMultipleRecords
};
