import knex from "../../config/mysql_db.js";
import { v4 as uuidv4 } from "uuid";
import fun from "../../helpers/functions.js";
import { json } from "express";
import jwt from "jsonwebtoken";
import constants from "../../helpers/constants.js";
import validation from "../../validation/admin/dashboard.js";

// const count_time_bound = async (req, res) => {
//   try {
//     const today = new Date();
//     const monthNames = [
//       "Jan",
//       "Feb",
//       "Mar",
//       "Apr",
//       "May",
//       "Jun",
//       "Jul",
//       "Aug",
//       "Sep",
//       "Oct",
//       "Nov",
//       "Dec",
//     ];

//     const collection_pending = [];
//     const collection_sapcode = [];
//     const collection_approved = [];
//     const collection_verified = [];
//     const collection_dates = [];

//     // Start querying from 10 days ago
//     for (let i = 0; i < 10; i++) {
//       const currentDate = new Date();
//       currentDate.setDate(today.getDate() - i);
//       const yesterday = new Date(currentDate);
//       yesterday.setDate(currentDate.getDate() - 1);

//       const formattedDate = `${currentDate.getDate()}-${
//         monthNames[currentDate.getMonth()]
//       }`;
//       collection_dates.push(formattedDate);

//       const [pendingCount, sapcodeCount, approvedCount, verifiedCount] =
//         await Promise.all([
//           countRecords("supplier_details", currentDate, yesterday, "pending"),
//           countRecords(
//             "supplier_details",
//             currentDate,
//             yesterday,
//             "approved",
//             "sap_code_time"
//           ),
//           countRecords("supplier_status", currentDate, yesterday, "approved"),
//           countRecords("supplier_status", currentDate, yesterday, "verified"),
//         ]);

//       collection_pending.push(pendingCount);
//       collection_sapcode.push(sapcodeCount);
//       collection_approved.push(approvedCount);
//       collection_verified.push(verifiedCount);
//     }

//     return res.json({
//       error: false,
//       message: "Data retrieved",
//       pending_vendor: collection_pending,
//       created_vendor: collection_sapcode,
//       approved_vendor: collection_approved,
//       verified_vendor: collection_verified,
//       dates: collection_dates,
//     });
//   } catch (error) {
//     console.error("Error:", error);
//     return res.status(500).json({
//       error: true,
//       message: "Internal server error",
//     });
//   }
// };

// function to decode access token and fetch department

const decodeAccessToken = async (accessToken) => {
  try {
    const decodedToken = jwt.verify(
      accessToken.replace("Bearer ", ""),
      process.env.JWT_SECRET
    );
    const role_id = decodedToken.role_id;
    const id = decodedToken.id;
    const getRole = await knex("role")
      .select("name")
      .where({ id: role_id })
      .first();

      console.log("this is",getRole)
    const roleName = getRole.name;
    const idArray = `[${id}]`;
    if (roleName == "Approver") {
      const select = await knex("approverTest")
        .select("departmentId")

      if (select.length === 0) {
        return { decodedToken: null, department_id: null };
      }
      const department_id = select[0].departmentId;
      return { decodedToken, department_id };
    }
    if (roleName == "Admin") {
      return { decodedToken };
    }
  } catch (error) {
    console.log(error);
    return { decodedToken: null, department_id: null };
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

const count_time_bound = async (req, res) => {
  try {
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
      return res.json({
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
    let collection_dates = [];
    let weekData = [];
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

        const Wdata = await knex("supplier_details")
          .select("status", "created_at")
          // .whereBetween(knex.raw("DATE(created_at)"), [sdt, edt]);
          .whereBetween(knex.raw("DATE_ADD(created_at, INTERVAL 1 DAY)"), [
            sdt,
            edt,
          ]);
        const wcv = await knex("supplier_details")
          .select(knex.raw("DATE(sap_code_time) as date"))
          .select("status")
          .where({ status: "approved" })
          // .whereBetween(knex.raw("DATE(sap_code_time)"), [sdt, edt]);
          .whereBetween(knex.raw("DATE_ADD(sap_code_time, INTERVAL 1 DAY)"), [
            sdt,
            edt,
          ]);

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
        .whereBetween("created_at", [`${year}-01-01`, `${year}-12-31`]);
      console.log(data);
      const cv = await knex("supplier_details")
        .select(knex.raw("MONTH(sap_code_time) as month"))
        .select("status")
        .where({ status: "approved" })
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

    const numberOfDays = Math.ceil((eDate - sDate) / (1000 * 60 * 60 * 24));

    for (let i = numberOfDays; i >= 0; i--) {
      const currentDate = new Date(
        sDate.getFullYear(),
        sDate.getMonth(),
        sDate.getDate() + i,
        23,
        59,
        59
      );
      // console.log(currentDate)
      const yesterday = new Date(currentDate);
      yesterday.setDate(currentDate.getDate() - 1);
      const formattedDate = `${currentDate.getDate()}-${
        monthNames[currentDate.getMonth()]
      }`;

      if (month === undefined || month === "") {
        if (year === undefined || year === "") {
          if (!startDate && !endDate) {
            console.log(formattedDate);
            collection_dates.push(formattedDate);
          } else {
            collection_dates.reverse();
          }
        }
      }

      if (startDate && endDate) {
        if (
          month === undefined ||
          (month === "" && year === undefined) ||
          year === ""
        ) {
          collection_dates.push(formattedDate);
          collection_dates.reverse();
        }
      }

      const [
        pendingCount,
        sapcodeCount,
        approvedCount,
        verifiedCount,
        rejectedCount,
        queriedCount,
        deactivatedCount,
      ] = await Promise.all([
        countRecords("supplier_details", currentDate, yesterday, "pending"),
        countRecords(
          "supplier_details",
          currentDate,
          yesterday,
          "approved",
          "sap_code_time"
        ),
        countRecords("supplier_details", currentDate, yesterday, "approved"),
        countRecords("supplier_details", currentDate, yesterday, "verified"),
        countRecords("supplier_details", currentDate, yesterday, "rejected"),
        countRecords("supplier_details", currentDate, yesterday, "queried"),
        countRecords("supplier_details", currentDate, yesterday, "deactive"),
      ]);

      if (month === undefined || month === "") {
        if (year === undefined || year === "") {
          if (!startDate && !endDate) {
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
      if (startDate && endDate) {
        if (
          month === undefined ||
          (month === "" && year === undefined) ||
          year === ""
        ) {
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

    return res.json({
      error: false,
      message: "Data retrieved",
      pending_vendors: collection_pending,
      sap_registered_vendors: collection_sapcode,
      approved_vendors: collection_approved,
      // verified_vendor: collection_verified,
      rejected_vendors: collection_rejected,
      queried_vendors: collection_queried,
      deactive_vendors: collection_deactive,
      dates: collection_dates,
    });
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({
      error: true,
      message: "Internal server error",
    });
  }
};

const countRecords = async (
  tableName,
  currentDate,
  yesterday,
  status,
  timestampField = "created_at"
) => {
  const count = await knex(tableName)
    .where(timestampField, "<=", currentDate)
    .where(timestampField, ">", yesterday)
    .where("status", status)
    .count();
  return count[0]["count(*)"];
};

const count = async (req, res) => {
  try {
    const [
      sapCodeCount,
      noSapCodeCount,
      pendingVendorCount,
      verifiedVendorCount,
      approvedVendorCount,
      rejectedVendorCount,
      gstRegisteredCount,
      panRegisteredCount,
      totalRegisteredVendors,
    ] = await Promise.all([
      getCount({ sap_code: true }),
      getCount({ sap_code: false }),
      getCount({ status: "pending" }),
      getCount({ level1status: "verified" }),
      getCount({ status: "approved" }),
      getCount({ status: "rejected" }),
      getCount({ gstNo: true }),
      getCount({ gstNo: false, gstNo: "" }),
      getCount({}),
    ]);

    return res.json({
      sapCodeCount,
      noSapCodeCount,
      pendingVendorCount,
      verifiedVendorCount,
      approvedVendorCount,
      rejectedVendorCount,
      gstRegisteredCount,
      panRegisteredCount,
      totalRegisteredVendors,
    });
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({
      error: true,
      message: "Internal server error",
    });
  }
};

const getCount = async (conditions) => {
  let query = knex("supplier_details");

  for (const [key, value] of Object.entries(conditions)) {
    if (value === true) {
      query = query.whereNotNull(key);
    } else if (value === false) {
      query = query.whereNull(key);
    } else {
      query = query.where(key, value);
    }
  }

  const result = await query.count();
  return result[0]["count(*)"];
};

const supplier_analytics = async (req, res) => {
  try {
    let analyticsData = await knex.raw(`
      SELECT
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) AS pending,
        SUM(CASE WHEN status = 'queried' THEN 1 ELSE 0 END) AS queried,
        SUM(CASE WHEN status = 'verified' THEN 1 ELSE 0 END) AS verified,
        SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) AS approved,
        SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) AS rejected,
        SUM(CASE WHEN gstNo != '' THEN 1 ELSE 0 END) AS gstRegistered,
        SUM(CASE WHEN gstNo = '' AND panNo != '' THEN 1 ELSE 0 END) AS panRegistered,
        COUNT(*) AS total
      FROM supplier_details
    `);
    analyticsData = await analyticsData[0];
    return res.json({
      error: false,
      message: "Analytics retrieved successfully",
      data: {
        pending: analyticsData[0].pending,
        queried: analyticsData[0].queried,
        verified: analyticsData[0].verified,
        approved: analyticsData[0].approved,
        rejected: analyticsData[0].rejected,
        gstRegistered: analyticsData[0].gstRegistered,
        panRegistered: analyticsData[0].panRegistered,
        total: analyticsData[0].total,
      },
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: "Something went wrong",
      data: error.message,
    });
  }
};

// const percentage = async (req, res) => {
//   try {
//     const [
//       sapCodeCount,
//       noSapCodeCount,
//       verifiedVendorCount,
//       approvedVendorCount,
//       rejectedVendorCount,
//       gstRegisteredCount,
//       panRegisteredCount,
//       queriedVendors,
//       totalRecords,
//     ] = await Promise.all([
//       getCountdata("supplier_details", { sap_code: true }),
//       getCountdata("supplier_details", { status: "pending" }),
//       getCountdata("supplier_details", { level1status: "verified" }),
//       getCountdata("supplier_details", { status: "approved" }),
//       getCountdata("supplier_details", { status: "rejected" }),
//       getCountdata("supplier_details", { gstNo: true }),
//       getCountdata("supplier_details", { panNo: false, gstNo: true }),
//       getCountdata("supplier_details", { status: "queried" }),
//       getTotalCount("supplier_details"),
//     ]);

//     const percentageApprovedVendors = (
//       (approvedVendorCount / totalRecords) *
//       100
//     ).toFixed(2);

//     return res.json({
//       sapCodeCount,
//       noSapCodeCount,
//       verifiedVendorCount,
//       approvedVendorCount,
//       rejectedVendorCount,
//       gstRegisteredCount,
//       panRegisteredCount,
//       percentageApprovedVendors: parseFloat(percentageApprovedVendors),
//       queriedVendors,
//       totalRecords,
//     });
//   } catch (error) {
//     console.error("Error:", error); // Log the error for debugging
//     return res.status(500).json({
//       error: true,
//       message: "Internal server error",
//     });
//   }
// };

const percentage = async (req, res) => {
  try {
    const accessToken = req.headers.authorization;

    // Decode the access token and fetch department
    const { decodedToken, department_id, department } = await decodeAccessToken(
      accessToken
    );
    console.log(decodedToken, department, department_id);
    const departmentQuery =
      department_id
        ? { department_id: department_id }
        : {};
    const [
      sapRegistered,
      noSapCodeCount,
      pendingVendors,
      verifiedVendors,
      approvedVendors,
      rejectedVendors,
      gstRegistered,
      panRegistered,
      queriedVendors,
      totalRecords,
    ] = await Promise.all([
      getCountdata("supplier_details", { ...departmentQuery, sap_code: true }),
      getCountdata("supplier_details", { ...departmentQuery, sap_code: false }),
      getCountdata("supplier_details", {
        ...departmentQuery,
        status: "pending",
      }),
      getCountdata("supplier_details", {
        ...departmentQuery,
        status: "verified",
      }),
      getCountdata("supplier_details", {
        ...departmentQuery,
        status: "approved",
      }),
      getCountdata("supplier_details", {
        ...departmentQuery,
        status: "rejected",
      }),
      getCountdata("supplier_details", { ...departmentQuery, gstNo: true }),
      getCountdata("supplier_details", {
        ...departmentQuery,
        panNo: true,
        gstNo: false,
        gstNo: "",
      }),
      getCountdata("supplier_details", {
        ...departmentQuery,
        status: "queried",
      }),
      getCountdata("supplier_details", { ...departmentQuery }),
    ]);

    const percentageApprovedVendors = (
      (approvedVendors / totalRecords) *
      100
    ).toFixed(2);

    return res.json({
      error: false,
      message: "Retrived Successfully !",
      data: {
        sapRegistered,
        noSapCodeCount,
        pendingVendors,
        queriedVendors,
        verifiedVendors,
        approvedVendors,
        rejectedVendors,
        gstRegistered,
        panRegistered,
        percentageApprovedVendors: parseFloat(percentageApprovedVendors),
        registeredVendors: totalRecords,
        totalRecords,
      },
    });
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({
      error: true,
      message: "Internal server error",
    });
  }
};
const getCountdata = async (tableName, conditions) => {
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

    const result = await query.count();
    return parseInt(result[0]["count(*)"]);
  } catch (error) {
    throw error;
  }
};

const getTotalCount = async (tableName) => {
  try {
    const result = await knex(tableName).count();
    return parseInt(result[0]["count(*)"]);
  } catch (error) {
    throw error;
  }
};

const total_asn_scr = async (req, res) => {
  try {
    const getAsnRecords = await knex("asns")
      .select("asnNo", "type", "status")
      .where("type", "NB");
    const getScrRecords = await knex("asns")
      .select("asnNo", "type", "status")
      .where("type", "ZSER");

    return res
      .json({
        error: false,
        message: "Data Retrived",
        asnRecords: getAsnRecords.length,
        scrRecords: getScrRecords.length,
      })
      .end();
  } catch (error) {
    return res.json({
      error: true,
      message: error.message,
    });
  }
};

const detailedAsn_old = async (req, res) => {
  try {
    const asnMaterialShipped = await knex("asns")
      .where("type", "NB")
      .where("status", "materialshipped");

    const asnMaterialGateInward = await knex("asns")
      .where("type", "NB")
      .where("status", "materialGateInward");

    const asnMaterialReceived = await knex("asns")
      .where("type", "NB")
      .where("status", "materialReceived");

    const asnQualityApproved = await knex("asns")
      .where("type", "NB")
      .where("status", "qualityApproved");

    const asnInvoiced = await knex("asns")
      .where("type", "NB")
      .where("status", "invoiced");

    const asnPartiallyPaid = await knex("asns")
      .where("type", "NB")
      .where("status", "partiallyPaid");

    const asnFullyPaid = await knex("asns")
      .where("type", "NB")
      .where("status", "fullyPaid");

    const asnUnpaid = await knex("asns")
      .where("type", "NB")
      .where("status", "unpaid");

    const asnRequested = await knex("asns")
      .where("type", "NB")
      .where("status", "requested");

    const asnAccepted = await knex("asns")
      .where("type", "NB")
      .where("status", "accepted");

    const asnCancelled = await knex("asns")
      .where("type", "NB")
      .where("status", "cancelled");

    const asnPartiallyReceived = await knex("asns")
      .where("type", "NB")
      .where("status", "partiallyReceived");

    const asnTotal = await knex("asns").where("type", "NB");

    return res
      .json({
        error: false,
        message: "Data retrived",
        asnMaterialShipped: asnMaterialShipped.length,
        asnMaterialGateInward: asnMaterialGateInward.length,
        asnMaterialReceived: asnMaterialReceived.length,
        asnQualityApproved: asnQualityApproved.length,
        asnInvoiced: asnInvoiced.length,
        asnPartiallyPaid: asnPartiallyPaid.length,
        asnFullyPaid: asnFullyPaid.length,
        asnUnpaid: asnUnpaid.length,
        asnRequested: asnRequested.length,
        asnAccepted: asnAccepted.length,
        asnCancelled: asnCancelled.length,
        asnPartiallyReceived: asnPartiallyReceived.length,
        asnTotal: asnTotal.length,
      })
      .end();
  } catch (error) {
    return res.json({
      error: true,
      message: error.message,
    });
  }
};

const detailedScr_old = async (req, res) => {
  try {
    const scrMaterialShipped = await knex("asns")
      .where("type", "ZSER")
      .where("status", "materialshipped");

    const scrMaterialGateInward = await knex("asns")
      .where("type", "ZSER")
      .where("status", "materialGateInward");

    const scrMaterialReceived = await knex("asns")
      .where("type", "ZSER")
      .where("status", "materialReceived");

    const scrQualityApproved = await knex("asns")
      .where("type", "ZSER")
      .where("status", "qualityApproved");

    const scrInvoiced = await knex("asns")
      .where("type", "ZSER")
      .where("status", "invoiced");

    const scrPartiallyPaid = await knex("asns")
      .where("type", "ZSER")
      .where("status", "partiallyPaid");

    const scrFullyPaid = await knex("asns")
      .where("type", "ZSER")
      .where("status", "fullyPaid");

    const scrUnpaid = await knex("asns")
      .where("type", "ZSER")
      .where("status", "unpaid");

    const scrRequested = await knex("asns")
      .where("type", "ZSER")
      .where("status", "requested");

    const scrAccepted = await knex("asns")
      .where("type", "ZSER")
      .where("status", "accepted");

    const scrCancelled = await knex("asns")
      .where("type", "ZSER")
      .where("status", "cancelled");

    const scrPartiallyReceived = await knex("asns")
      .where("type", "ZSER")
      .where("status", "partiallyReceived");

    const scrTotal = await knex("asns").where("type", "ZSER");

    return res
      .json({
        error: false,
        message: "Data retrived",
        scrMaterialShipped: scrMaterialShipped.length,
        scrMaterialGateInward: scrMaterialGateInward.length,
        scrMaterialReceived: scrMaterialReceived.length,
        scrQualityApproved: scrQualityApproved.length,
        scrInvoiced: scrInvoiced.length,
        scrPartiallyPaid: scrPartiallyPaid.length,
        scrFullyPaid: scrFullyPaid.length,
        scrUnpaid: scrUnpaid.length,
        scrRequested: scrRequested.length,
        scrAccepted: scrAccepted.length,
        scrCancelled: scrCancelled.length,
        scrPartiallyReceived: scrPartiallyReceived.length,
        scrTotal: scrTotal.length,
      })
      .end();
  } catch (error) {
    return res.json({
      error: true,
      message: error.message,
    });
  }
};

const detailedAsn = async (req, res) => {
  try {
    const token = req.headers["authorization"];
    if (!token) {
      return res.json({
        error: true,
        message: "Token is required.",
      });
    }

    const { jwtConfig } = constants;
    const payload = jwt.decode(token.split(" ")[1], jwtConfig.secret);
    const id = payload.id;
    const role = payload.role;
    const email = payload.email;
    const checkSupplier = Array.isArray(payload.permissions)
      ? payload.permissions
      : [payload.permissions];
    const isSupplier = checkSupplier
      .map((permission) => permission.toLowerCase())
      .includes("supplier");

    let getSapCode;
    if (isSupplier) {
      getSapCode = await knex("supplier_details")
        .select("sap_code")
        .where("emailID", email)
        .first();
    }

    const statuses = [
      "materialshipped",
      "materialGateInward",
      "materialReceived",
      "qualityApproved",
      "invoiced",
      "partiallyPaid",
      "fullyPaid",
      "unpaid",
      "requested",
      "accepted",
      "cancelled",
      "partiallyReceived",
    ];

    const asnCounts = await Promise.all(
      statuses.map(async (status) => {
        let count = knex("asns")
          .where("type", "NB")
          .where("status", status)
          .first();
        if (isSupplier) {
          count = await count
            .where("supplierId", getSapCode.sap_code)
            .count("* as count");
        } else {
          count = await count.count("* as count");
        }
        return { status, count: count.count };
      })
    );

    const countsMap = new Map(
      asnCounts.map(({ status, count }) => [status, count])
    );

    const result = {
      error: false,
      message: "Data retrieved",
    };

    statuses.forEach((status) => {
      result[`asn${status.charAt(0).toUpperCase()}${status.slice(1)}`] =
        countsMap.get(status) || 0;
    });

    let total = knex("asns").where("type", "NB").first();
    if (isSupplier) {
      total = await total
        .where("supplierId", getSapCode.sap_code)
        .count("* as count");
    } else {
      total = await total.count("* as count");
    }
    result.asnTotal = total.count;

    return res.json(result);
  } catch (error) {
    return res.json({
      error: true,
      message: error.message,
    });
  }
};

const detailedScr = async (req, res) => {
  try {
    const token = req.headers["authorization"];
    if (!token) {
      return res.json({
        error: true,
        message: "Token is required.",
      });
    }

    const { jwtConfig } = constants;
    const payload = jwt.decode(token.split(" ")[1], jwtConfig.secret);
    const id = payload.id;
    const role = payload.role;
    const email = payload.email;
    const checkSupplier = Array.isArray(payload.permissions)
      ? payload.permissions
      : [payload.permissions];
    const isSupplier = checkSupplier
      .map((permission) => permission.toLowerCase())
      .includes("supplier");

    let getSapCode;
    if (isSupplier) {
      getSapCode = await knex("supplier_details")
        .select("sap_code")
        .where("emailID", email)
        .first();
    }
    const statuses = [
      "materialshipped",
      "materialGateInward",
      "materialReceived",
      "qualityApproved",
      "invoiced",
      "partiallyPaid",
      "fullyPaid",
      "unpaid",
      "requested",
      "accepted",
      "cancelled",
      "partiallyReceived",
    ];

    let scrCounts = knex("asns")
      .whereIn("status", statuses)
      .andWhere("type", "ZSER")
      .select("status")
      .count("* as count")
      .groupBy("status");

    if (isSupplier) {
      scrCounts = await scrCounts.where("supplierId", getSapCode.sap_code);
    } else {
      scrCounts = await scrCounts;
    }

    const countsMap = new Map(
      scrCounts.map(({ status, count }) => [status, count])
    );

    const result = {
      error: false,
      message: "Data retrieved",
    };

    statuses.forEach((status) => {
      result[`scr${status.charAt(0).toUpperCase()}${status.slice(1)}`] =
        countsMap.get(status) || 0;
    });

    result.scrTotal =
      countsMap.size > 0
        ? Array.from(countsMap.values()).reduce((acc, cur) => acc + cur)
        : 0;

    res.json(result);
  } catch (error) {
    return res.json({
      error: true,
      message: error.message,
    });
  }
};

const detailedAsnWithSupplier = async (req, res) => {};

const detailedAsnSupplierWise = async (req, res) => {
  try {
    const token = req.headers["authorization"];
    if (!token) {
      return res.json({
        error: true,
        message: "Token is required.",
      });
    }

    const { jwtConfig } = constants;
    const payload = jwt.decode(token.split(" ")[1], jwtConfig.secret);
    const id = payload.id;
    const role = payload.role;
    const email = payload.email;

    const getSapCode = await knex("supplier_details")
      .select("sap_code")
      .where("emailID", email)
      .first();

    if (getSapCode == undefined || getSapCode.sap_code == null) {
      return res.json({
        error: false,
        message: "Data retrived",
        asnMaterialShipped: 0,
        asnMaterialGateInward: 0,
        asnMaterialReceived: 0,
        asnQualityApproved: 0,
        asnInvoiced: 0,
        asnPartiallyPaid: 0,
        asnFullyPaid: 0,
        asnUnpaid: 0,
        asnRequested: 0,
        asnAccepted: 0,
        asnCancelled: 0,
        asnPartiallyReceived: 0,
        asnTotal: 0,
      });
    }

    const asnMaterialShipped = await knex("asns")
      .where("type", "NB")
      .where("status", "materialshipped")
      .where("supplierId", getSapCode.sap_code);

    const asnMaterialGateInward = await knex("asns")
      .where("type", "NB")
      .where("status", "materialGateInward")
      .where("supplierId", getSapCode.sap_code);

    const asnMaterialReceived = await knex("asns")
      .where("type", "NB")
      .where("status", "materialReceived")
      .where("supplierId", getSapCode.sap_code);

    const asnQualityApproved = await knex("asns")
      .where("type", "NB")
      .where("status", "qualityApproved")
      .where("supplierId", getSapCode.sap_code);

    const asnInvoiced = await knex("asns")
      .where("type", "NB")
      .where("status", "invoiced")
      .where("supplierId", getSapCode.sap_code);

    const asnPartiallyPaid = await knex("asns")
      .where("type", "NB")
      .where("status", "partiallyPaid")
      .where("supplierId", getSapCode.sap_code);

    const asnFullyPaid = await knex("asns")
      .where("type", "NB")
      .where("status", "fullyPaid")
      .where("supplierId", getSapCode.sap_code);

    const asnUnpaid = await knex("asns")
      .where("type", "NB")
      .where("status", "unpaid")
      .where("supplierId", getSapCode.sap_code);

    const asnRequested = await knex("asns")
      .where("type", "NB")
      .where("status", "requested")
      .where("supplierId", getSapCode.sap_code);

    const asnAccepted = await knex("asns")
      .where("type", "NB")
      .where("status", "accepted")
      .where("supplierId", getSapCode.sap_code);

    const asnCancelled = await knex("asns")
      .where("type", "NB")
      .where("status", "cancelled")
      .where("supplierId", getSapCode.sap_code);

    const asnPartiallyReceived = await knex("asns")
      .where("type", "NB")
      .where("status", "partiallyReceived")
      .where("supplierId", getSapCode.sap_code);

    const asnTotal = await knex("asns")
      .where("type", "NB")
      .where("supplierId", getSapCode.sap_code);

    return res
      .json({
        error: false,
        message: "Data retrived",
        asnMaterialShipped: asnMaterialShipped.length,
        asnMaterialGateInward: asnMaterialGateInward.length,
        asnMaterialReceived: asnMaterialReceived.length,
        asnQualityApproved: asnQualityApproved.length,
        asnInvoiced: asnInvoiced.length,
        asnPartiallyPaid: asnPartiallyPaid.length,
        asnFullyPaid: asnFullyPaid.length,
        asnUnpaid: asnUnpaid.length,
        asnRequested: asnRequested.length,
        asnAccepted: asnAccepted.length,
        asnCancelled: asnCancelled.length,
        asnPartiallyReceived: asnPartiallyReceived.length,
        asnTotal: asnTotal.length,
      })
      .end();
  } catch (error) {
    return res.json({
      error: true,
      message: error.message,
    });
  }
};

const detailedScrSupplierWise = async (req, res) => {
  try {
    const token = req.headers["authorization"];
    if (!token) {
      return res.json({
        error: true,
        message: "Token is required.",
      });
    }

    const { jwtConfig } = constants;
    const payload = jwt.decode(token.split(" ")[1], jwtConfig.secret);
    const id = payload.id;
    const role = payload.role;
    const email = payload.email;

    const getSapCode = await knex("supplier_details")
      .select("sap_code")
      .where("emailID", email)
      .first();

    if (getSapCode == undefined || getSapCode.sap_code == null) {
      return res.json({
        error: false,
        message: "Data retrived",
        scrMaterialShipped: 0,
        scrMaterialGateInward: 0,
        scrMaterialReceived: 0,
        scrQualityApproved: 0,
        scrInvoiced: 0,
        scrPartiallyPaid: 0,
        scrFullyPaid: 0,
        scrUnpaid: 0,
        scrRequested: 0,
        scrAccepted: 0,
        scrCancelled: 0,
        scrPartiallyReceived: 0,
        scrTotal: 0,
      });
    }
    const scrMaterialShipped = await knex("asns")
      .where("type", "ZSER")
      .where("status", "materialshipped")
      .where("supplierId", getSapCode.sap_code);

    const scrMaterialGateInward = await knex("asns")
      .where("type", "ZSER")
      .where("status", "materialGateInward")
      .where("supplierId", getSapCode.sap_code);

    const scrMaterialReceived = await knex("asns")
      .where("type", "ZSER")
      .where("status", "materialReceived")
      .where("supplierId", getSapCode.sap_code);

    const scrQualityApproved = await knex("asns")
      .where("type", "ZSER")
      .where("status", "qualityApproved")
      .where("supplierId", getSapCode.sap_code);

    const scrInvoiced = await knex("asns")
      .where("type", "ZSER")
      .where("status", "invoiced")
      .where("supplierId", getSapCode.sap_code);

    const scrPartiallyPaid = await knex("asns")
      .where("type", "ZSER")
      .where("status", "partiallyPaid")
      .where("supplierId", getSapCode.sap_code);

    const scrFullyPaid = await knex("asns")
      .where("type", "ZSER")
      .where("status", "fullyPaid")
      .where("supplierId", getSapCode.sap_code);

    const scrUnpaid = await knex("asns")
      .where("type", "ZSER")
      .where("status", "unpaid")
      .where("supplierId", getSapCode.sap_code);

    const scrRequested = await knex("asns")
      .where("type", "ZSER")
      .where("status", "requested")
      .where("supplierId", getSapCode.sap_code);

    const scrAccepted = await knex("asns")
      .where("type", "ZSER")
      .where("status", "accepted")
      .where("supplierId", getSapCode.sap_code);

    const scrCancelled = await knex("asns")
      .where("type", "ZSER")
      .where("status", "cancelled")
      .where("supplierId", getSapCode.sap_code);

    const scrPartiallyReceived = await knex("asns")
      .where("type", "ZSER")
      .where("status", "partiallyReceived")
      .where("supplierId", getSapCode.sap_code);

    const scrTotal = await knex("asns")
      .where("type", "ZSER")
      .where("supplierId", getSapCode.sap_code);

    return res.json({
      error: false,
      message: "Data retrived",
      scrMaterialShipped: scrMaterialShipped.length,
      scrMaterialGateInward: scrMaterialGateInward.length,
      scrMaterialReceived: scrMaterialReceived.length,
      scrQualityApproved: scrQualityApproved.length,
      scrInvoiced: scrInvoiced.length,
      scrPartiallyPaid: scrPartiallyPaid.length,
      scrFullyPaid: scrFullyPaid.length,
      scrUnpaid: scrUnpaid.length,
      scrRequested: scrRequested.length,
      scrAccepted: scrAccepted.length,
      scrCancelled: scrCancelled.length,
      scrPartiallyReceived: scrPartiallyReceived.length,
      scrTotal: scrTotal.length,
    });
  } catch (error) {
    return res.json({
      error: true,
      message: error.message,
    });
  }
};

const supplierProducts = async (req, res) => {
  const { error, value } = validation.supplierProducts(req.params);
  if (error) {
    return res.json({
      error: true,
      message: error.details[0].message,
    });
  }

  const { supplierId } = value;

  const getSapCode = await knex("supplier_details")
    .select("sap_code")
    .where("id", supplierId)
    .first();

  if (getSapCode == undefined) {
    return res.json({
      error: true,
      message: "Supplier not found",
    });
  }

  const recordsFound = await knex("asns").where(
    "supplierId",
    getSapCode.sap_code
  );

  const displayItems = {};
  const itemname = [];
  const itemprice = [];
  let i = 1;
  for (const iterator of recordsFound) {
    iterator.lineItems = JSON.parse(iterator.lineItems);
    displayItems[i++] = iterator.lineItems;
    for (const internal of iterator.lineItems) {
      if (internal.itemName == null) {
        internal.itemName = internal.serviceName;
      }
      if (!itemname.includes(internal.itemName)) {
        itemname.push(internal.itemName);
        itemprice.push(internal.pricePerUnit);
      }
    }
  }

  /* chatGPT
  const productNamesObj = {};

for (const record of recordsFound) {
  record.lineItems = JSON.parse(record.lineItems);
  for (const internal of record.lineItems) {
    const productName = internal.itemName;
    if (productName in productNamesObj) {
      // Increment the count if the product name already exists
      productNamesObj[productName]++;
    } else {
      // Initialize the count if the product name doesn't exist
      productNamesObj[productName] = 1;
    }
  }
}

*/

  return res
    .json({
      error: false,
      message: "data retrived successfully",
      // data0: recordsFound,
      data: {
        itemname,
        itemprice,
      },
    })
    .end();
};

//done by hp and modified by rahul
const deliveryPerformance = async (req, res) => {
  try {
    const token = req.headers["authorization"];
    if (!token) {
      return res.json({
        error: true,
        message: "Token is required.",
      });
    }
    const { jwtConfig } = constants;
    const payload = jwt.decode(token.split(" ")[1], jwtConfig.secret);
    const statusChanger = Array.isArray(payload.permissions)
      ? payload.permissions[0]
      : payload.permissions;
    const statusChangerId = payload.id;
    const email = payload.email;

    const errResponse = [
      {
        title: "materialShipped",
        count: 0,
        percentage: 0,
      },
      {
        title: "gateInward",
        count: 0,
        percentage: 0,
      },
      {
        title: "partiallyReceived",
        count: 0,
        percentage: 0,
      },
      {
        title: "materialReceived",
        count: 0,
        percentage: 0,
      },
    ];

    const getSapCode = await knex("supplier_details")
      .select("sap_code")
      .where("emailID", email)
      .whereNotNull("sap_code")
      .first();
    if (getSapCode == undefined) {
      return res.json({
        error: false,
        message: "Not registred in SAP",
        data: errResponse,
      });
    }

    const asnIds = await knex("asns").select("id").where("supplierId",getSapCode.sap_code);

    const ids = [];

    for (const id of asnIds) {
      ids.push(id.id);
    }

    const totalRecords = await knex("asnStatusTimeline")
      .count("* as totalCount")
      .whereIn("asn_id", ids)
      .first();
    const totalCount = totalRecords.totalCount;

    const getMaterialShipped = await knex("asnStatusTimeline")
      .whereIn("asn_id", ids)
      .whereNotNull("materialShippedStatus")
      .count("* as shippedCount")
      .first();
    const materialShippedCount = getMaterialShipped.shippedCount;
    const materialShippedPercentage = (
      (materialShippedCount / totalCount) *
      100
    ).toFixed(2);

    const getGateInward = await knex("asnStatusTimeline")
      .whereIn("asn_id", ids)
      .whereNotNull("MaterialGateInwardStatus")
      .count("* as gateInwardCount")
      .first();
    const gateInwardCount = getGateInward.gateInwardCount;
    const gateInwardPercentage = ((gateInwardCount / totalCount) * 100).toFixed(
      2
    );

    const getPartiallyReceived = await knex("asnStatusTimeline")
      .whereIn("asn_id", ids)
      .where("MaterialReceivedStatus", "partiallyReceived")
      .count("* as partiallyReceivedCount")
      .first();
    const partiallyReceivedCount = getPartiallyReceived.partiallyReceivedCount;
    const partiallyReceivedPercentage = (
      (partiallyReceivedCount / totalCount) *
      100
    ).toFixed(2);

    const getMaterialReceived = await knex("asnStatusTimeline")
      .whereIn("asn_id", ids)
      .where("MaterialReceivedStatus", "materialReceived")
      .count("* as materialReceivedCount")
      .first();
    const materialReceivedCount = getMaterialReceived.materialReceivedCount;
    const materialReceivedPercentage = (
      (materialReceivedCount / totalCount) *
      100
    ).toFixed(2);

    const response = [
      {
        title: "materialShipped",
        count: materialShippedCount,
        percentage: parseFloat(materialShippedPercentage),
      },
      {
        title: "gateInward",
        count: gateInwardCount,
        percentage: parseFloat(gateInwardPercentage),
      },
      {
        title: "partiallyReceived",
        count: partiallyReceivedCount,
        percentage: parseFloat(partiallyReceivedPercentage),
      },
      {
        title: "materialReceived",
        count: materialReceivedCount,
        percentage: parseFloat(materialReceivedPercentage),
      },
    ];

    return res.json({
      error: false,
      totalCount: totalCount,
      data: response,
    });
  } catch (error) {
    return res.json({
      error: true,
      message: "Something went wrong",
    });
  }
};

export default {
  percentage,
  supplier_analytics,
  count,
  count_time_bound,
  total_asn_scr,
  detailedAsn,
  detailedAsnSupplierWise,
  detailedScr,
  detailedScrSupplierWise,
  detailedAsnWithSupplier,
  supplierProducts,
  deliveryPerformance,
};
