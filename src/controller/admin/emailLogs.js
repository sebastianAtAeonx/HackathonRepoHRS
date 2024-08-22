import knex from "../../config/mysql_db.js";
import validation from "../../validation/admin/emailLogs.js";

const view = async (req, res) => {
  try {
    const { error, value } = validation.view(req.params);
    if (error) {
      return res.status(400).json({
        status: false,
        message: error.message,
      });
    }

    const { id } = value;

    const getEmailLog = await knex("email_logs").where({ id }).first();

    if (getEmailLog === undefined) {
      return res.status(404).json({
        status: false,
        message: "Email Log not found",
      });
    }

    return res.status(200).json({
      status: true,
      data: getEmailLog,
    });
  } catch (error) {
    return res.json({
      error: true,
      message: "Could not fetch record.",
      data: { error: JSON.stringify(error) },
    });
  }
};
const list = async (req, res) => {
  try {
    const tableName = "email_logs";
    const searchFrom = ["fromemail", "toemail", "subject"];
    const { error, value } = validation.paginate(req.body);
    if (error) {
      return res.status(400).json({
        error: true,
        message: error.details[0].message,
        data: error,
      });
    }

    let { offset, limit, order, sort, search, status, filter } = value;
    let total = 0;
    let results = knex(tableName);

    results = results.where(function () {
      if (search != undefined && search != "") {
        searchFrom.forEach((element) => {
          this.orWhereILike(element, `%${search}%`);
        });
      }
    });
    if (filter) {
      const { startDate, endDate, dateField } = filter;
      if (startDate && endDate && dateField) {
        const startDateISO = new Date(startDate).toISOString();
        // const endDateISO = new Date(endDate + "T23:59:59.999Z").toISOString();
        const endDateObj = new Date(endDate);
        endDateObj.setHours(23, 59, 59, 999);
        const endDateISO = endDateObj.toISOString();
        results.whereBetween(dateField, [startDateISO, endDateISO]);
      }
    }
    total = await results.count("id as total").first();
    let rows = knex(tableName);

    rows = rows.where(function () {
      if (search != undefined && search != "") {
        searchFrom.forEach((element) => {
          this.orWhereILike(element, `%${search}%`);
        });
      }
    });
    if (filter) {
      const { startDate, endDate, dateField } = filter;
      if (startDate && endDate && dateField) {
        const startDateISO = new Date(startDate).toISOString();
        // const endDateISO = new Date(endDate + "T23:59:59.999Z").toISOString();
        const endDateObj = new Date(endDate);
        endDateObj.setHours(23, 59, 59, 999);
        const endDateISO = endDateObj.toISOString();
        rows.whereBetween(dateField, [startDateISO, endDateISO]);
      }
    }
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
    return res.status(500).json({
      error: true,
      message: "Could not load records.",
      data: { error: JSON.stringify(error) },
    });
  }
};

const paginateCompany = async (req, res) => {
  try {
    const tableName = "companies";
    const searchFrom = ["name"];
    const { error, value } = validation.paginateCompany(req.body);
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
    if (status != undefined && status != "") {
      total = results.where("companies.status", status);
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
    fun.sendErrorLog(req, error);
    return res.status(500).json({
      error: true,
      message: "Could not load records.",
      data: { error: JSON.stringify(error) },
    });
  }
};

export default {
  view,
  list,
};
