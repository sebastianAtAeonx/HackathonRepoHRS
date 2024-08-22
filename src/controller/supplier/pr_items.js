import knex from "../../config/mysql_db.js";
import fun from "../../helpers/functions.js";
import { v4 as uuidv4 } from "uuid";
import  logs  from "../../middleware/logs.js";
import validation from "../../validation/supplier/pr_items.js";

const deletePr_items = async (req, res) => {
  try {
    const tableName = "pr_items";

    const { error, value } = validation.del(req.params);
    if (error) {
      return res.status(400).json({
        error: true,
        message: error.details[0].message,
        data: error,
      });
    }
    const { id } = value;

    try{
      await logs.logOldValues(tableName,id, value, req);
      }
      catch{
        console.log(error)
      }

    const check = await knex(tableName).where({ id: id }).del();
    if (!check) {
      return res.status(500).json({
        error: true,
        message: "Delete Failed.",
      });
    }
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

const paginatePr_items = async (req, res) => {
  try {
    const tableName = "pr_items";
    const searchFrom = ["item_name"];

    const { error, value } = validation.paginate(req.body);
    if (error) {
      return res.status(400).json({
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

const viewPr_items = async (req, res) => {
  try {
    const tableName = "pr_items";

    const { error, value } = validation.view(req.params);
    if (error) {
      return res.status(400).json({
        error: true,
        message: error.details[0].message,
        data: error,
      });
    }

    const { id } = value;

    const result = await knex(tableName).where({ id: id });
    if (result == "") {
      return res.status(404).json({
        error: true,
        message: "Record not found",
      });
    }
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

const createPr_items = async (req, res) => {
  try {
    const tableName = "pr_items";

    const { error, value } = validation.create(req.body);
    if (error) {
      return res.status(400).json({
        error: true,
        message: error.details[0].message,
        data: [],
      });
    }

    const {
      item_name,
      item_description,
      item_category,
      item_unit,
      item_quantity,
      expected_item_price,
    } = value;
    const id = uuidv4();

    const timestampis = knex.fn.now();

    // const resultx = await knex("pr_items").where({name: name})
    // if(Array.isArray(resultx) && resultx.length!=0){
    //    return res.json({
    //         error: true,
    //         message: "Record with this name is alredy there"
    //     })
    //
    // }

    const insertId = await knex("pr_items").insert({
      id,
      item_name,
      item_description,
      item_category,
      item_unit,
      item_quantity,
      expected_item_price,
      created_at: timestampis,
    });
    if (!insertId) {
      return res.status(500).json({
        error: true,
        message: "Inserting in the database Failed",
      });
    }
    return res.status(200).json({
      error: false,
      message: "Added successfully.",
      data: {
        insertId: id,
      },
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: "Something went wrong",
      data: JSON.stringify(error),
    });
  }
};

const updatePr_items = async (req, res) => {
  try {
    const tableName = "pr_items";

    const { error, value } = validation.update(req.body);
    if (error) {
      return res.status(400).json({
        error: true,
        message: error.details[0].message,
        data: [],
      });
    }

    const {
      id,
      item_name,
      item_description,
      item_category,
      item_unit,
      item_quantity,
      expected_item_price,
    } = value;

    try{
      await logs.logOldValues(tableName,id, value, req);
      }
      catch{
        console.log(error)
      }

    // const resultx = await knex(tableName).where({name: name}).where("id","!=", id)
    // if(Array.isArray(resultx) && resultx.length!=0){
    //    return res.json({
    //         error: true,
    //         message: "Record with this name is alredy there"
    //     })
    //     F
    // }

    const timestampis = knex.fn.now();
    const insertId = await knex(tableName)
      .update({
        item_name,
        item_description,
        item_category,
        item_unit,
        item_quantity,
        expected_item_price,
        updated_at: timestampis,
      })
      .where({ id: id });
    if (!insertId) {
      return res.status(500).json({
        error: true,
        message: "Update in the database Failed",
      });
    }

    if(id){
    const modifiedByTable1 = await functions.SetModifiedBy(req.headers["authorization"],"pr_items","id",id);
      console.log("isUpdated:-", modifiedByTable1);
    }
    return res.status(200).json({
      error: false,
      message: "Updated successfully.",
      data: {
        updatedId: id,
      },
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: "Could not update record.",
      data: JSON.stringify(error),
    });
  }
};

const delteMultipleRecords=async(req,res)=>{
  try {
    const tableName = "pr_items";
    const { ids } = req.body;
  
    const result = await fun.bulkDeleteRecords(tableName, ids, req);
    console.log("this is result",result)
  
    if (result.error) {
      return res.status(400).json({
        error: true,
        message: "Failed to delete one or more records",
        errors: result.errors,
        deltedIds:result.messages,
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
}

export default {
  paginatePr_items,
  viewPr_items,
  createPr_items,
  updatePr_items,
  deletePr_items,
  delteMultipleRecords
};
