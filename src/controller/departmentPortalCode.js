import md5 from "md5";
import knex from "../config/mysql_db.js";
import fun from "../helpers/functions.js";
import functions from "../helpers/functions.js";
import validation from "../validation/departmentPortalCode.js";

const create = async (req, res) => {
  try {
    const { error, value } = validation.create(req.body);
    if (error) {
      return res.status(400).json({
        error: true,
        message: error.details[0].message,
      });
    }

    const { name, dept_id, status } = value;

    const createDepartmentPortalCode = await knex(
      "department_portal_code"
    ).insert({
      name: name,
      dept_id: dept_id,
      status: status,
    });

    if (!createDepartmentPortalCode) {
      return res.status(200).json({
        error: true,
        message: "Department Portal Code not created",
      });
    }

    return res.status(200).json({
      error: false,
      message: "Department Portal Code created",
      data: createDepartmentPortalCode,
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

    const viewDepartmentPortalCode = await knex("department_portal_code").where(
      "id",
      id
    );
    if (viewDepartmentPortalCode.length > 0) {
      return res.status(200).json({
        error: false,
        message: "View Department Portal Code",
        data: viewDepartmentPortalCode,
      });
    }

    return res.status(200).json({
      error: true,
      message: "Department Portal Code not found",
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

const deleted = async (req, res) => {
  try {
    const { error, value } = validation.del(req.params);
    if (error) {
      return res.status(400).json({
        error: true,
        message: error.details[0].message,
      });
    }

    const { id } = value;

    const deletedDepartmentPortalCode = await knex("department_portal_code")
      .where("id", id)
      .update("isDeleted", 1);

    if (!deletedDepartmentPortalCode) {
      return res.status(200).json({
        error: true,
        message: "Department Portal Code not deleted",
      });
    }

    return res.status(200).json({
      error: false,
      message: "Department Portal Code deleted",
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

const update = async (req, res) => {
  try {
    const { error, value } = validation.update(req.body);
    if (error) {
      return res.status(400).json({
        error: true,
        message: error.details[0].message,
      });
    }

    const { id, name, dept_id, status } = value;

    const checkDepartmentPortalCode = await knex("department_portal_code")
      .where({ name, dept_id })
      .where("id", "!=", id);
    if (checkDepartmentPortalCode.length > 0) {
      return res
        .status(200)
        .json({
          error: true,
          message: "Department Portal Code already exists",
        })
        .end();
    }

    const updationDataIs = await functions.takeSnapShot(
      "department_portal_code",
      id
    );

    const updateDepartmentPortalCode = await knex("department_portal_code")
      .where("id", id)
      .update({ name, dept_id, status });

    if (updateDepartmentPortalCode) {
      return res.status(200).json({
        error: false,
        message: "Department Portal Code updated",
      });
    }

    if (id) {
      const modifiedByTable1 = await functions.SetModifiedBy(
        req.headers["authorization"],
        "department_portal_code",
        "id",
        id
      );
      console.log("isUpdated:-", modifiedByTable1);
    }
    return res.json({
      error: true,
      message: "Can not update, try again",
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

const paginate = async (req, res) => {
  try {
    const tableName = "department_portal_code";
    const searchFrom = ["name"];

    const { error, value } = validation.paginate(req.body);
    if (error) {
      return res.json({
        error: true,
        message: error.details[0].message,
        data: error,
      });
    }

    let { offset, limit, order, sort, search, status } = value;
    let total = 0;
    let results = knex(tableName);
    if (status != undefined && status != "") {
      total = results.where("department_portal_code.status", status);
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
      message: "Countries are retrieved successfully.",
      data: {
        rows: data_rows,
        total: total.total,
      },
    });
  } catch (error) {
    fun.sendErrorLog(req, error);
    return res.json({
      error: true,
      message: "Something went wrong",
      data: JSON.stringify(error),
    });
  }
};

const list = async (req, res) => {
  try {
    const getListDepartmentPortalCode = await knex(
      "department_portal_code"
    ).select("*");
    if (getListDepartmentPortalCode.length > 0) {
      return res.status(200).json({
        error: false,
        message: "List Department Portal Code",
        data: getListDepartmentPortalCode,
      });
    }
    return res.status(200).json({
      error: true,
      message: "Department Portal Code not found",
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

const filter = async (req, res) => {
  try {
    const { error, value } = validation.filter(req.params);
    if (error) {
      return res.status(400).json({
        error: true,
        message: error.details[0].message,
      });
    }

    const { dept_id } = value;

    const getListDepartmentPortalCode = await knex(
      "department_portal_code"
    ).where("dept_id", dept_id);
    if (getListDepartmentPortalCode.length > 0) {
      return res.status(200).json({
        error: false,
        message: "List Department Portal Code",
        data: getListDepartmentPortalCode,
      });
    }

    return res.status(200).json({
      error: true,
      message: "Department Portal Code not found",
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
const create2 = async (req, res) => {
  try {
    const { error, value } = validation.create2(req.body);
    if (error) {
      return res
        .json({
          error: true,
          message: "field error",
        })
        .end();
    }

    const { dept_id, portal_department_code, portal_code } = value;

    const checkDeptIdExist = await knex("departments").where({ id: dept_id });
    if ((checkDeptIdExist == "") | null) {
      return res
        .json({
          error: true,
          message: "Department id does not exist",
        })
        .end();
    }

    const insertdata = await knex("portal_test").insert(value);
    if (!insertdata) {
      return res.json({
        error: true,
        message: "Unable to add portal details",
      });
    }

    return res
      .json({
        error: false,
        message: "Details inserted successfully",
        data: insertdata,
      })
      .end();
  } catch (error) {
    return res
      .json({
        error: true,
        message: "somthing went wrong",
      })
      .end();
  }
};

export default {
  list,
  filter,
  create,
  view,
  deleted,
  update,
  paginate,
  create2,
};
