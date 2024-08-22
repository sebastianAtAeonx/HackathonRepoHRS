import knex from "../../config/mysql_db.js";
import fun from "../../helpers/functions.js";
import validation from "../../validation/supplier/addCoDetails.js";

//do not delete this
// const listaddCoDetails = async (req, res) => {
//   try {
//     const { company_names } = req.body;
//     let ReconAccDetails = [];

//     if (company_names == "all") {
//       const getAll = await knex("reconciliation_ac");
//       ReconAccDetails = getAll;
//     } else {
//       for (const company_name of company_names) {
//         const splitCompanyName = company_name.split("-");
//         const nameAfterHyphen = splitCompanyName[splitCompanyName.length - 1];

//         const ReconAcc = await knex("reconciliation_ac")
//           .where({ co_names: nameAfterHyphen })
//           .select();

//         if (ReconAcc.length > 0) {
//           ReconAccDetails.push(ReconAcc[0]);
//         }
//       }
//     }

//     //company_name
//     const getCompanies = await knex("companies");
//     //reconcillation_account

//     //vendor_class
//     const getVendorClass = await knex("vendor_class");

//     //vendor_schema
//     const getVendorSchema = await knex("vendor_schema");

//     //business_partner_group
//     const getBusinessPartnerGroup = await knex("business_partner_groups");

//     //get reconciliation_ac

//     for (const iterator of getCompanies) {
//       iterator.hi = "hi";
//       iterator.reconsiliationAccount = await knex("reconciliation_ac").where({
//         co_names: iterator.name,
//       });
//     }

//     return res
//       .json({
//         error: false,
//         message: "List retrived successfully",
//         data: {
//           getCompanies,
//           getVendorClass,
//           getVendorSchema,
//           getBusinessPartnerGroup,
//           ReconAccDetails,
//         },
//       })
//
//   } catch (error) {
//     return res
//       .json({
//         error: true,
//         message: "Something went wrong",
//         data: JSON.stringify(error),
//       })
//
//   }
// };

const listaddCoDetails = async (req, res) => {
  try {
    const { company_names } = req.body;
    let ReconAccDetails = [];

    if (company_names == "all") {
      const getAll = await knex("reconciliation_ac").where('isDeleted','0');
      ReconAccDetails = getAll;
    } else {
      const getAll = await knex("reconciliation_ac").where('isDeleted','0');
      ReconAccDetails = getAll;
      // for (const company_name of company_names) {
      //   const splitCompanyName = company_name.split("-");
      //   const nameAfterHyphen = splitCompanyName[splitCompanyName.length - 1];

      //   const ReconAcc = await knex("reconciliation_ac")
      //     .where({ co_names: nameAfterHyphen })
      //     .select();

      //   if (ReconAcc.length > 0) {

      //     ReconAccDetails.push(...ReconAcc);
      //   }
      // }
    }

    //company_name
    const getCompanies = await knex("companies").where('isDeleted','0');

    //vendor_class
    const getVendorClass = await knex("vendor_class").where('isDeleted','0');

    //vendor_schema
    const getVendorSchema = await knex("vendor_schemas").where('isDeleted','0');

    //business_partner_group
    const getBusinessPartnerGroup = await knex("business_partner_groups").where('isDeleted','0');

    //purchase_group
    const getPurchaseGroup = await knex("purchase_groups").where('isDeleted','0');

    //payment_terms
    const getPaymentTerms = await knex("payment_terms").where('isDeleted','0');

    for (const iterator of getCompanies) {
      iterator.reconsiliationAccount = await knex("reconciliation_ac")
        .where({
          co_names: iterator.name,
          // 'isDeleted':'0'
        })
        // .andWhere("isDeleted", '0');
    }

    return res.status(200).json({
      error: false,
      message: "List retrieved successfully",
      data: {
        getCompanies,
        getVendorClass,
        getVendorSchema,
        getBusinessPartnerGroup,
        ReconAccDetails,
        getPurchaseGroup,
        getPaymentTerms,
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

const createaddCoDetails = async (req, res) => {
  try {
    const { error, value } = validation.create(req.body);
    if (error) {
      return res.status(400).json({
        error: true,
        message: error.details[0].message,
      });
    }

    const {
      companies,
      reconciliationAc,
      vendor_class,
      vendor_schema,
      business_partner_group,
      supplier_id,
      payment_terms,
      purchase_group,
      itWitholding,
    } = value;

    const companies_are = JSON.stringify(companies);

    const itWitholding_are = JSON.stringify(itWitholding);

    const checkSupplierId = await knex("additional_company_details").where({
      supplier_id: supplier_id,
    });
    if (checkSupplierId.length > 0) {
      return res.status(409).json({
        error: true,
        message: "Company detailse already inserted for this Supplier",
      });
    }

    const checkPaymentTerms = await knex("payment_terms").where(
      "id",
      payment_terms
    );

    if (checkPaymentTerms.length <= 0) {
      return res.status(404).json({
        error: true,
        message: "Payment terms not found",
      });
    }

    const insertRecord = await knex("additional_company_details").insert({
      companies: companies_are,
      reconciliation_ac: reconciliationAc,
      vendor_class,
      vendor_schema,
      business_partner_groups: business_partner_group,
      supplier_id: supplier_id,
      payment_terms,
      purchase_group,
      itWitholding: itWitholding_are,
    });

    return res.status(200).json({
      error: false,
      message: "Company details added successfully",
      data: insertRecord,
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: "Could not create record.",
      data: JSON.stringify(error),
    });
  }
};

const paginateCoDetails = async (req, res) => {
  try {
    const tableName = "reconciliation_ac";
    const searchFrom = ["id"];

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
      message: "Could not load record.",
      data: JSON.stringify(error),
    });
  }
};

// const viewaddCoDetails = async (req, res) => {
//   try {
//     const schema = Joi.object({
//       supplier_id: Joi.string().required(),
//     });

//     const { error, value } = schema.validate(req.params);
//     if (error) {
//       return res.status(400).json({
//         error: true,
//         message: error.details[0].message,
//       });
//     }

//     const { supplier_id } = value;
//     const selectResult = await knex("additional_company_details")
//       .where({ supplier_id: supplier_id })
//       .first();

//     console.log("selectResult:", selectResult);

//     const companies_array = JSON.parse(selectResult.companies);
//     selectResult.companyname = [];
//     for (const iterator of companies_array) {
//       const companyName = await knex("companies")
//         .where("id", iterator)
//         .select("name")
//         .first();
//       if (companyName) {
//         selectResult.companyname.push(companyName.name);
//       }
//     }

//     const reconciliationAcName = await knex("reconciliation_ac")
//       .where({ id: selectResult.reconciliation_ac })
//       .select("name")
//       .first();

//     if (reconciliationAcName) {
//       selectResult.reconciliation_ac_name = reconciliationAcName.name;
//     }

//     const vendorClassName = await knex("vendor_class")
//       .where({ id: selectResult.vendor_class })
//       .select("name")
//       .first();

//     if (vendorClassName) {
//       selectResult.vendor_class_name = vendorClassName.name;
//     }

//     const vendorSchemaName = await knex("vendor_schemas")
//       .where({ id: selectResult.vendor_schema })
//       .select("name", "code")
//       .first();

//     if (vendorSchemaName) {
//       selectResult.vendor_schema_name =
//         vendorSchemaName.code + " - " + vendorSchemaName.name;
//     }

//     const businessPartnerGroupName = await knex("business_partner_groups")
//       .where({ id: selectResult.business_partner_groups })
//       .select("name", "code")
//       .first();
//     if (businessPartnerGroupName) {
//       selectResult.business_partner_groups_name =
//         businessPartnerGroupName.code + " - " + businessPartnerGroupName.name;
//     }

//     const getPaymentTermsName = await knex("payment_terms").where(
//       "id",
//       selectResult.payment_terms
//     );
//     if (getPaymentTermsName.length > 0) {
//       selectResult.payment_terms_name =
//         getPaymentTermsName[0].code + " - " + getPaymentTermsName[0].name;
//     }

//     if (selectResult.itWitholding != "" || selectResult.itWitholding != null) {
//       selectResult.itWitholding = JSON.parse(selectResult.itWitholding);
//     }

//     if (
//       selectResult.purchase_group != "" ||
//       selectResult.purchase_group != null
//     ) {
//       const getPurchaseGroup = await knex("purchase_groups").where(
//         "id",
//         selectResult.purchase_group
//       );
//       selectResult.purchase_group_name =
//         getPurchaseGroup[0].code + " - " + getPurchaseGroup[0].name;
//     }

//     return res.status(200).json({
//       error: false,
//       message: "Record retrived successfully",
//       data: selectResult,
//     });
//   } catch (error) {
//     return res.status(500).json({
//       error: true,
//       message: "Could not fetch record.",
//       data: JSON.stringify(error),
//     });
//   }
// };

const viewaddCoDetails = async (req, res) => {
  try {
    const { error, value } = validation.view(req.params);
    if (error) {
      return res.status(400).json({
        error: true,
        message: error.details[0].message,
      });
    }

    const { supplier_id } = value;
    const selectResult = await knex("additional_company_details")
      .where({ supplier_id: supplier_id })
      .first();

    if (!selectResult) {
      return res.status(404).json({
        error: true,
        message: "Record not found.",
      });
    }

    let companies_array = [];
    if (selectResult.companies) {
      try {
        companies_array = JSON.parse(selectResult.companies);
      } catch {
        return res.status(500).json({
          error: true,
          message: "Failed to parse companies array.",
        });
      }
    }

    // Populate company details
    selectResult.company_details = [];
    for (const companyId of companies_array) {
      const company = await knex("companies")
        .where("id", companyId)
        .select("name", "code")
        .first();
      if (company) {
        selectResult.company_details.push({
          value: company.code,
          label: company.name,
        });
      }
    }

    const fetchAndFormat = async (table, key) => {
      const result = await knex(table)
        .where({ id: selectResult[key] })
        .select("name", "code")
        .first();
      if (result) {
        selectResult[`${key}_details`] = {
          label: result.name,
          value: result.code,
        };
      } else {
        selectResult[`${key}_details`] = {
          label: "",
          value: selectResult[key],
        };
      }
    };

    await fetchAndFormat("reconciliation_ac", "reconciliation_ac");
    await fetchAndFormat("vendor_class", "vendor_class");
    await fetchAndFormat("vendor_schemas", "vendor_schema");
    await fetchAndFormat("business_partner_groups", "business_partner_groups");
    await fetchAndFormat("payment_terms", "payment_terms");
    await fetchAndFormat("purchase_groups", "purchase_group");

    if (selectResult.itWitholding) {
      try {
        selectResult.itWitholding = JSON.parse(selectResult.itWitholding);
      } catch {
        return res.status(500).json({
          error: true,
          message: "Failed to parse IT withholding data.",
        });
      }
    }

    return res.status(200).json({
      error: false,
      message: "Record retrieved successfully",
      data: selectResult,
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: "Could not fetch record.",
      data: JSON.stringify(error),
    });
  }
};

const deleteAddCoDetails = async (req, res) => {
  try {
    const tableName = "additional_company_details";
    const { ids } = req.body;

    const result = await fun.bulkDeleteRecords(tableName, ids, req);

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

const delteMultipleRecords = async (req, res) => {
  try {
    const tableName = "additional_company_details";
    const { ids } = req.body;

    const result = await fun.bulkDeleteRecords(tableName, ids, req);
    console.log("this is result", result);

    if (result.error) {
      return res.status(500).json({
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
  createaddCoDetails,
  listaddCoDetails,
  paginateCoDetails,
  viewaddCoDetails,
  deleteAddCoDetails,
  delteMultipleRecords,
};
