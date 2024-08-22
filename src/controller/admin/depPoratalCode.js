import md5 from "md5";
import knex from "../../config/mysql_db.js";
import validation from "../../validation/admin/depPortalCode.js";

const list = async (req, res) => {
  const getListDepartmentPortalCode = await knex(
    "department_portal_code"
  ).select("*");
  if (getListDepartmentPortalCode.length > 0) {
    return res
      .status(200)
      .json({
        error: false,
        message: "List Department Portal Code",
        data: getListDepartmentPortalCode,
      })
      .end();
  }
  return res
    .status(404)
    .json({
      error: true,
      message: "Department Portal Code not found",
    })
    .end();
};

const filter = async (req, res) => {
  const { error, value } = validation.filter(req.params);
  if (error) {
    return res
      .status(400)
      .json({
        error: true,
        message: error.details[0].message,
      })
      .end();
  }

  const { dept_id } = value;

  const getListDepartmentPortalCode = await knex(
    "department_portal_code"
  ).where("dept_id", dept_id);
  if (getListDepartmentPortalCode.length > 0) {
    return res
      .status(200)
      .json({
        error: false,
        message: "Record found Successfully",
        data: getListDepartmentPortalCode,
      })
      .end();
  }

  return res
    .status(404)
    .json({
      error: true,
      message: "Department Portal Code not found",
    })
    .end();
};

export default {
  list,
  filter,
};
