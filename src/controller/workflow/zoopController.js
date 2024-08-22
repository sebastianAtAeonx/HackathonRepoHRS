import zoop from "../../services/zoop.js";
import knex from "../../config/mysql_db.js";
import logApiCalls from "../../helpers/functions.js";
import functions from "../../helpers/functions.js";
import validation from "../../validation/workflow/zoopController.js";

import fun from "../../helpers/functions.js";
const verifyGst = async (req, res) => {
  try {
    const { error, value } = validation.verifyGst(req.body);
    if (error) {
      return res.status(400).json({
        error: true,
        message: error.details[0].message,
        data: error,
      });
    }
    // Log the API call

    const { gst_no, refresh } = value;

    const gstData = await knex("gst_details").where({ gst: value.gst_no });
    if (!refresh) {
      if (gstData.length != 0) {
        const data = JSON.parse(gstData[0].json);
        return res.status(200).json({
          error: false,
          message: "Data from zoop Received Successfully.",
          data,
        });
      }
    }
    const data = await zoop.getGstDetails(gst_no);
    if (!data.success) {
      return res.status(500).json({
        error: true,
        message: data.response_message,
        data: {
          zoop_response: data,
        },
      });
    }
    const obj = {
      gst: gst_no,
      json: JSON.stringify(data),
    };
    if (gstData.length === 0) {
      await knex("gst_details").insert(obj);
    } else {
      const getId = await knex("gst_details")
        .select("id")
        .where({ gst: obj.gst })
        .first();

      const updationDataIs = await functions.takeSnapShot(
        "gst_details",
        getId.id
      );

      await knex("gst_details").update(obj).where({
        gst: obj.gst,
      });

      if (obj) {
        const modifiedByTable1 = await functions.SetModifiedBy(
          req.headers["authorization"],
          "gst_details",
          "gst",
          obj.gst
        );
        console.log("isUpdated:-", modifiedByTable1);
      }
    }
    return res.status(200).json({
      error: false,
      message: "Data from zoop Received Successfully.",
      data,
    });
  } catch (error) {
    fun.sendErrorLog(req, error);
    return res.status(500).json({
      error: true,
      message: "Could not verify",
      data: { error: JSON.stringify(error) },
    });
  }
};

const verifyBankAccount = async (req, res) => {
  try {
    const { error, value } = validation.verifyBankAccount(req.body);
    if (error) {
      return res.status(400).json({
        error: true,
        message: error.details[0].message,
        data: error,
      });
    }
    // Log the API call
    await logApiCalls.logAPICalls(
      "zoopController-verifyBankAccount",
      req.originalUrl,
      "Zoop"
    );

    const { account_number, ifsc_code } = value;

    const data = await zoop.getBankAccountDetails(account_number, ifsc_code);
    console.log("this is data", data);
    if (data.error == true) {
      return res.status(500).json({
        error: true,
        message: data.message,
        data: data.metadata,
        code: data.code,
      });
    }

    return res.status(200).json({
      error: false,
      message: "Data from zoop Received Successfully.",
      zoop_message: data.message,
      data: data.data,
      metadata: data.metadata,
      code: data.code,
    });
  } catch (error) {
    fun.sendErrorLog(req, error);
    return res.status(500).json({
      error: true,
      message: "Could not verify",
      data: { error: JSON.stringify(error) },
    });
  }
};

export default {
  verifyGst,
  verifyBankAccount,
};
