import knex from "../../config/mysql_db.js";
import validation from "../../validation/forSap/sapErrors.js";
import functions from "../../helpers/functions.js";

const insertSapError = async (req, res) => {
  try {
  const { error, value } = validation.insertSapError.validate(req.body);
  if (error) {
    return res.json({
      error: true,
      message: error.details[0].message,
    });
  }
  const { uniqueId, errors, error_type } = value;
  const err = [];
  for (const element of errors) {
    const keys = Object.keys(element);
    const key = keys[0];
    err.push(element[key]);
  }
  const time = await functions.getTime();
  const insertData = await knex("sap_errors").insert({
    uniqueId: uniqueId,
    errors: JSON.stringify(err),
    error_type: error_type,
    error_time: time,
  });

  if (!insertData) {
    return res.json({
      error: true,
      message: "Failed to send errors",
    });
  }

  let updateInvoice;
  if (error_type === "invoice") {
    updateInvoice = await knex("invoicesToSap")
      .where("invoiceUniqueId", uniqueId)
      .update({
        sapError: insertData,
      });
    const getInvoiceId = await knex("invoicesToSap")
      .where("invoiceUniqueId", uniqueId)
      .select("id");
    const checkInTextract = await knex("invoices_textract").where(
      "sapInvoiceId",
      getInvoiceId[0].id
    );
    if (checkInTextract.length > 0) {
      const updateStatus = await knex("invoices_textract")
        .where("sapInvoiceId", getInvoiceId[0].id)
        .update("status", "saperror");
    }

    // }else{
    //    updateInvoice = await knex(error_type).where('unique_id', uniqueId).update({
    //     sap_error:insertData
    //   })
  }

  if (!updateInvoice) {
    return res.json({
      error: true,
      message: "Failed to send errors",
    });
  }

  return res.json({
    error: false,
    message: "Errors sent successfully",
  });

  } catch (error) {
    return res.json({
      error :true,
      message:"Failed to send error",
      data:JSON.stringify(error)
    })
  }
};

const viewSapError = async (req, res) => {
  try {
    const { error, value } = validation.viewSapError.validate(req.body);
    if (error) {
      return res.json({
        error: true,
        message: error.details[0].message,
      });
    }
    const { uniqueId } = value;
    const viewData = await knex("sap_errors").where("uniqueId", uniqueId);
    if (!viewData) {
      return res.json({
        error: true,
        message: "Failed to view error",
      });
    }

    for (const element of viewData) {
      element.errors = JSON.parse(element.errors);
    }
    return res.json({
      error: false,
      message: "Error viewed successfully",
      data: viewData,
    });
  } catch (error) {
    return res.json({
      error: true,
      message: "Failed to view error",
      data: JSON.stringify(error),
    });
  }
};

export default {
  insertSapError,
  viewSapError,
};
