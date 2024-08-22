import knex from "../../config/mysql_db.js";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import validation from "../../validation/supplier/approverDashboard.js";
dotenv.config();

// function to decode access token and fetch department
const decodeAccessToken = async (accessToken) => {
  try {
    const decodedToken = jwt.verify(
      accessToken.replace("Bearer ", ""),
      process.env.JWT_SECRET
    );
    const id = decodedToken.id;
    const idArray = `[${id}]`;
    const select = await knex("approverTest")
      .select("departmentId")

    if (select.length === 0) {
      return { decodedToken: null, department_id: null };
    }
    const department_id = select[0].departmentId;
    return { decodedToken, department_id };
  } catch (error) {
    return { decodedToken: null, department_id: null };
  }
};

// Function to count records based on status and department_id
const countRecords = async (
  tableName,
  currentDate,
  yesterday,
  status,
  department_id,
  // department,
  timestampField = "created_at"
) => {
  const count = await knex(tableName)
    .where(timestampField, "<=", currentDate)
    .where(timestampField, ">", yesterday)
    .where("status", status)
    .where("department_id", department_id)
    // .where("department", department)
    .count();
  return count[0]["count(*)"];
};

const getCountdata = async (
  tableName,
  conditions,
  department_id
  // department
) => {
  try {
    const query = knex(tableName);

    for (const [key, value] of Object.entries(conditions)) {
      if (value === true) {
        query.whereNotNull(key);
      } else if (value === false) {
        query.whereNull(key);
      } else {
        query.where(key, value);
      }
    }

    // Add department_id condition
    query.where("department_id", department_id);

    // query.where("department", department);

    const result = await query.count();
    return parseInt(result[0]["count(*)"]);
  } catch (error) {
    throw error;
  }
};

// Supplier analytics function
const supplier_details = async (req, res) => {
  try {

    const { error, value } = validation.supplierDetails(req.body);
    if (error) {
      return res.status(400).json({
        error: true,
        message: error.details[0].message,
        // data: error,
      });
    }
    const { status, offset, limit, order, sort } = value;
    const accessToken = req.headers.authorization;

    // Decode the access token and fetch department
    const { decodedToken, department_id, department } = await decodeAccessToken(
      accessToken
    );

    if (!department_id) {
      return res.status(404).json({
        error: true,
        message: "No department found",
      });
    }
    const suppliers = await knex("supplier_details")
      .select(
        "id",
        "supplier_name",
        "emailID",
        "department",
        "status",
        "created_at"
      )
      .where({
        department_id: department_id,
        department: department,
        status: status,
      })
      .orderBy(sort || "created_at", order || "desc") // Default ordering by 'created_at' column descending
      .offset(offset)
      .limit(limit);

    const total = await knex("supplier_details")
      .count("* as count")
      .where({
        department_id: department_id,
        // department: department,
        status: status,
      })
      .first();

    const supplier = suppliers.map((supplier, index) => {
      return {
        ...supplier,
        sr: offset + index + 1,
      };
    });
    return res.status(200).json({
      error: false,
      message: "Retrieved successfully",
      total: total.count,
      data: supplier,
    });
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({
      error: true,
      message: "Could not load record.",
      data: JSON.stringify(error),
    });
  }
};

// Count time bound function
const count_time_bound = async (req, res) => {
  try {
    const accessToken = req.headers.authorization;
    // let { startDate, endDate } = req.body;
    let { startDate, endDate, year, month } = req.body;
    let weeks = "";
    if (year) {
      if (isNaN(year) || year < 0 || year.toString().length !== 4) {
        return res.json({
          error: true,
          message: "Invalid year. Year must be a valid 4-digit number.",
        });
      }
    }

    if (month < 1 || month > 12) {
      return res.status(400).json({
        error: true,
        message: "Invalid month number. Month must be between 1 and 12",
      });
    }

    const currentDate = new Date();
    const defaultEndDate = currentDate.toISOString().split("T")[0];
    const lastTenDays = new Date(
      currentDate.getTime() - 10 * 24 * 60 * 60 * 1000
    );
    const defaultStartDate = lastTenDays.toISOString().split("T")[0];

    const sDate = startDate ? new Date(startDate) : new Date(defaultStartDate);
    const eDate = endDate ? new Date(endDate) : new Date(defaultEndDate);

    if (!startDate || !endDate) {
      const currentDate = new Date();
      endDate = currentDate.toISOString().split("T")[0];
      const lastTenDays = new Date(
        currentDate.getTime() - 10 * 24 * 60 * 60 * 1000
      );
      startDate = lastTenDays.toISOString().split("T")[0]; // 10 days ago
    }
    // Decode the access token and fetch department
    const { decodedToken, department_id } = await decodeAccessToken(
      accessToken
    );

    if (!department_id) {
      return res.status(404).json({
        error: true,
        message: "No department found",
      });
    }

    const monthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];

    const result = [];
    const collection_pending = [];
    const collection_approved = [];
    const collection_verified = [];
    const collection_sapcode = [];
    const collection_rejected = [];
    const collection_queried = [];
    const collection_deactive = [];
    const collection_dates = [];
    let weekData = [];

    // const sDate = new Date(startDate);
    // const eDate = new Date(endDate);

    if (month !== undefined && month !== "") {
      weeks = weeksOfMonth(month, year);
      for (const week of weeks) {
        const weekStartDate = new Date(week.startDate);
        const weekEndDate = new Date(week.endDate);
        const weekData = {
          week: week.week,
          pending_vendor: 0,
          approved_vendor: 0,
          verified_vendor: 0,
          created_vendor: 0,
          rejected_vendors: 0,
          queried_vendors: 0,
          deactivate_vendors: 0,
        };
        console.log(weekStartDate, weekEndDate);
        // Convert week start and end dates to dates without time component
        const sdt = new Date(
          weekStartDate.getFullYear(),
          weekStartDate.getMonth(),
          weekStartDate.getDate()
        );
        const edt = new Date(
          weekEndDate.getFullYear(),
          weekEndDate.getMonth(),
          weekEndDate.getDate()
        );

        // Fetch records where created_at date is within the week
        const Wdata = await knex("supplier_details")
          .select("status", "created_at")
          .where({ department_id: department_id })
          // .whereBetween(knex.raw("DATE(created_at)"), [sdt, edt]);
          .whereBetween(knex.raw("DATE_ADD(created_at, INTERVAL 1 DAY)"), [
            sdt,
            edt,
          ]);

        // Fetch records where sap_code_time date is within the week and status is 'approved'
        const wcv = await knex("supplier_details")
          .select(knex.raw("DATE(sap_code_time) as date"))
          .select("status")
          .where({
            status: "approved",
            department_id: department_id,
            // department: department,
          })
          .whereBetween(knex.raw("DATE_ADD(sap_code_time, INTERVAL 1 DAY)"), [
            sdt,
            edt,
          ]);

        console.log(wcv);
        const statusCounts = {
          pending: "pending_vendor",
          approved: "approved_vendor",
          verified: "verified_vendor",
          created: "created_vendor",
          queried: "queried_vendors",
          rejected: "rejected_vendors",
          deactive: "deactivate_vendors",
        };

        for (const data of Wdata) {
          const status = data.status;
          const countKey = statusCounts[status];
          if (countKey) {
            weekData[countKey]++;
          }
        }
        for (const data of wcv) {
          weekData[statusCounts.created]++;
        }
        // Push the counts for each status for this week into the respective arrays
        collection_dates.push(weekData.week);
        collection_pending.push(weekData.pending_vendor);
        collection_sapcode.push(weekData.created_vendor);
        collection_approved.push(weekData.approved_vendor);
        collection_verified.push(weekData.verified_vendor);
        collection_rejected.push(weekData.rejected_vendors);
        collection_queried.push(weekData.queried_vendors);
        collection_deactive.push(weekData.deactivate_vendors);
      }
    }
    if (year !== undefined && year !== "") {
      const data = await knex("supplier_details")
        .select(knex.raw("MONTH(created_at) as month"))
        .select("status")
        .where({ department_id: department_id })
        .whereBetween("created_at", [`${year}-01-01`, `${year}-12-31`]);

      const cv = await knex("supplier_details")
        .select(knex.raw("MONTH(sap_code_time) as month"))
        .select("status")
        .where({
          status: "approved",
          department_id: department_id,
          // department: department,
        })
        .whereBetween("sap_code_time", [`${year}-01-01`, `${year}-12-31`]);

      for (let i = 0; i < 12; i++) {
        result.push({
          month: monthNames[i],
          approved: 0,
          pending: 0,
          verified: 0,
          created_v: 0,
          rejected: 0,
          queried: 0,
          deactive: 0,
        });
      }

      data.forEach((item) => {
        const monthIndex = item.month - 1;
        const status = item.status;
        if (status === "approved") result[monthIndex].approved++;
        else if (status === "pending") result[monthIndex].pending++;
        else if (status === "verified") result[monthIndex].verified++;
        else if (status === "rejected") result[monthIndex].rejected++;
        else if (status === "queried") result[monthIndex].queried++;
        else if (status === "deactive") result[monthIndex].deactive++;
      });
      cv.forEach((item) => {
        if (item.month !== null) {
          const monthIndex = item.month - 1;
          const status = item.status;
          if (status === "approved") result[monthIndex].created_v++;
        }
      });
    }

    // Calculate number of days between start and end dates
    const numberOfDays = Math.ceil((eDate - sDate) / (1000 * 60 * 60 * 24));

    // for (let i = 0; i <= numberOfDays; i++) {
    for (let i = numberOfDays; i >= 0; i--) {
      const currentDate = new Date(
        sDate.getFullYear(),
        sDate.getMonth(),
        sDate.getDate() + i,
        23,
        59,
        59
      );

      const yesterday = new Date(currentDate);
      yesterday.setDate(currentDate.getDate() - 1);

      const formattedDate = `${currentDate.getDate()}-${
        monthNames[currentDate.getMonth()]
      }`;
      // collection_dates.push(formattedDate);

      if (month === undefined || month === "") {
        if (year === undefined || year === "") {
          if (!req.body.startDate && !req.body.endDate) {
            collection_dates.push(formattedDate);
          } else {
            console.log("here1");
            // collection_dates.push(formattedDate);
            collection_dates.reverse();
          }
        }
      }

      if (req.body.startDate && req.body.endDate) {
        console.log(req.body.startDate, req.body.endDate);
        console.log("here2");
        if (month === undefined || month === "") {
          if (year === undefined || year === "") {
            console.log("here3");
            collection_dates.push(formattedDate);
            console.log(collection_dates);
            collection_dates.reverse();
          }
        }
      }
      // if (month === undefined || month === "") {
      //   if (year === undefined || year === "") {
      //     collection_dates.push(formattedDate);
      //   }
      // }
      const [
        pendingCount,
        sapcodeCount,
        approvedCount,
        verifiedCount,
        rejectedCount,
        queriedCount,
        deactivatedCount,
      ] = await Promise.all([
        countRecords(
          "supplier_details",
          currentDate,
          yesterday,
          "pending",
          department_id
        ),
        countRecords(
          "supplier_details",
          currentDate,
          yesterday,
          "approved",
          department_id,
          "sap_code_time"
        ),
        countRecords(
          "supplier_details",
          currentDate,
          yesterday,
          "approved",
          department_id
        ),
        countRecords(
          "supplier_details",
          currentDate,
          yesterday,
          "verified",
          department_id
        ),
        countRecords(
          "supplier_details",
          currentDate,
          yesterday,
          "rejected",
          department_id
        ),
        countRecords(
          "supplier_details",
          currentDate,
          yesterday,
          "queried",
          department_id
        ),
        countRecords(
          "supplier_details",
          currentDate,
          yesterday,
          "deactive",
          department_id
        ),
      ]);
      if (month === undefined || month === "") {
        if (year === undefined || year === "") {
          if (!req.body.startDate && !req.body.endDate) {
            collection_pending.push(pendingCount);
            collection_sapcode.push(sapcodeCount);
            collection_approved.push(approvedCount);
            collection_verified.push(verifiedCount);
            collection_rejected.push(rejectedCount);
            collection_queried.push(queriedCount);
            collection_deactive.push(deactivatedCount);
          } else {
            collection_pending.reverse();
            collection_sapcode.reverse();
            collection_approved.reverse();
            collection_verified.reverse();
            collection_rejected.reverse();
            collection_queried.reverse();
            collection_deactive.reverse();
          }
        }
      }

      if (req.body.startDate && req.body.endDate) {
        if (month === undefined || month === "") {
          if (year === undefined || year === "") {
            collection_pending.push(pendingCount);
            collection_sapcode.push(sapcodeCount);
            collection_approved.push(approvedCount);
            collection_verified.push(verifiedCount);
            collection_rejected.push(rejectedCount);
            collection_queried.push(queriedCount);
            collection_deactive.push(deactivatedCount);
            collection_pending.reverse();
            collection_sapcode.reverse();
            collection_approved.reverse();
            collection_verified.reverse();
            collection_rejected.reverse();
            collection_queried.reverse();
            collection_deactive.reverse();
          }
        }
      }
    }

    if (month === undefined || month === "") {
      result.forEach(
        ({
          month,
          approved,
          pending,
          verified,
          created_v,
          rejected,
          queried,
          deactive,
        }) => {
          collection_dates.push(month);
          collection_pending.push(pending);
          collection_sapcode.push(created_v);
          collection_approved.push(approved);
          collection_verified.push(verified);
          collection_rejected.push(rejected);
          collection_queried.push(queried);
          collection_deactive.push(deactive);
        }
      );
    }
    return res.status(200).json({
      error: false,
      message: "Data retrieved",
      pending_vendors: collection_pending,
      sap_registered_vendors: collection_sapcode,
      approved_vendors: collection_approved,
      verified_vendor: collection_verified,
      rejected_vendors: collection_rejected,
      queried_vendors: collection_queried,
      deactive_vendors: collection_deactive,
      dates: collection_dates,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      error: true,
      message: "Could not load record.",
      data: JSON.stringify(error),
    });
  }
};

const percentage = async (req, res) => {
  try {
    // const { status = 'pending' } = req.body;
    const { error, value } = validation.percentage(req.body);
    if (error) {
      return res.status(400).json({
        error: true,
        message: error.details[0].message,
        data: error,
      });
    }
    const accessToken = req.headers.authorization;

    // Decode the access token and fetch department
    const { decodedToken, department_id, department } = await decodeAccessToken(
      accessToken
    );

    if (!decodedToken || !department_id) {
      return res.status(404).json({
        error: true,
        message: "No department found",
      });
    }

    // analytics
    const [
      sapCodeCount,
      noSapCodeCount,
      pendingVendor,
      verifiedVendor,
      approvedVendor,
      rejectedVendor,
      gstRegistered,
      panRegistered,
      queriedVendors,
      totalRecords,
    ] = await Promise.all([
      getCountdata(
        "supplier_details",
        { sap_code: true },
        department_id
        // department
      ),
      getCountdata(
        "supplier_details",
        { sap_code: false },
        department_id
        // department
      ),
      getCountdata(
        "supplier_details",
        { status: "pending" },
        department_id
        // department
      ),
      getCountdata(
        "supplier_details",
        { status: "verified" },
        department_id
        // department
      ),
      getCountdata(
        "supplier_details",
        { status: "approved" },
        department_id
        // department
      ),
      getCountdata(
        "supplier_details",
        { status: "rejected" },
        department_id
        // department
      ),
      getCountdata(
        "supplier_details",
        { gstNo: true },
        department_id
        // department
      ),
      getCountdata(
        "supplier_details",
        { panNo: true, gstNo: false },
        department_id
        // department
      ),
      getCountdata(
        "supplier_details",
        { status: "queried" },
        department_id
        // department
      ),
      getCountdata("supplier_details", {}, department_id),

      // getTotalCount("supplier_details", department_id),
    ]);

    const percentageApprovedVendors = (
      (approvedVendor / totalRecords) *
      100
    ).toFixed(2);

    // suppliers details status wise
    const supplierDetails = await knex("supplier_details")
      .select(
        "id",
        "supplier_name",
        "emailID",
        "department",
        "status",
        "created_at"
      )
      .where({ department_id: department_id, status: value.status });

    return res.json({
      error: false,
      message: "Retrived Successfully !",
      data: {
        sapCodeCount,
        noSapCodeCount,
        pendingVendor,
        queriedVendors,
        verifiedVendor,
        approvedVendor,
        rejectedVendor,
        gstRegistered,
        panRegistered,
        percentageApprovedVendors: parseFloat(percentageApprovedVendors),
        totalRecords,
        // suppliersDetails: supplierDetails,
      },
    });
  } catch (error) {
    console.error("Error:", error); // Log the error for debugging
    return res.status(500).json({
      error: true,
      message: "Could not load record.",
      data: JSON.stringify(error),
    });
  }
};

function weeksOfMonth(month, year = null) {
  if (year === null) {
    year = new Date().getFullYear();
  }

  const weeks = [];
  const daysInMonth = new Date(year, month, 0).getDate();

  const firstDayOfMonth = new Date(year, month - 1, 1);
  firstDayOfMonth.setDate(firstDayOfMonth.getDate() + 1);
  const firstMonday = 2 + (7 - firstDayOfMonth.getDay());

  let startDate = firstDayOfMonth;
  let endDate = new Date(year, month - 1, firstMonday);
  endDate.setDate(endDate.getDate() + 1);

  weeks.push({
    week: `week_1`,
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
  });

  while (endDate.getDate() < daysInMonth) {
    startDate = new Date(year, month - 1, endDate.getDate() + 1);
    endDate = new Date(
      year,
      month - 1,
      Math.min(endDate.getDate() + 7, daysInMonth)
    );

    // if(startDate.getDate() - daysInMonth <= 7){
    //   // endDate.setDate(endDate.getDate()+1)
    // }
    weeks.push({
      week: `week_${weeks.length + 1}`,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    });
  }
  if (endDate.getDate() === daysInMonth) {
    endDate.setDate(endDate.getDate() + 1);
    weeks[weeks.length - 1].endDate = endDate.toISOString();
  }
  return weeks;
}

export default {
  supplier_details,
  count_time_bound,
  percentage,
};
