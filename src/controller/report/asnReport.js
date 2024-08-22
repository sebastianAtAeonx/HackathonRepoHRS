import knex from "../../config/mysql_db.js";
import validation from "../../validation/report/asnReport.js";

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

const asnReport = async(req,res)=>{
      const { value, error } = validation.asnReport(req.body);
      
      if (error) {
        return res.status(400).json({
          error: true,
          message: error.details[0].message,
          data: null,
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
        dropdown,
        type,
        invoiceType
      } = value;
  
      let startDateValue, endDateValue;

    if (startDate != undefined && endDate != undefined) {
      startDateValue = startDate;
      endDateValue = endDate;
    //   console.log("hear -startdate enddate");
    } else if (month != undefined && year != undefined) {
      const { startDate, endDate } = getStartAndEndDateOfMonth(year, month);
      startDateValue = startDate;
      endDateValue = endDate;
    //   console.log("here month");
    } else if (year != undefined) {
      const { startDate, endDate } = getStartAndEndDateOfYear(year);
      startDateValue = startDate;
      endDateValue = endDate;
    //   console.log("hear year", year, startDate, endDate);
    }

    const searchFrom = ["poNo", "status", "asnNo", "type"];
    let supplierDetails
    if (dropdown === "supplier") {
       supplierDetails = await knex("supplier_details")
        .select("sap_code")
        .where("emailID", email)
        .first();
    
      if (!supplierDetails) {
        return res.json({
          error: true,
          message: "Supplier does not exist.",
        });
      }
    }

    let query = knex("asns");

    if (startDateValue && endDateValue) {
        query = query
          .where("asns.createdAt", ">=", startDateValue)
          .where("asns.createdAt", "<=", endDateValue);
      }
  
      if (status != "all") {
        query = query.where("status", status);
      }

      if(invoiceType){
        query = query.where("invoiceType", invoiceType)
      }

      if (dropdown === "supplier") {
        query.where("supplierId", supplierDetails.sap_code);
      } else {
        query.whereNot("status", "cancelled");
      }
      
      if (status !== "all") {
        query.where("status", status);
      }
      
      //Make this dynamic
      const typeMapping = {
        ASN: "NB",
        SCR: "ZSER",
      };
      const mappedType = typeMapping[type];
      
      if (mappedType) {
        query.where("type", mappedType);
      } else if (type !== "") {
        return res.status(400).json({
          error: true,
          message: "Invalid type value. Allowed values are 'ASN' and 'SCR'.",
          data: null,
        });
      }
      
      if (search && search !== "") {
        query.where((builder) => {
          searchFrom.forEach((element) => {
            builder.orWhere(element, "LIKE", `%${search}%`);
          });
        });
      }

      const totalCountResult = await query.clone().count("id as total").first();
const total = totalCountResult.total;

let rows = await query.orderBy(sort, order).limit(limit).offset(offset);
let sr = offset + 1;

for (const row of rows) {
 row.sr = sr++;
 row.lineItems = JSON.parse(row.lineItems);   
}

return res
.json({
  error: false,
  message: "ASN retrived successfully",
  data: rows,
  startDate: startDateValue ? startDateValue.toDateString() : null,
  endDate: endDateValue ? endDateValue.toDateString() : null,
  total: total,
  status: status,
})

}

export default {
    asnReport
}