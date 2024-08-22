import knex from "../../config/mysql_db.js";
import fun from "../../helpers/functions.js";
import constants from "../../helpers/constants.js";
import validation from "../../validation/report/supplierReport.js";

function getStartAndEndDateOfMonth(year, month) {
  // Ensure month is within the valid range (1-12)
  if (month < 1 || month > 12) {
    throw new Error("Invalid month number. Month must be between 1 and 12.");
  }

  // Calculate the start date of the month
  const startDate = new Date(year, month - 1, 1);

  // Calculate the end date of the month
  const endDate = new Date(year, month, 0);

  return { startDate, endDate };
}

function getStartAndEndDateOfYear(year) {
  // Validate year
  if (isNaN(year) || year < 0 || year.toString().length !== 4) {
    throw new Error("Invalid year. Year must be a valid 4-digit number.");
  }

  // Calculate the start date of the year (January 1st)
  const startDate = new Date(year, 0, 1);

  // Calculate the end date of the year (December 31st)
  const endDate = new Date(year, 11, 31);

  return { startDate, endDate };
}

function getCurrentWeekDates() {
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0 (Sunday) to 6 (Saturday)
  const startDate = new Date(today);
  startDate.setDate(startDate.getDate() - dayOfWeek); // Start date of the current week (Sunday)
  const endDate = new Date(today);
  endDate.setDate(endDate.getDate() + (6 - dayOfWeek)); // End date of the current week (Saturday)

  return { startDate, endDate };
}

function getLastWeekDates() {
  const today = new Date();
  const lastSunday = new Date(today);
  lastSunday.setDate(today.getDate() - today.getDay() - 7); // Go back to the previous Sunday
  const lastSaturday = new Date(lastSunday);
  lastSaturday.setDate(lastSunday.getDate() + 6); // Get the previous Saturday

  const startDate = new Date(lastSunday);
  const endDate = new Date(lastSaturday);

  return { startDate, endDate };
}

const byDateMonthYear = async (req, res) => {
  try {
    const { error, value } = validation.supplierReport(req.body);

    if (error) {
      return res.json({
        error: true,
        message: error.details[0].message,
      });
    }

    const {
      startDate,
      endDate,
      month,
      year,
      status,
      offset,
      limit,
      sort,
      order,
      search,
    } = value;

    let startDateValue, endDateValue;

    if (startDate != undefined && endDate != undefined) {
      startDateValue = startDate;
      endDateValue = endDate;
      console.log("hear -startdate enddate");
    } else if (month != undefined && year != undefined) {
      const { startDate, endDate } = getStartAndEndDateOfMonth(year, month);
      startDateValue = startDate;
      endDateValue = endDate;
      console.log("here month");
    } else if (year != undefined) {
      const { startDate, endDate } = getStartAndEndDateOfYear(year);
      startDateValue = startDate;
      endDateValue = endDate;
      console.log("hear year", year, startDate, endDate);
    }

    console.log("startdate:=", startDateValue, "endDate:=", endDateValue);

    //find data...

    const searchFrom = ["supplier_name", "gstNo", "panNo"];

    let getSupplier = knex("supplier_details");

    getSupplier.where(function () {
      if (search != undefined && search != "") {
        searchFrom.forEach((element) => {
          this.orWhereILike(element, `%${search}%`);
        });
      }
    });

    if (startDateValue && endDateValue) {
      getSupplier = getSupplier
        .where("supplier_details.created_at", ">=", startDateValue)
        .where("supplier_details.created_at", "<=", endDateValue);
    }

    if (status != "all") {
      getSupplier = getSupplier.where("status", status);
    }

    const totalRecords = await getSupplier.select();

    getSupplier = await getSupplier
      .select()
      .offset(offset)
      .limit(limit)
      .orderBy(sort, order);

    let srno = 1 + offset;
    for (const iterator of getSupplier) {
      delete iterator.password;
      iterator.srno = srno++;
    }

    return res
      .json({
        error: false,
        message: "Supplier retrived successfully",
        data: getSupplier,
        startDate: startDateValue ? startDateValue.toDateString() : null,
        endDate: endDateValue ? endDateValue.toDateString() : null,
        total: totalRecords.length,
        status: status,
      })
      .end();

    //find data...over
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: "Something went wrong",
      data :error.message
    });
  }
};

export default {
  byDateMonthYear,
};
