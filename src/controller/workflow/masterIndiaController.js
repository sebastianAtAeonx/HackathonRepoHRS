import masterindia from "../../services/masterIndia-service.js";

import knex from "../../config/mysql_db.js";
import fun from "../../helpers/functions.js";
import functions from "../../helpers/functions.js";
import moment from "moment-timezone";
import constant from "../../helpers/constants.js";
import jwt from "jsonwebtoken";
import logApiCalls from "../../helpers/functions.js";
import ses from "../../helpers/ses.js";
import emailTemplate from "../../emails/verifyEmail.js";
import scheduleRun from "../../schedule/schedule.js";
import surepass from "../../services/surepass.js";
import service from "../../services/sandbox.js";
import Export from "../../controller/export.js";
import path from "path";
import validation from "../../validation/workflow/masterIndiaController.js";

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
    await logApiCalls.logAPICalls(
      "masterIndiaController-verifyGst",
      req.originalUrl,
      "MasterIndia"
    );

    const { gst, refresh } = value;

    //check weather gst number is exist in sap data or not

    const pan = gst.substr(2, 10);

    const checkGSTPanInSap = await fun.checkInSapDuplicateVendor(gst, pan);
    console.log("=======================================");
    console.log("checkGSTPanInSap:=", checkGSTPanInSap);

    if (checkGSTPanInSap == "Internal Server Error") {
      return res.status(500).json({
        error: true,
        message: "SAP Server Error",
      });
    }

    if (
      checkGSTPanInSap.status == "S" &&
      checkGSTPanInSap.message == "Supplier Found"
    ) {
      return res.status(409).json({
        error: true,
        message: "Supplier Found in SAP",
        data: checkGSTPanInSap,
      });
    }

    //check weather gst number is exist in sap data or not over

    const gstData = await knex("gst_details").where({
      gst: value.gst,
    });

    if (!refresh) {
      if (gstData.length != 0) {
        const data = await knex("gst_addresses")
          .join("states", "states.id", "gst_addresses.state_id")
          .select(
            "gst_addresses.street_building_no as street_no",
            "gst_addresses.building_name as address1",
            "gst_addresses.street_name as address2",
            "gst_addresses.location as address3",
            "gst_addresses.location as city",
            "gst_addresses.pincode",
            "states.stateDesc as state"
          )
          .where("gst_addresses.gst_id", gstData[0].id);

        //getting state code from states table...
        for (const iterator of data) {
          const getStateCode = await knex("states")
            .where("stateDesc", iterator.state)
            .where("countryDesc", "India");
          iterator.state_code = getStateCode[0].stateKey;
        }

        return res.status(200).json({
          error: false,
          message: "Data is found from our Database for GST",
          data: {
            gstno: gst,
            trade_name: gstData[0].trade_name,
            business_type: gstData[0].business_type,
            addresses: data,
          },
        });
      }
    }

    const data = await masterindia.getGstDetails(gst);

    if (data.error) {
      //to display remove !
      return res.status(400).json({
        error: true,
        message: data.message,
        data: {
          master_response: data,
        },
      });
    }

    ///////fetching values from data/////////////

    //check weather gst number is active or not
    if (data.data.sts.toLowerCase() == "cancelled") {
      return res.status(400).json({
        error: true,
        message: "Sorry Your GST Number is cancelled!",
        data: {
          master_response: data,
        },
      });
    }

    if (!data.error) {
      const p_add = data.data.pradr.addr;
      const trade_name = data.data.tradeNam;
      const business_type = data.data.ctb;

      /// now take these data to database....

      if (!refresh) {
        const addgst = await knex("gst_details").insert({
          gst,
          trade_name,
          business_type,
        });
      } else {
        const obj = {
          trade_name: trade_name,
          business_type: business_type,
        };

        const updategst = await knex("gst_details")
          .update(obj)
          .where({ gst: gst });

        const getid1 = await knex("gst_details")
          .select("id")
          .where({ gst: gst });

        if (getid1.length == 0) {
          const addgst = await knex("gst_details").insert({
            gst,
            trade_name,
            business_type,
          });
        }

        const getid = await knex("gst_details")
          .select("id")
          .where({ gst: gst });

        console.log(getid[0].id);

        const deleterecords = await knex("gst_addresses")
          .delete()
          .where({ gst_id: getid[0].id });
      }

      //find gst_id from gst_details table...

      const findgst = await knex("gst_details").where("gst", gst).select("id");

      //find state_id from state table...

      console.log("stateDesc:=", p_add.stcd);

      const findstate = await knex("states")
        .where("stateDesc", p_add.stcd)
        .select("id");

      if (!findstate) {
        console.log("State ID Not found");
      }

      //inserting p_add data to gst address table

      console.log("statekey:=", findstate[0]);

      const iresult = await knex("gst_addresses").insert({
        gst_id: findgst[0].id,
        is_primary: "1",
        building_name: p_add.bnm,
        location: p_add.loc,
        street_name: p_add.st,
        street_building_no: p_add.bno,
        floor_no: p_add.flno,
        state_id: findstate[0]?.id,
        lattitude: p_add.lt,
        longitude: p_add.lg,
        pincode: p_add.pncd,
        status: "1",
        district: p_add.dst,
      });

      //other addresses found from api store in database

      const addresses_found = data.data.adadr;

      addresses_found.forEach(async function (element, key) {
        //insert values in table
        const iresult_adds = await knex("gst_addresses").insert({
          gst_id: findgst[0].id,
          is_primary: "0",
          building_name: element.addr.bnm,
          location: element.addr.loc,
          street_name: element.addr.st,
          street_building_no: element.addr.bno,
          floor_no: element.addr.flno,
          state_id: findstate[0].id,
          lattitude: element.addr.lt,
          longitude: element.addr.lg,
          pincode: element.addr.pncd,
          status: "1",
          district: element.addr.dst,
          city: element.addr.city,
        });
      });

      const gstDatax = await knex("gst_details").where({
        gst: value.gst,
      });

      if (iresult) {
        const data = await knex("gst_addresses")
          .join("states", "states.id", "gst_addresses.state_id")
          .select(
            "gst_addresses.street_building_no as street_no",
            "gst_addresses.building_name as address1",
            "gst_addresses.street_name as address2",
            "gst_addresses.location as address3",
            "gst_addresses.location as city",
            "gst_addresses.pincode",
            "states.stateDesc as state"
          )
          .where("gst_addresses.gst_id", gstDatax[0].id);

        //getting state code from states table...
        for (const iterator of data) {
          const getStateCode = await knex("states")
            .where("stateDesc", iterator.state)
            .where("countryDesc", "India");
          iterator.state_code = getStateCode[0].stateKey;
        }

        return res.status(200).json({
          error: false,
          message: "Data is found from Master India",
          data: {
            gstno: gst,
            trade_name: gstDatax[0].trade_name,
            business_type: gstDatax[0].business_type,
            addresses: data,
          },
        });
      }
    }
    //////////////////////////////////////

    const obj = {
      gst: gst,
    };

    if (!data.error) {
      await knex("gst_details").insert(obj);
    } else {
      const getId = await knex("gst_details").where({ gst: obj.gst }).first();

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

    if (data.error) {
      return res.status(500).json({
        error: true,
        message: data.message,
      });
    } else {
      return res.status(200).json({
        error: false,
        message: "Data from masterindia Received Successfully of GST",
        data,
      });
    }
  } catch (error) {
    fun.sendErrorLog(req, error);
    return res.status(500).json({
      error: true,
      message: "Could not fetch record",
      data: { error: JSON.stringify(error) },
    });
  }
};

const verifyPan = async (req, res) => {
  try {

    const { error, value } = validation.verifyPan(req.body);
    if (error) {
      return res.status(400).json({
        error: true,
        message: error.details[0].message,
        data: error,
      });
    }
    // Log the API call
    await logApiCalls.logAPICalls(
      "masterIndiaController-verifyPan",
      req.originalUrl,
      "MasterIndia"
    );

    const { pan, refresh } = value;

    //////////////////////////////////check pan in sap
    const gst = "";
    const checkPanInSap = await fun.checkInSapDuplicateVendor(gst, pan);
    console.log("=======================================");
    console.log("checkPanInSap:=", checkPanInSap);

    if (checkPanInSap == "Internal Server Error") {
      return res.status(500).json({
        error: true,
        message: "SAP Server Error",
      });
    }

    if (
      checkPanInSap.status == "S" &&
      checkPanInSap.message == "Supplier Found"
    ) {
      return res.status(409).json({
        error: true,
        message: "Supplier Found in SAP",
        data: checkPanInSap,
      });
    }
    ///////////////////////////////////////check pan in sap over

    const panData = await knex("pan_details").where({
      pan: value.pan,
    });

    const pan_length = panData.length;

    if (!refresh) {
      if (panData.length != 0) {
        const data = panData;

        const gotPanData = {
          panno: pan,
          name: panData[0].name,
          pan_type: panData[0].type_of_holder,
          addresses: [],
        };

        return res.status(200).json({
          error: false,
          message: "PAN Number is found from our Database",
          data: gotPanData,
        });
      }
    }

    const data = await masterindia.getPanDetails(pan);
    if (!data) {
      return res.status(404).json({
        error: true,
        message: data.response_message,
        data: {
          master_response: data,
        },
      });
    }

    if (data.data.response.code != 200) {
      return res.status(404).json({
        error: true,
        message: "Pan details not found",
        data,
      });
    }

    if (data.data.response.panStatus.toLowerCase() != "valid") {
      return res.status(400).json({
        error: true,
        message: "Pan is not Valid",
        data,
      });
    }

    console.log(data.data.response.name);

    const obj = {
      pan: pan,
      name: data.data.response.name,
      type_of_holder: data.data.response.typeOfHolder,
    };

    if (pan_length == 0) {
      await knex("pan_details").insert(obj);
    } else {
      const getId = await knex("pan_details").where({ pan: obj.pan }).first();

      const updationDataIs = await functions.takeSnapShot(
        "pan_details",
        getId.id
      );

      await knex("pan_details").update(obj).where({
        pan: obj.pan,
      });
      if (obj) {
        const modifiedByTable1 = await functions.SetModifiedBy(
          req.headers["authorization"],
          "pan_details",
          "pan",
          obj.pan
        );
        console.log("isUpdated:-", modifiedByTable1);
      }
    }

    const panDataIS = await knex("pan_details").where({
      pan: value.pan,
    });

    const resultPanData = {
      panno: pan,
      name: panDataIS[0].name,
      pan_type: panDataIS[0].type_of_holder,
      addresses: [],
    };

    return res.status(200).json({
      error: false,
      message: "Data retrvied successfully for Pan No from masterIndia",
      data: resultPanData, //change to data - to see exact data arriving
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: "Could not fetch record.",
      data: { error: JSON.stringify(error) },
    });
  }
};

async function validatePan() {
  const panData = await knex("validateGST_PAN").select(
    "supplierId",
    "supplierName",
    "pan"
  );

  for (const iterator of panData) {
    const result = await masterindia.getPanDetails(iterator.pan);
    console.log(result.data.response.panStatus);

    if (result.data.response.panStatus != undefined) {
      if (result.data.response.panStatus.toLowerCase() != "valid") {
        const updateRecord = await knex("validateGST_PAN")
          .where({ supplierId: iterator.supplierId })
          .update("panStatus", "Invalid");

        if (iterator.supplierId) {
          const modifiedByTable1 = await functions.SetModifiedBy(
            req.headers["authorization"],
            "validateGST_PAN",
            "supplierId",
            iterator.supplierId
          );
          console.log("isUpdated:-", modifiedByTable1);
        }
      }
    } else {
      const updateRecord = await knex("validateGST_PAN")
        .where({ supplierId: iterator.supplierId })
        .update("panStatus", "Pan No. not found");
      if (iterator.supplierId) {
        const modifiedByTable1 = await functions.SetModifiedBy(
          req.headers["authorization"],
          "validateGST_PAN",
          "supplierId",
          iterator.supplierId
        );
        console.log("isUpdated:-", modifiedByTable1);
      }
    }

    const updateRecord = await knex("validateGST_PAN")
      .where({ supplierId: iterator.supplierId })
      .update("panStatus", result.data.response.panStatus);

    if (iterator.supplierId) {
      const modifiedByTable1 = await functions.SetModifiedBy(
        req.headers["authorization"],
        "validateGST_PAN",
        "supplierId",
        iterator.supplierId
      );
      console.log("isUpdated:-", modifiedByTable1);
    }
  }

  console.log("All Pan verified successfully");
  return "done";
}

let intervalId;

const callPeriodicallyVerifyPan = async (req, res) => {
  // Call the function immediately
  validatePan();

  // Call the function every 2 seconds (2000 milliseconds)
  // for 10 days give: 10 * 24 * 60 * 60 * 1000;
  intervalId = setInterval(validatePan, 1 * 24 * 60 * 60 * 1000);

  return res.status(200)
    .json({ error: false, message: "Periodic verification of Pan started." })
    .end();
};
const stopPeriodicallyVerifyPan = async (req, res) => {
  clearInterval(intervalId); // Clear the interval using the interval ID
  console.log("Periodic verification of Pan stopped.");
  return res.status(200)
    .json({ error: false, message: "Periodic verification of Pan stopped." })
    .end();
};

const gstComplianceCheck = async (req, res) => {
  try {
    const { error, value } = validation.gstComplianceCheck(req.body);
    if (error) {
      return res.status(400).json({
        error: true,
        message: error.details[0].message,
        data: error,
      });
    }
    // Log the API call
    await logApiCalls.logAPICalls(
      "masterIndiaController-gstComplianceCheck",
      req.originalUrl,
      "MasterIndia"
    );

    const Days = value.Days;
    // const interval = `0 0 */${Days} * *`;

    const getGstNumbers = await knex("validateGST_PAN").select(
      "gst",
      "supplierId"
    );
    if (getGstNumbers.length == 0) {
      return res.status(404).json({
        error: true,
        message: "No GST Numbers found in Database",
      });
    }
    //let data = [];
    // let status = [];
    //  getGstNumbers.forEach(async (element, index) => {
    //     const currentDateIST = moment
    //       .tz("Asia/Kolkata")
    //       .format("YYYY-MM-DD HH:mm:ss");
    //     const getGstVerifcation = await masterindia.getGstDetails(element.gst);
    //     if (getGstVerifcation.error == true) {
    //       const supId = element.supplierId;
    //       const updateGstStatus = await knex("validateGST_PAN")
    //         .update({ gstStatus: "Pending", gstTime: currentDateIST })
    //         .where({ supplierId: supId });
    //     } else {
    //       const supId = element.supplierId;
    //       const status = getGstVerifcation.data.sts;
    //       const updateGstStatus = await knex("validateGST_PAN")
    //         .update({ gstStatus: status, gstTime: currentDateIST })
    //         .where({ supplierId: supId });
    //     }
    //   });

    const currentDateIST = moment
      .tz("Asia/Kolkata")
      .format("YYYY-MM-DD HH:mm:ss");
    //     const updatePromises = getGstNumbers.map(async (element) => {
    //       const getGstVerification = await masterindia.getGstDetails(element.gst);
    //       console.log(getGstVerification,"this is gst data")
    //       const status = getGstVerification.error

    //       ? "Pending"
    //         : getGstVerification.data.sts;
    //       return knex("validateGST_PAN")
    //         .update({ gstStatus: status, gstTime: currentDateIST })
    //         .where({ supplierId: element.supplierId });
    //     });
    //  // Wait for all updates to complete
    //     await Promise.all(updatePromises);

    for (const element of getGstNumbers) {
      const getGstVerification = await masterindia.getGstDetails(element.gst);
      if (
        getGstVerification.error == true ||
        getGstVerification.error == "invalid_request"
      ) {
        if (
          getGstVerification.data ||
          getGstVerification.message == "paramter missing"
        ) {
          const status = getGstVerification.data
            ? getGstVerification.data.sts
            : "Pending";
          const updateGstStatus = await knex("validateGST_PAN")
            .update({ gstStatus: status, gstTime: currentDateIST })
            .where({ supplierId: element.supplierId });
          if (element.supplierId) {
            const modifiedByTable1 = await functions.SetModifiedBy(
              req.headers["authorization"],
              "validateGST_PAN",
              "supplierId",
              element.supplierId
            );
            console.log("isUpdated:-", modifiedByTable1);
          }
        } else {
          return res.status(400).json({
            error: true,
            message: getGstVerification.message,
            data: getGstVerification.error,
          });
        }
      } else if (getGstVerification.error == false) {
        const status = getGstVerification.data.sts;
        await knex("validateGST_PAN")
          .update({ gstStatus: status, gstTime: currentDateIST })
          .where({ supplierId: element.supplierId });
        if (element.supplierId) {
          const modifiedByTable1 = await functions.SetModifiedBy(
            req.headers["authorization"],
            "validateGST_PAN",
            "supplierId",
            element.supplierId
          );
          console.log("isUpdated:-", modifiedByTable1);
        }
      } else {
        return res.status(400).json({
          error: true,
          message: getGstVerification.message,
          data: getGstVerification.error,
        });
      }
    }
    const data = await knex("validateGST_PAN").select(
      "supplierId",
      "supplierName",
      "gst",
      "gstStatus as status",
      knex.raw("CONVERT_TZ(gstTime, '+00:00', '+05:30') as time")
    );
    if (data.length <= 0) {
      return res.status(200).json({
        error: false,
        message: "Periodic execution not started.",
        data,
      });
    }
    return res.status(200).json({
      error: false,
      message: "Periodic execution started.",
      data,
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: "Could not check gst compliance",
      data: { error: JSON.stringify(error) },
    });
  }
};

// Selected GST Data
const gstComplianceCheckUpdated = async (req, res) => {
  try {
    const { error, value } = validation.gstComplianceCheckUpdated(req.body);
    if (error) {
      return res.status(400).json({
        error: true,
        message: error.details[0].message,
        data: error,
      });
    }
    // Log the API call
    await logApiCalls.logAPICalls(
      "masterIndiaController-gstComplianceCheckUpdated",
      req.originalUrl,
      "MasterIndia"
    );

    const { gstNo } = value;

    const currentDateIST = moment
      .tz("Asia/Kolkata")
      .format("YYYY-MM-DD HH:mm:ss");

    const notInDb = [];
    for (const element of gstNo) {
      const checkGst = await knex("validateGST_PAN").where(
        "supplierId",
        element.supplierId
      );
      // .where("gst", element.gst)
      if (checkGst.length <= 0) {
        const obj = {
          supplierId: element.supplierId,
          gst: element.gst,
        };
        notInDb.push(obj);
      } else {
        const getGstVerification = await masterindia.getGstDetails(element.gst);
        if (getGstVerification.error == true) {
          const status = getGstVerification.data
            ? getGstVerification.data.sts
            : "Invalid";

          const updateGstStatus = await knex("validateGST_PAN")
            .update({ gstStatus: status, gstTime: currentDateIST })
            .where({ supplierId: element.supplierId });

          if (element.supplierId) {
            const modifiedByTable1 = await functions.SetModifiedBy(
              req.headers["authorization"],
              "validateGST_PAN",
              "supplierId",
              element.supplierId
            );
            console.log("isUpdated:-", modifiedByTable1);
          }

          const data = await knex("validateGST_PAN")
            .leftJoin(
              "supplier_details",
              "supplier_details.id",
              "=",
              "validateGST_PAN.supplierId"
            )
            .where({ supplierId: element.supplierId });
          const emailBodyPromise = emailTemplate.verifyGSTEmail(
            data[0].supplierName,
            data[0].gst
          );
          const emailBody = await emailBodyPromise;

          // Send email
          ses.sendEmail(
            process.env.OTP_EMAIL,
            data[0].emailID,
            "Invalid GST",
            emailBody
          );
        } else if (getGstVerification.error == false) {
          const status = getGstVerification.data.sts;
          await knex("validateGST_PAN")
            .update({ gstStatus: status, gstTime: currentDateIST })
            .where({ supplierId: element.supplierId });
          if (element.supplierId) {
            const modifiedByTable1 = await functions.SetModifiedBy(
              req.headers["authorization"],
              "validateGST_PAN",
              "supplierId",
              element.supplierId
            );
            console.log("isUpdated:-", modifiedByTable1);
          }
        }
        await knex("validateGST_PAN")
          .update({
            gstOldStatus: checkGst[0].gstStatus,
            gstOldTime: checkGst[0].gstTime,
          })
          .where({ supplierId: element.supplierId });
        if (element.supplierId) {
          const modifiedByTable1 = await functions.SetModifiedBy(
            req.headers["authorization"],
            "validateGST_PAN",
            "supplierId",
            element.supplierId
          );
          console.log("isUpdated:-", modifiedByTable1);
        }
      }
    }

    return res.status(200).json({
      error: false,
      message: "GST Compliance Check Done.",
      notInDb,
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: "Could not do gst compliance check update",
      data: { error: JSON.stringify(error) },
    });
  }
};

const panComplianceCheck = async (req, res) => {
  try {
    const { error, value } = validation.panComplianceCheck(req.body);
    if (error) {
      return res.status(400).json({
        error: true,
        message: error.details[0].message,
        data: error,
      });
    }
    // Log the API call
    await logApiCalls.logAPICalls(
      "masterIndiaController-panComplianceCheck",
      req.originalUrl,
      "MasterIndia"
    );

    const Days = value.Days;
    // const interval = `0 0 */${Days} * *`;

    const getPanNumbers = await knex("validateGST_PAN").select(
      "pan",
      "supplierId"
    );
    if (getPanNumbers.length == 0) {
      return res.status(404).json({
        error: true,
        message: "No PAN Numbers found in Database",
      });
    }

    const currentDateIST = moment
      .tz("Asia/Kolkata")
      .format("YYYY-MM-DD HH:mm:ss");
    // const updatePromises = getPanNumbers.map(async (element) => {
    //   const getPanVerification = await masterindia.getPanDetails(element.pan);
    //   console.log(getPanVerification, "this is pan verification");
    //   const status =
    //     getPanVerification.data.response.code === 400 ||
    //     getPanVerification.data.response.code === 404
    //       ? "Invalid"
    //       : getPanVerification.data.response.code === 200
    //       ? "Valid"
    //       : "Unknown";

    //   if (status !== "Valid" && status !== "Invalid") {
    //     return res.json({
    //       error: true,
    //       message: getPanVerification.data.response.message || "Internal Server error",
    //       statusCode: getPanVerification.data.response.code || 500, // You can send the received status code for debugging purposes
    //     });
    //   }

    //   return knex("validateGST_PAN")
    //     .update({ panStatus: status, panTime: currentDateIST })
    //     .where({ supplierId: element.supplierId });
    // });
    // // Wait for all updates to complete
    // await Promise.all(updatePromises);

    for (const element of getPanNumbers) {
      const getPanVerification = await masterindia.getPanDetails(element.pan);

      if (getPanVerification.error == false) {
        const status =
          getPanVerification.data.response.code === 400 ||
          getPanVerification.data.response.code === 404
            ? "Invalid"
            : getPanVerification.data.response.code === 200
            ? "Valid"
            : "Unknown";

        if (status !== "Valid" && status !== "Invalid") {
          return res.status(500).json({
            error: true,
            message:
              getPanVerification.data.response.message ||
              "Internal Server error",
            statusCode: getPanVerification.data.response.code || 500, // You can send the received status code for debugging purposes
          });
        }

        await knex("validateGST_PAN")
          .update({ panStatus: status, panTime: currentDateIST })
          .where({ supplierId: element.supplierId });
        if (element.supplierId) {
          const modifiedByTable1 = await functions.SetModifiedBy(
            req.headers["authorization"],
            "validateGST_PAN",
            "supplierId",
            element.supplierId
          );
          console.log("isUpdated:-", modifiedByTable1);
        }
      } else {
        return res.status(400).json({
          error: true,
          message: getPanVerification.message,
          data: getPanVerification.error,
        });
      }
    }

    const data = await knex("validateGST_PAN").select(
      "supplierId",
      "supplierName",
      "pan",
      "panStatus as status",
      knex.raw("CONVERT_TZ(panTime, '+00:00', '+05:30') as time")
    );
    if (data.length <= 0) {
      return res.status(200).json({
        error: false,
        message: "Periodic execution started.",
        data,
      });
    }
    return res.status(200).json({
      error: false,
      message: "Periodic execution started.",
      data,
    });
  } catch (error) {
    return res.status(400).json({
      error: true,
      message: "Could not do pan compliance check",
    });
  }
};

// Selected PAN Data
const panComplianceCheckUpdated = async (req, res) => {
  try {
    const { error, value } = validation.panComplianceCheckUpdated(req.body);
    if (error) {
      return res.status(400).json({
        error: true,
        message: error.details[0].message,
        data: error,
      });
    }

    // Log the API call
    await logApiCalls.logAPICalls(
      "masterIndiaController-panComplianceCheckUpdated",
      req.originalUrl,
      "MasterIndia"
    );
    const { panNo } = value;

    const currentDateIST = moment
      .tz("Asia/Kolkata")
      .format("YYYY-MM-DD HH:mm:ss");

    const notInDb = [];

    for (const element of panNo) {
      const checkPan = await knex("validateGST_PAN")
        // .where("gst", element.gst)
        .where("supplierId", element.supplierId);
      // .where("pan", element.pan);
      if (checkPan.length <= 0) {
        const obj = {
          supplierId: element.supplierId,
          pan: element.pan,
        };
        notInDb.push(obj);
      } else {
        const getPanVerification = await masterindia.getPanDetails(element.pan);
        if (getPanVerification.error == false) {
          const status =
            getPanVerification.data.response.code === 400 ||
            getPanVerification.data.response.code === 404
              ? "Invalid"
              : getPanVerification.data.response.code === 200
              ? "Valid"
              : "Unknown";
          if (status === "Invalid") {
            const data = await knex("validateGST_PAN")
              .leftJoin(
                "supplier_details",
                "supplier_details.id",
                "=",
                "validateGST_PAN.supplierId"
              )
              .where({ supplierId: element.supplierId });
            const emailBodyPromise = emailTemplate.verifyPanEmail(
              data[0].supplierName,
              data[0].pan
            );
            const emailBody = await emailBodyPromise;

            // Send email
            const sesData = await ses.sendEmail(
              process.env.OTP_EMAIL,
              data[0].emailID,
              "Invalid PAN",
              emailBody
            );
          }

          if (status !== "Valid" && status !== "Invalid") {
            return res.status(500).json({
              error: true,
              message:
                getPanVerification.data.response.message ||
                "Internal Server error",
              statusCode: getPanVerification.data.response.code || 500, // You can send the received status code for debugging purposes
            });
          }
          await knex("validateGST_PAN")
            .update({
              panOldStatus: checkPan[0].panStatus,
              panOldTime: checkPan[0].panTime,
            })
            .where({ supplierId: element.supplierId });
          if (element.supplierId) {
            const modifiedByTable1 = await functions.SetModifiedBy(
              req.headers["authorization"],
              "validateGST_PAN",
              "supplierId",
              element.supplierId
            );
            console.log("isUpdated:-", modifiedByTable1);
          }
          await knex("validateGST_PAN")
            .update({ panStatus: status, panTime: currentDateIST })
            .where({ supplierId: element.supplierId });
          if (element.supplierId) {
            const modifiedByTable2 = await functions.SetModifiedBy(
              req.headers["authorization"],
              "validateGST_PAN",
              "supplierId",
              element.supplierId
            );
            console.log("isUpdated:-", modifiedByTable2);
          }
        } else {
          await knex("validateGST_PAN")
            .update({ panStatus: "Invalid", panTime: currentDateIST })
            .where({ supplierId: element.supplierId });
          if (element.supplierId) {
            const modifiedByTable1 = await functions.SetModifiedBy(
              req.headers["authorization"],
              "validateGST_PAN",
              "supplierId",
              element.supplierId
            );
            console.log("isUpdated:-", modifiedByTable1);
          }
        }
      }
    }

    return res.status(200).json({
      error: false,
      message: "PAN Compliance Check Done",
      notInDb,
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: "Could not do pan compliance check update.",
    });
  }
};

const msmeComplianceCheck = async (req, res) => {
  try {
    const { error, value } = validation.msmeComplianceCheck(req.body);
    if (error) {
      return res.status(400).json({
        error: true,
        message: error.details[0].message,
        data: error,
      });
    }

    // Log the API call
    await logApiCalls.logAPICalls(
      "msmeComplianceCheck",
      req.originalUrl,
      "surepass"
    );

    const Days = value.Days;

    let getMsmeNumbers = await knex("validateGST_PAN").select(
      "msmeNo",
      "supplierId"
    );
    getMsmeNumbers = getMsmeNumbers.filter(
      (entry) => entry.msmeNo && entry.msmeNo.trim() !== ""
    );

    if (getMsmeNumbers.length == 0) {
      return res.status(404).json({
        error: true,
        message: "No valid MSME Numbers found in Database",
      });
    }

    const currentDateIST = moment
      .tz("Asia/Kolkata")
      .format("YYYY-MM-DD HH:mm:ss");

    for (const element of getMsmeNumbers) {
      const getMsmeVerification = await surepass.getMsmeDetails(element.msmeNo);
      console.log("test", getMsmeVerification);

      if (getMsmeVerification) {
        const status =
          getMsmeVerification.data.status_code === 422
            ? "Invalid"
            : getMsmeVerification.data.status_code == 200
            ? "Valid"
            : "Unknown";

        // console.log("status", status);

        // if (status !== "Valid" && status !== "Invalid") {
        //   return res.json({
        //     error: true,
        //     message:
        //       getMsmeVerification.data.message ||
        //       "Internal Server error",
        //     statusCode: getMsmeVerification.data.status || 500,
        //   });
        // }

        await knex("validateGST_PAN")
          .update({ msmeStatus: status, msmeTime: currentDateIST })
          .where({ supplierId: element.supplierId });
        if (element.supplierId) {
          const modifiedByTable1 = await functions.SetModifiedBy(
            req.headers["authorization"],
            "validateGST_PAN",
            "supplierId",
            element.supplierId
          );
          console.log("isUpdated:-", modifiedByTable1);
        }
      } else {
        // console.log("MSME Verification Error:", getMsmeVerification.message);
        return res.status(500).json({
          error: true,
          message: "Could not do msme compliance check",
          data: getMsmeVerification.error,
        });
      }
    }

    const data = await knex("validateGST_PAN").select(
      "supplierId",
      "supplierName",
      "msmeNo",
      "msmeStatus as status",
      knex.raw("CONVERT_TZ(msmeTime, '+00:00', '+05:30') as time")
    );

    if (data.length <= 0) {
      return res.status(200).json({
        error: false,
        message: "Periodic execution started.",
        data,
      });
    }
    return res.status(200).json({
      error: false,
      message: "Periodic execution started.",
      data,
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: "Could not do msme compliance check.",
    });
  }
};

// //need to test this check updated
const msmeComplianceCheckUpdated = async (req, res) => {
  console.log("here");
  try {
    const { error, value } = validation.msmeComplianceCheckUpdated(req.body);
    if (error) {
      return res.status(400).json({
        error: true,
        message: error.details[0].message,
        data: error,
      });
    }

    // Log the API call
    await logApiCalls.logAPICalls(
      "masterIndiaController-msmeComplianceCheckUpdated",
      req.originalUrl,
      "surepass"
    );
    const { msmeNo } = value;

    const currentDateIST = moment
      .tz("Asia/Kolkata")
      .format("YYYY-MM-DD HH:mm:ss");

    const notInDb = [];

    for (const element of msmeNo) {
      const checkMsme = await knex("validateGST_PAN").where(
        "supplierId",
        element.supplierId
      );

      if (checkMsme.length <= 0) {
        const obj = {
          supplierId: element.supplierId,
          msmeNo: element.msmeNo,
        };
        notInDb.push(obj);
      } else {
        const getMsmeVerification = await surepass.getMsmeDetails(
          element.msmeNo
        );
        if (getMsmeVerification) {
          console.log("first :", getMsmeVerification.data);
          console.log("Status Code :", getMsmeVerification.data.status_code);
          const status =
            getMsmeVerification.data.status_code == 422
              ? "Invalid"
              : getMsmeVerification.status_code == 200
              ? "Valid"
              : getMsmeVerification.status_code == 403
              ? "No API balance"
              : "Unknown";
          console.log("status", status);
          if (status === "Invalid") {
            const data = await knex("validateGST_PAN")
              .leftJoin(
                "supplier_details",
                "supplier_details.id",
                "=",
                "validateGST_PAN.supplierId"
              )
              .where({ supplierId: element.supplierId });
            const emailBodyPromise = emailTemplate.verifyMsmeEmail(
              data[0].supplierName,
              data[0].msmeNo
            );
            const emailBodyForAdmin = emailTemplate.AdminMsmeEmail(
              data[0].supplierName,
              data[0].msmeNo
            );
            const emailAdmin = emailTemplate.AdminNotAbleToSendMail(
              data[0].supplierName,
              data[0].msmeNo
            );
            const emailBody = await emailBodyPromise;
            const emailBodyAdmin = await emailBodyForAdmin;
            const emailToAdmin = await emailAdmin;

            const sender = await constant.getEnv("OTP_EMAIL");
            console.log("Sender :", sender);
            // Send email
            console.log("sending mail..");
            if (data[0].emailID !== null && data[0].emailID !== "") {
              const sesData = await ses.sendEmail(
                sender,
                data[0].emailID,
                "Invalid MSME",
                emailBody
              );
              await ses.sendEmail(
                process.env.OTP_EMAIL,
                "supplierxuser@gmail.com",
                `Invalid MSME for ${data[0].supplierName}`,
                emailBodyAdmin
              );
            } else {
              await ses.sendEmail(
                process.env.OTP_EMAIL,
                "supplierxuser@gmail.com",
                `Invalid MSME for ${data[0].supplierName}`,
                emailToAdmin
              );
            }
          }

          // if (status !== "Valid" && status !== "Invalid") {
          //   return res.json({
          //     error: true,
          //     message:
          //       getMsmeVerification.data.response.message ||
          //       "Internal Server error",
          //     statusCode: getMsmeVerification.data.response.code || 500, // You can send the received status code for debugging purposes
          //   });
          // }

          await knex("validateGST_PAN")
            .update({
              msmeOldStatus: checkMsme[0].msmeStatus,
              msmeOldTime: checkMsme[0].msmeTime,
            })
            .where({ supplierId: element.supplierId });
          if (element.supplierId) {
            const modifiedByTable1 = await functions.SetModifiedBy(
              req.headers["authorization"],
              "validateGST_PAN",
              "supplierId",
              element.supplierId
            );
            console.log("isUpdated:-", modifiedByTable1);
          }
          await knex("validateGST_PAN")
            .update({ msmeStatus: status, msmeTime: currentDateIST })
            .where({ supplierId: element.supplierId });
          if (element.supplierId) {
            const modifiedByTable2 = await functions.SetModifiedBy(
              req.headers["authorization"],
              "validateGST_PAN",
              "supplierId",
              element.supplierId
            );
            console.log("isUpdated:-", modifiedByTable2);
          }
        } else {
          await knex("validateGST_PAN")
            .update({ msmeStatus: "Invalid", msmeTime: currentDateIST })
            .where({ supplierId: element.supplierId });
          if (element.supplierId) {
            const modifiedByTable1 = await functions.SetModifiedBy(
              req.headers["authorization"],
              "validateGST_PAN",
              "supplierId",
              element.supplierId
            );
            console.log("isUpdated:-", modifiedByTable1);
          }
        }
      }
    }

    return res.status(200).json({
      error: false,
      message: "MSME Compliance Check Done",
      notInDb,
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: "Could not do msme compliance check",
      data: { error: JSON.stringify(error.message) },
    });
  }
};

const addAllRecordsAtOnce = async (req, res) => {
  try {
    const data = await knex("supplier_details").select(
      "id",
      "supplier_name",
      "panNo",
      "gstNo",
      "sap_code"
    );

    if (data.length == 0) {
      return res.status(404).json({
        error: true,
        message: "No data found in supplier_details",
      });
    }

    for (const iterator of data) {
      const getMsmeNo = await knex("business_details")
        .where({ company_id: iterator.id })
        .select("msme_no");
      const msmeNo = getMsmeNo.length > 0 ? getMsmeNo[0].msme_no : null;

      const select = await knex("validateGST_PAN").where({
        supplierId: iterator.id,
      });

      if (select.length == 0) {
        const insertIntoVerification = await knex("validateGST_PAN").insert({
          supplierId: iterator.id,
          supplierName: iterator.supplier_name,
          sapcode: iterator.sap_code,
          gst: iterator.gstNo,
          gstStatus: "Valid",
          gstTime: knex.fn.now(),
          pan: iterator.panNo,
          panStatus: "Valid",
          panTime: knex.fn.now(),
          msmeNo: msmeNo,
          msmeStatus: "Valid",
          msmeTime: knex.fn.now(),
        });
      }
    }

    return res.status(200).json({
      error: false,
      message: "All records added successfully",
      data: data,
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: "Could not add all records.",
      data: { error: JSON.stringify(error) },
    });
  }
};

const getGST = async (req, res) => {
  try {
    const token = req.headers["authorization"];
    if (!token) {
      return res.status(400).json({
        error: true,
        message: "Token is required.",
      });
    }

    const { jwtConfig } = constant;
    const payload = jwt.decode(token.split(" ")[1], jwtConfig.secret);
    const statusChanger = payload.permissions[0];
    const statusChangerId = payload.id;
    const email = payload.email;

    const {
      offset = 0,
      limit = 10000,
      sort = "id",
      order = "desc",
      status = "Active",
      search = "",
      filter = {},
    } = req.body;

    let result = knex("validateGST_PAN")
      .select(
        "id",
        "supplierId",
        "supplierName",
        "sapcode",
        "gst",
        "gstStatus as status",
        "gstTime as time",
        "gstOldStatus as oldStatus",
        "gstOldTime as oldTime"
      )
      .whereNotNull("gst")
      .andWhereNot("gst", "");
    const searchFrom = [
      "supplierName",
      "sapcode",
      "gst",
      "gstStatus",
      "gstOldStatus",
    ];
    if (search && search != "") {
      result.where((builder) => {
        searchFrom.forEach((element) => {
          builder.orWhereILike(element, `%${search}%`);
        });
      });
    }

    if (filter) {
      const { startDate, endDate, dateField } = filter;
      if (startDate && endDate && dateField) {
        const startDateISO = new Date(startDate).toISOString();
        const endDateISO = new Date(endDate + "T23:59:59.999Z").toISOString();
        result.whereBetween(dateField, [startDateISO, endDateISO]);
      }
    }

    let total = await result.count("id as total").first();

    let query = knex("validateGST_PAN")
      .select(
        "id",
        "supplierId",
        "supplierName",
        "sapcode",
        "gst",
        "gstStatus as status",
        "gstTime as time",
        "gstOldStatus as oldStatus",
        "gstOldTime as oldTime"
      )
      .whereNotNull("gst")
      .andWhereNot("gst", "");

    if (search && search != "") {
      query.where((builder) => {
        searchFrom.forEach((element) => {
          builder.orWhereILike(element, `%${search}%`);
        });
      });
    }

    if (filter) {
      const { startDate, endDate, dateField } = filter;
      if (startDate && endDate && dateField) {
        const startDateISO = new Date(startDate).toISOString();
        const endDateISO = new Date(endDate + "T23:59:59.999Z").toISOString();
        query.whereBetween(dateField, [startDateISO, endDateISO]);
      }
    }

    let data = await query.orderBy(sort, order).limit(limit).offset(offset);
    const supplierIds = await knex("supplier_details").pluck("id");
    // if (data.length == 0)
    //   return res.status(404).json({
    //     error: true,
    //     message: "No data found in validateGST_PAN",
    //   });

    let data_rows = [];
    if (order === "asc") {
      let sr = offset + 1;
      console.log(sr);
      data.forEach((row) => {
        row.sr = sr;
        row.isDeletable = supplierIds.includes(row.supplierId) ? 0 : 1;
        data_rows.push(row);
        sr++;
      });
    } else {
      let sr = total.total - limit * offset;
      data.forEach((row) => {
        row.sr = sr;
        row.isDeletable = supplierIds.includes(row.supplierId) ? 0 : 1;
        data_rows.push(row);
        sr--;
      });
    }

    data_rows.forEach(async (element, index) => {
      data[index].time = moment(element.time).format("YYYY-MM-DD HH:mm:ss");
      data[index].oldTime = element.oldTime
        ? moment(element.oldTime).format("YYYY-MM-DD HH:mm:ss")
        : null;
    });
    return res.status(200).json({
      error: false,
      message: "All records added successfully",
      data: data_rows,
      total: total.total,
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: "Could not add all records",
      data: { error: JSON.stringify(error.message) },
    });
  }
};

const getPAN = async (req, res) => {
  try {
    const token = req.headers["authorization"];
    if (!token) {
      return res.status(400).json({
        error: true,
        message: "Token is required.",
      });
    }

    const { jwtConfig } = constant;
    const payload = jwt.decode(token.split(" ")[1], jwtConfig.secret);
    const statusChanger = payload.permissions[0];
    const statusChangerId = payload.id;
    const email = payload.email;

    const {
      offset = 0,
      limit = 10000,
      sort = "id",
      order = "desc",
      status = "Valid",
      search = "",
      filter = {},
    } = req.body;

    const searchFrom = [
      "supplierName",
      "sapcode",
      "pan",
      "panStatus",
      "panOldStatus",
    ];

    let result = knex("validateGST_PAN")
      .select(
        "id",
        "supplierId",
        "supplierName",
        "sapcode",
        "pan",
        "panStatus as status",
        "panTime as time",
        "panOldStatus as oldStatus",
        "panOldTime as oldTime"
      )
      .whereNotNull("pan");

    if (search && search != "") {
      result.where((builder) => {
        searchFrom.forEach((element) => {
          builder.orWhereILike(element, `%${search}%`);
        });
      });
    }

    if (filter) {
      const { startDate, endDate, dateField } = filter;
      if (startDate && endDate && dateField) {
        const startDateISO = new Date(startDate).toISOString();
        const endDateISO = new Date(endDate + "T23:59:59.999Z").toISOString();
        result.whereBetween(dateField, [startDateISO, endDateISO]);
      }
    }

    const total = await result.count("id as total").first();

    let query = knex("validateGST_PAN")
      .select(
        "id",
        "supplierId",
        "supplierName",
        "sapcode",
        "pan",
        "panStatus as status",
        "panTime as time",
        "panOldStatus as oldStatus",
        "panOldTime as oldTime"
      )
      .whereNotNull("pan");

    if (search && search != "") {
      query.where((builder) => {
        searchFrom.forEach((element) => {
          builder.orWhereILike(element, `%${search}%`);
        });
      });
    }

    if (filter) {
      const { startDate, endDate, dateField } = filter;
      if (startDate && endDate && dateField) {
        const startDateISO = new Date(startDate).toISOString();
        const endDateISO = new Date(endDate + "T23:59:59.999Z").toISOString();
        query.whereBetween(dateField, [startDateISO, endDateISO]);
      }
    }
    let data = await query.orderBy(sort, order).limit(limit).offset(offset);
    const supplierIds = await knex("supplier_details").pluck("id");
    // if (data.length == 0)
    //   return res.status(404).json({
    //     error: true,
    //     message: "No data found in validateGST_PAN",
    //   });

    let sr = offset + 1;

    let data_rows = [];
    if (order === "asc") {
      let sr = offset + 1;
      console.log(sr);
      data.forEach((row) => {
        row.sr = sr;
        row.isDeletable = supplierIds.includes(row.supplierId) ? 0 : 1;
        data_rows.push(row);
        sr++;
      });
    } else {
      let sr = total.total - limit * offset;
      data.forEach((row) => {
        row.sr = sr;
        row.isDeletable = supplierIds.includes(row.supplierId) ? 0 : 1;
        data_rows.push(row);
        sr--;
      });
    }

    // Step 2: Format 'oldTime' property using moment.js
    data_rows.forEach((element, index) => {
      element.oldTime = moment(element.oldTime).format("YYYY-MM-DD HH:mm:ss");
    });

    data_rows.forEach(async (element, index) => {
      data[index].time = moment(element.time).format("YYYY-MM-DD HH:mm:ss");
      data[index].oldTime = element.oldTime
        ? moment(element.oldTime).format("YYYY-MM-DD HH:mm:ss")
        : null;
    });

    return res.status(200).json({
      error: false,
      message: "All records added successfully",
      data: data_rows,
      total: total.total,
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: "Could not add all records",
      data: { error: JSON.stringify(error.message) },
    });
  }
};

const getMsme = async (req, res) => {
  try {
    console.log("test");
    const token = req.headers["authorization"];
    if (!token) {
      return res.status(400).json({
        error: true,
        message: "Token is required.",
      });
    }

    const { jwtConfig } = constant;
    const payload = jwt.decode(token.split(" ")[1], jwtConfig.secret);
    const statusChanger = payload.permissions[0];
    const statusChangerId = payload.id;
    const email = payload.email;

    const {
      offset = 0,
      limit = 10000,
      sort = "id",
      order = "desc",
      status = "Valid",
      search = "",
      filter = {},
    } = req.body;

    const searchFrom = [
      "supplierName",
      "msmeNO",
      "msmeStatus",
      "msmeOldStatus",
    ];

    let result = knex("validateGST_PAN")
      .select(
        "id",
        "supplierId",
        "supplierName",
        "sapcode",
        "msmeNO",
        "msmeStatus as status",
        "msmeTime as time",
        "msmeOldStatus as oldStatus",
        "msmeOldTime as oldTime"
      )
      .whereNotNull("msmeNO")
      .andWhereNot("msmeNO", "");

    if (search && search != "") {
      result.where((builder) => {
        searchFrom.forEach((element) => {
          builder.orWhereILike(element, `%${search}%`);
        });
      });
    }

    if (filter) {
      const { startDate, endDate, dateField } = filter;
      if (startDate && endDate && dateField) {
        const startDateISO = new Date(startDate).toISOString();
        const endDateISO = new Date(endDate + "T23:59:59.999Z").toISOString();
        result.whereBetween(dateField, [startDateISO, endDateISO]);
      }
    }

    const total = await result.count("id as total").first();

    let query = knex("validateGST_PAN")
      .select(
        "id",
        "supplierId",
        "supplierName",
        "sapcode",
        "msmeNO",
        "msmeStatus as status",
        "msmeTime as time",
        "msmeOldStatus as oldStatus",
        "msmeOldTime as oldTime"
      )
      .whereNotNull("msmeNO")
      .andWhereNot("msmeNO", "");

    if (search && search != "") {
      query.where((builder) => {
        searchFrom.forEach((element) => {
          builder.orWhereILike(element, `%${search}%`);
        });
      });
    }

    if (filter) {
      const { startDate, endDate, dateField } = filter;
      if (startDate && endDate && dateField) {
        const startDateISO = new Date(startDate).toISOString();
        const endDateISO = new Date(endDate + "T23:59:59.999Z").toISOString();
        query.whereBetween(dateField, [startDateISO, endDateISO]);
      }
    }

    let data = await query.orderBy(sort, order).limit(limit).offset(offset);
    const supplierIds = await knex("supplier_details").pluck("id");
    // if (data.length == 0)
    //   return res.status(404).json({
    //     error: true,
    //     message: "No data found in validateGST_PAN",
    //   });

    let data_rows = [];
    if (order === "asc") {
      let sr = offset + 1;
      console.log(sr);
      data.forEach((row) => {
        row.sr = sr;
        row.isDeletable = supplierIds.includes(row.supplierId) ? 0 : 1;
        data_rows.push(row);
        sr++;
      });
    } else {
      let sr = total.total - limit * offset;
      data.forEach((row) => {
        row.sr = sr;
        row.isDeletable = supplierIds.includes(row.supplierId) ? 0 : 1;
        data_rows.push(row);
        sr--;
      });
    }

    // Step 2: Format 'oldTime' property using moment.js
    data_rows.forEach((element, index) => {
      element.oldTime = element.oldTime
        ? moment(element.oldTime).format("YYYY-MM-DD HH:mm:ss")
        : null;
    });

    data_rows.forEach(async (element, index) => {
      data_rows[index].time = moment(element.time).format(
        "YYYY-MM-DD HH:mm:ss"
      );
      data_rows[index].oldTime = element.oldTime
        ? moment(element.oldTime).format("YYYY-MM-DD HH:mm:ss")
        : null;
    });
    return res.status(200).json({
      error: false,
      message: "All records added successfully",
      data: data_rows,
      total: total.total,
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: "Could not add all records",
      data: { error: JSON.stringify(error) },
    });
  }
};

const getGstTimeline = async (req, res) => {
  try {
    const { supplierId } = req.body;
    const getTimeline = await knex("validateGST_PAN")
      .where({
        supplierId,
      })
      .first();

    // Format date fields to yyyy-mm-dd format using Moment.js
    const formattedData = {
      ...getTimeline,
      gstTime: getTimeline.gstTime
        ? moment(getTimeline.gstTime).format("YYYY-MM-DD")
        : null,
      gstOldTime: getTimeline.gstOldTime
        ? moment(getTimeline.gstOldTime).format("YYYY-MM-DD")
        : null,
      panTime: getTimeline.panTime
        ? moment(getTimeline.panTime).format("YYYY-MM-DD")
        : null,
      panOldTime: getTimeline.panOldTime
        ? moment(getTimeline.panOldTime).format("YYYY-MM-DD")
        : null,
    };

    return res.status(200).json({
      error: false,
      message: "Data retrieved successfully",
      data: formattedData,
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: "Could not load record(s)",
    });
  }
};

const authForIrn = async (req, res) => {
  try {
    const accessToken = await masterindia.authForIrn();
    // Log the API call
    await logApiCalls.logAPICalls(
      "masterIndiaController-authForIrn",
      req.originalUrl,
      "MasterIndia"
    );
    return res.status(200)
      .json({
        error: false,
        message: "Access token retrieved",
        data: accessToken,
      })
      .end();
  } catch (error) {
    console.error("Error1:", error.message);
    return res.status(500).json({ error: "Could not retrive" }).end();
  }
};

const generateIrn = async (req, res) => {
  try {
    const { error, value } = validation.generateIRN(req.body);

    if (error) {
      return res.status(400).json({
        error: true,
        message: error.details[0].message,
      });
    }
    // Log the API call
    await logApiCalls.logAPICalls(
      "masterIndiaController-generateIrn",
      req.originalUrl,
      "MasterIndia"
    );

    let {
      asnNo,
      user_gstin,
      data_source,
      transaction_details,
      document_details,
      seller_details,
      buyer_details,
      dispatch_details,
      ship_details,
      export_details,
      payment_details,
      reference_details,
      additional_document_details,
      ewaybill_details,
      value_details,
      item_list,
    } = value;

    ///////////////////////fetch line items///////////////////////////

    const getAsn = await knex("asns").where("asnNo", asnNo).first();

    const getPoNo = getAsn.poNo;

    let service_is = "N";

    if (getAsn.type == "ZSER") {
      service_is = "Y";
    }

    const getLineItems = JSON.parse(getAsn.lineItems);

    const setLineItems = [];
    let i = 1;
    for (const iterator of getLineItems) {
      let currentHsnCode;
      if (iterator.hsnCode == undefined) {
        currentHsnCode = "Service";
      } else {
        currentHsnCode = iterator.hsnCode;
      }

      const currentLineItem = {
        item_serial_number: i++,
        product_description: iterator.serviceName,
        is_service: service_is,
        hsn_code: currentHsnCode,
        unit: iterator.unit,
        unit_price: iterator.pricePerUnit,
        total_amount: iterator.subTotal,
        assessable_value: value_details.assessable_value,
        gst_rate: (100 * iterator.gst) / iterator.subTotal,
        total_item_value: value_details.total_assessable_value,
        batch_details: {
          name: "aeonx",
        },
      };
      setLineItems.push(currentLineItem);
    }

    ///////////////////////fetch line items over///////////////////////

    /////////////////////set values using getAsn///////////////////////

    const getSupplierDetails = await knex("supplier_details")
      .where("sap_code", getAsn.supplierId)
      .first();

    //gstNo, supplier_name, streetNo + address1 + address2 + address3, city, pin, state
    seller_details = {};
    seller_details.gstin = getSupplierDetails.gstNo;
    seller_details.legal_name = getSupplierDetails.supplier_name;
    seller_details.address1 =
      getSupplierDetails.streetNo +
      " " +
      getSupplierDetails.address1 +
      " " +
      getSupplierDetails.address2 +
      " " +
      getSupplierDetails.address3;
    seller_details.location = getSupplierDetails.city;
    seller_details.pincode = getSupplierDetails.pin;
    seller_details.state_code = getSupplierDetails.state;

    buyer_details.address1 = getAsn.shipToAddress;

    dispatch_details = {};
    dispatch_details.company_name = getSupplierDetails.supplier_name;
    dispatch_details.address1 =
      getSupplierDetails.streetNo +
      " " +
      getSupplierDetails.address1 +
      " " +
      getSupplierDetails.address2 +
      " " +
      getSupplierDetails.address3;

    dispatch_details.location = getSupplierDetails.city;
    dispatch_details.pincode = getSupplierDetails.pin;
    dispatch_details.state_code = getSupplierDetails.state;

    ////////////////////set values using getAsn over //////////////////

    const transaction_details_are = JSON.stringify(transaction_details);
    const document_details_are = JSON.stringify(document_details);
    const seller_details_are = JSON.stringify(seller_details);
    const buyer_details_are = JSON.stringify(buyer_details);
    const dispatch_details_are = JSON.stringify(dispatch_details);
    const ship_details_are = JSON.stringify(ship_details);
    const export_details_are = JSON.stringify(export_details);
    const payment_details_are = JSON.stringify(payment_details);
    const reference_details_are = JSON.stringify(reference_details);
    const additional_document_details_are = JSON.stringify(
      additional_document_details
    );
    const ewaybill_details_are = JSON.stringify(ewaybill_details);
    const value_details_are = JSON.stringify(value_details);
    const item_list_are = setLineItems;

    const insertRecord = await knex("irns").insert({
      asnNo: asnNo,
      user_gstin: user_gstin,
      data_source: data_source,
      transaction_details: transaction_details_are,
      document_details: document_details_are,
      seller_details: seller_details_are,
      buyer_details: buyer_details_are,
      dispatch_details: dispatch_details_are,
      ship_details: ship_details_are,
      export_details: export_details_are,
      payment_details: payment_details_are,
      reference_details: reference_details_are,
      additional_document_details: additional_document_details_are,
      ewaybill_details: ewaybill_details_are,
      value_details: value_details_are,
      item_list: JSON.stringify(item_list_are),
    });

    // console.log("item_list_are2:=", item_list_are[0]);

    if (!insertRecord) {
      return res.status(500)
        .json({ error: true, message: "IRN could not be inserted" })
        .end();
    }

    /////////////////////////////////////////// take data to service

    const data = JSON.stringify({
      user_gstin: user_gstin,
      data_source: data_source,
      transaction_details: transaction_details,
      document_details: document_details,
      seller_details: seller_details,
      buyer_details: buyer_details,
      dispatch_details: dispatch_details,
      ship_details: ship_details,
      export_details: export_details,
      payment_details: payment_details,
      reference_details: reference_details,
      additional_document_details: additional_document_details,
      ewaybill_details: ewaybill_details,
      value_details: value_details,
      item_list: item_list_are,
    });

    let token = await masterindia.authForIrn();
    token = token.token;
    const generateIrn = await masterindia.generateIRN(data, token);

    console.log("generateIrn:=", generateIrn);
    if (generateIrn.results.code == 204) {
      return res.status(500)
        .json({
          error: true,
          message: "IRN could not be generated",
          data: generateIrn.results.errorMessage,
        })
        .end();
    }

    //////////////////////////////////////store generated irn data to table
    //console.log("insertedRec:=", insertRecord[0]);

    const ackNo = generateIrn.results.message.AckNo;
    const ackDt = generateIrn.results.message.AckDt;
    const irnNo = generateIrn.results.message.Irn;
    const ewbNo = generateIrn.results.message.EwbNo;
    const ewbDt = generateIrn.results.message.EwbDt;
    const ewbValidTill = generateIrn.results.message.EwbValidTill;
    const signedInvoice = generateIrn.results.message.SignedInvoice;
    const signedQrCode = generateIrn.results.message.SignedQRCode;
    const qRCodeUrl = generateIrn.results.message.QRCodeUrl;
    const einvoicePdf = generateIrn.results.message.EinvoicePdf;
    const ewaybillpdf = generateIrn.results.message.EwaybillPdf;

    const updateIrns = await knex("irns").where("id", insertRecord[0]).update({
      AckNo: ackNo,
      AckDt: ackDt,
      irnNo: irnNo,
      EwbNo: ewbNo,
      EwbDt: ewbDt,
      EwbValidTill: ewbValidTill,
      QRCodeUrl: qRCodeUrl,
      signedInvoice: signedInvoice,
      signedQrCode: signedQrCode,
      EinvoicePdf: einvoicePdf,
      EwayBillPdf: ewaybillpdf,
    });
    if (insertRecord[0]) {
      const modifiedByTable2 = await functions.SetModifiedBy(
        req.headers["authorization"],
        "irns",
        "id",
        insertRecord[0]
      );
      console.log("isUpdated:-", modifiedByTable2);
    }
    //add data to asn table also... do here...

    const updateAsn = await knex("asns")
      .where("asnNo", asnNo)
      .update({ eWayBillNo: ewbNo, irnNo: irnNo });

    /////////////////////////////////////////// take data to service over
    if (asnNo) {
      const modifiedByTable1 = await functions.SetModifiedBy(
        req.headers["authorization"],
        "asns",
        "asnNo",
        asnNo
      );
      console.log("isUpdated:-", modifiedByTable1);
    }
    return res.status(200)
      .json({
        error: false,
        message: "IRN generated successfully",
        data: generateIrn,
      })
      .end();
  } catch (error) {
    console.error("Error2:", error.message);
    return res.status(500).json({ error: "Could not generate" }).end();
  }
};

const generateEwayBill = async (req, res) => {
  try {
    const { error, value } = validation.generateEwayBill(req.body);
    if (error) {
      return res
        .status(400)
        .json({ error: true, message: error.details[0].message })
        .end();
    }

    const {
      userGstin,
      supply_type,
      sub_supply_type,
      sub_supply_description,
      document_type,
      document_number,
      document_date,
      gstin_of_consignor,
      legal_name_of_consignor,
      address1_of_consignor,
      address2_of_consignor,
      place_of_consignor,
      pincode_of_consignor,
      state_of_consignor,
      actual_from_state_name,
      gstin_of_consignee,
      legal_name_of_consignee,
      address1_of_consignee,
      address2_of_consignee,
      place_of_consignee,
      pincode_of_consignee,
      state_of_supply,
      actual_to_state_name,
      transaction_type,
      other_value,
      total_invoice_value,
      taxable_amount,
      cgst_amount,
      sgst_amount,
      igst_amount,
      cess_amount,
      cess_nonadvol_value,
      transporter_id,
      transporter_name,
      transporter_document_number,
      transporter_document_date,
      transportation_mode,
      transportation_distance,
      vehicle_number,
      vehicle_type,
      generate_status,
      data_source,
      user_ref,
      location_code,
      eway_bill_status,
      auto_print,
      email,
      delete_record,
      itemList,
    } = value;

    let jsonData = JSON.stringify({
      userGstin: userGstin,
      supply_type: supply_type,
      sub_supply_type: sub_supply_type,
      sub_supply_description: sub_supply_description,
      document_type: document_type,
      document_number: document_number,
      document_date: document_date,
      gstin_of_consignor: gstin_of_consignor,
      legal_name_of_consignor: legal_name_of_consignor,
      address1_of_consignor: address1_of_consignor,
      address2_of_consignor: address2_of_consignor,
      place_of_consignor: place_of_consignor,
      pincode_of_consignor: pincode_of_consignor,
      state_of_consignor: state_of_consignor,
      actual_from_state_name: actual_from_state_name,
      gstin_of_consignee: gstin_of_consignee,
      legal_name_of_consignee: legal_name_of_consignee,
      address1_of_consignee: address1_of_consignee,
      address2_of_consignee: address2_of_consignee,
      place_of_consignee: place_of_consignee,
      pincode_of_consignee: pincode_of_consignee,
      state_of_supply: state_of_supply,
      actual_to_state_name: actual_to_state_name,
      transaction_type: transaction_type,
      other_value: other_value,
      total_invoice_value: total_invoice_value,
      taxable_amount: taxable_amount,
      cgst_amount: cgst_amount,
      sgst_amount: sgst_amount,
      igst_amount: igst_amount,
      cess_amount: cess_amount,
      cess_nonadvol_value: cess_nonadvol_value,
      transporter_id: transporter_id,
      transporter_name: transporter_name,
      transporter_document_number: transporter_document_number,
      transporter_document_date: transporter_document_date,
      transportation_mode: transportation_mode,
      transportation_distance: transportation_distance,
      vehicle_number: vehicle_number,
      vehicle_type: vehicle_type,
      generate_status: generate_status,
      data_source: data_source,
      user_ref: user_ref,
      location_code: location_code,
      eway_bill_status: eway_bill_status,
      auto_print: auto_print,
      email: email,
      delete_record: delete_record,
      itemList: [
        {
          product_name: "Wheat",
          product_description: "Wheat",
          hsn_code: "1001",
          quantity: 1,
          unit_of_product: "BOX",
          cgst_rate: 6,
          sgst_rate: 6,
          igst_rate: 0,
          cess_rate: 0,
          cessNonAdvol: 0,
          taxable_amount: 100,
        },
        {
          product_name: "Wheat",
          product_description: "Wheat",
          hsn_code: "1001",
          quantity: 1,
          unit_of_product: "BOX",
          cgst_rate: 6,
          sgst_rate: 6,
          igst_rate: 0,
          cess_rate: 0,
          cessNonAdvol: 0,
          taxable_amount: 100,
        },
        {
          product_name: "Wheat",
          product_description: "Wheat",
          hsn_code: "1001",
          quantity: 1,
          unit_of_product: "BOX",
          cgst_rate: 6,
          sgst_rate: 6,
          igst_rate: 0,
          cess_rate: 0,
          cessNonAdvol: 0,
          taxable_amount: 100,
        },
        {
          product_name: "Wheat",
          product_description: "Wheat",
          hsn_code: "1001",
          quantity: 1,
          unit_of_product: "BOX",
          cgst_rate: 6,
          sgst_rate: 6,
          igst_rate: 0,
          cess_rate: 0,
          cessNonAdvol: 0,
          taxable_amount: 100,
        },
        {
          product_name: "Wheat",
          product_description: "Wheat",
          hsn_code: "1001",
          quantity: 1,
          unit_of_product: "BOX",
          cgst_rate: 6,
          sgst_rate: 6,
          igst_rate: 0,
          cess_rate: 0,
          cessNonAdvol: 0,
          taxable_amount: 100,
        },
      ],
    });

    let token = await masterindia.authForIrn();
    token = token.token;
    // console.log("token:=", token);
    const ewaybillResponse = await masterindia.generateEwayBill(
      jsonData,
      token
    );
    return res.status(200)
      .json({
        error: false,
        message: "Eway Bill generated successfully",
        data: ewaybillResponse,
      })
      .end();
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: true, message: error.message });
  }
};

//getting items from asns
const getLineItems = async (req, res) => {
  try {
    const { asnNo } = req.body;

    const getLineItems = await knex("asns")
      .where({ asnNo: asnNo })
      .select("lineItems");
    console.log("log", getLineItems);

    const newLineItems = JSON.parse(getLineItems[0].lineItems);
    if (getLineItems.length <= 0) {
      return res.status(404).json({
        error: true,
        message: "No items found for given asnNo",
      });
    }
    return res.status(200).json({
      error: false,
      message: "Data retrived successfully",
      data: newLineItems,
    });
  } catch (error) {
    return res.status(500)
      .json({
        error: true,
        message: "Could not retrive",
      })
      .end();
  }
};

//getting supplier details from supplierdetails
const getSupplierDetails = async (req, res) => {
  try {
    const { supplierId } = req.body;
    const getSuppDetails = await knex("supplier_details").where({
      id: supplierId,
    });
    if (!getSuppDetails) {
      return res.status(400).json({
        error: true,
        message: "Unable to get details",
      });
    }
    return res.status(200).json({
      error: false,
      message: "Data retrievd successfully",
      data: getSuppDetails,
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: "Could not retrive record(s)",
    });
  }
};

// for excel exports
const fetchMSME = async (req, res) => {
  console.log("In Fetch Data");
  try {
    const { error, value } = validation.fetchMSME(req.body);
    if (error) {
      return res
        .status(400)
        .json({ error: true, message: error.details[0].message });
    }
    const { sort, order, filter, status, selected_ids } = value;
    let query = knex("validateGST_PAN")
      .select(
        // "supplierId as Supplier ID",
        "supplierName as Supplier Name",
        "sapcode as SAP Code",
        "msmeNO as MSME No",
        "msmeStatus as Status",
        "msmeTime as time",
        "msmeOldStatus as Old Status",
        "msmeOldTime as oldTime"
      )
      .whereNotNull("msmeNO")
      .andWhereNot("msmeNO", "");

    if (filter) {
      const { startDate, endDate, dateField } = filter;
      if (startDate && endDate && dateField) {
        const startDateISO = new Date(startDate).toISOString();
        const endDateISO = new Date(endDate + "T23:59:59.999Z").toISOString();
        query.whereBetween(dateField, [startDateISO, endDateISO]);
      }
    }
    if (status) {
      query.where("msmeStatus", status);
    }
    {
    }
    if (selected_ids.length > 0) {
      query.whereIn("id", selected_ids);
    }
    let data = await query.orderBy(sort, order);

    if (data.length == 0)
      // return res.json({
      //   error: true,
      //   message: "No data found in validateGST_PAN",
      // });
      throw Error("No data found in validateGST_PAN");

    let data_rows = [];
    if (order === "asc") {
      data.forEach((row) => {
        delete row.supplierId;
        data_rows.push(row);
      });
    } else {
      data.forEach((row) => {
        delete row.supplierId;
        data_rows.push(row);
      });
    }

    // Step 2: Format 'oldTime' property using moment.js
    data_rows.forEach(async (element, index) => {
      data_rows[index]["Time"] = moment(element.time).format(
        "YYYY-MM-DD HH:mm:ss"
      );
      data_rows[index]["Old Time"] = element.oldTime
        ? moment(element.oldTime).format("YYYY-MM-DD HH:mm:ss")
        : null;
      delete data_rows[index].oldTime;
      delete data_rows[index].time;
    });
    return data_rows;
    // return res.json({
    //   error: false,
    //   message: "Data fetched successfully",
    //   data_rows,
    // });
  } catch (error) {
    throw error;
  }
};

const fetchGST = async (req, res) => {
  console.log("In Fetch Data");
  try {
    const { error, value } = validation.fetchGST(req.body);
    if (error) {
      return res
        .status(400)
        .json({ error: true, message: error.details[0].message });
    }
    const { sort, order, filter, status, selected_ids } = value;

    let query = knex("validateGST_PAN")
      .select(
        "supplierName as Supplier Name",
        "sapcode AS SAP Code",
        "gst AS GST No",
        "gstStatus as Status",
        "gstTime as time",
        "gstOldStatus as Old Status",
        "gstOldTime as oldTime"
      )
      .whereNotNull("gst")
      .andWhereNot("gst", "");

    if (filter) {
      const { startDate, endDate, dateField } = filter;
      if (startDate && endDate && dateField) {
        const startDateISO = new Date(startDate).toISOString();
        const endDateISO = new Date(endDate + "T23:59:59.999Z").toISOString();
        query.whereBetween(dateField, [startDateISO, endDateISO]);
      }
    }
    if (status) {
      query.where("gstStatus", status);
    }
    {
    }
    if (selected_ids.length > 0) {
      query.whereIn("id", selected_ids);
    }

    let data = await query.orderBy(sort, order);

    if (data.length == 0)
      // return res.json({
      //   error: true,
      //   message: "No data found in validateGST_PAN",
      // });
      throw Error("No data found in validateGST_PAN");

    let data_rows = [];
    if (order === "asc") {
      data.forEach((row) => {
        delete row.supplierId;
        data_rows.push(row);
      });
    } else {
      data.forEach((row) => {
        delete row.supplierId;
        data_rows.push(row);
      });
    }

    // Step 2: Format 'oldTime' property using moment.js
    data_rows.forEach(async (element, index) => {
      data_rows[index]["Time"] = moment(element.time).format(
        "YYYY-MM-DD HH:mm:ss"
      );
      data_rows[index]["Old Time"] = element.oldTime
        ? moment(element.oldTime).format("YYYY-MM-DD HH:mm:ss")
        : null;
      delete data_rows[index].oldTime;
      delete data_rows[index].time;
    });
    return data_rows;
    // return res.json({
    //   error: false,
    //   message: "Data fetched successfully",
    //   data_rows,
    // });
  } catch (error) {
    throw error;
  }
};

const fetchPAN = async (req, res) => {
  console.log("In Fetch Data");
  try {
    const { error, value } = validation.fetchPAN(req.body);
    if (error) {
      return res
        .status(400)
        .json({ error: true, message: error.details[0].message });
    }
    const { sort, order, filter, status, selected_ids } = value;

    let query = knex("validateGST_PAN")
      .select(
        "supplierName as Supplier Name",
        "sapcode AS SAP Code",
        "pan AS Pan No",
        "panStatus AS Pan Status",
        "panTime as time",
        "panOldStatus as Old Status",
        "panOldTime as oldTime"
      )
      .whereNotNull("pan");

    if (filter) {
      const { startDate, endDate, dateField } = filter;
      if (startDate && endDate && dateField) {
        const startDateISO = new Date(startDate).toISOString();
        const endDateISO = new Date(endDate + "T23:59:59.999Z").toISOString();
        query.whereBetween(dateField, [startDateISO, endDateISO]);
      }
    }
    if (status) {
      query.where("panStatus", status);
    }
    {
    }
    if (selected_ids.length > 0) {
      query.whereIn("id", selected_ids);
    }

    let data = await query.orderBy(sort, order);

    if (data.length == 0)
      // return res.json({
      //   error: true,
      //   message: "No data found in validateGST_PAN",
      // });
      throw Error("No data found in validateGST_PAN");

    let data_rows = [];
    if (order === "asc") {
      data.forEach((row) => {
        delete row.supplierId;
        data_rows.push(row);
      });
    } else {
      data.forEach((row) => {
        delete row.supplierId;
        data_rows.push(row);
      });
    }

    // Step 2: Format 'oldTime' property using moment.js
    data_rows.forEach(async (element, index) => {
      data_rows[index]["Time"] = moment(element.time).format(
        "YYYY-MM-DD HH:mm:ss"
      );
      data_rows[index]["Old Time"] = element.oldTime
        ? moment(element.oldTime).format("YYYY-MM-DD HH:mm:ss")
        : null;
      delete data_rows[index].oldTime;
      delete data_rows[index].time;
    });
    return data_rows;
    // return res.json({
    //   error: false,
    //   message: "Data fetched successfully",
    //   data_rows,
    // });
  } catch (error) {
    throw error;
  }
};

const excelExport = async (req, res) => {
  try {
    console.log(`Route path: ${req.path}`);
    let data = "";
    let fileName = "";
    if (req.path == "/msme/excelExport") {
      fileName = "MSMEList";
      data = await fetchMSME(req);
    }
    if (req.path == "/gst/excelExport") {
      fileName = "GSTList";
      data = await fetchGST(req);
    }
    if (req.path == "/pan/excelExport") {
      fileName = "PANList";
      data = await fetchPAN(req);
    }

    const filePath = await fun.generateUniqueFilePath(`${fileName}.xlsx`);
    const excelContent = await Export.generateExcelContent(data);

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${path.basename(filePath)}"`
    );
    res.send(excelContent);
    console.log(`Data exported successfully.`);
  } catch (error) {
    console.error("Error exporting data:", error);
    res.status(500).json({
      error: true,
      message: "Could not export files",
      data: error.message,
    });
  }
};

// delete all
const deleteMultipleRecordsGST = async (req, res) => {
  try {
    const tableName = "validateGST_PAN";
    const { ids } = req.body;
    let idsToDelete = [];
    const select = await knex(tableName)
      .select("supplierId", "id")
      .whereIn("id", ids);

    if (select.length > 0) {
      const val = select.map((record) => record.supplierId);

      const existingGstRecords = await knex("supplier_details").whereIn(
        "id",
        val
      );

      const existingValues = existingGstRecords.map((record) => record.id);
      idsToDelete = select
        .filter((record) => !existingValues.includes(record.supplierId))
        .map((record) => String(record.id));
    }
    if (idsToDelete.length === 0) {
      return res.status(500).json({
        error: true,
        message: "Cannot delete GST compliance for registered suppliers.",
        data: [],
      });
    }
    const result = await functions.bulkDeleteRecords(
      tableName,
      idsToDelete,
      req
    );

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
      data: JSON.stringify(error.message),
    });
  }
};

const deleteMultipleRecordsPan = async (req, res) => {
  try {
    const tableName = "validateGST_PAN";
    const { ids } = req.body;
    let idsToDelete = [];
    const select = await knex(tableName)
      .select("supplierId", "id")
      .whereIn("id", ids);

    if (select.length > 0) {
      const val = select.map((record) => record.supplierId);

      const existingGstRecords = await knex("supplier_details").whereIn(
        "id",
        val
      );

      const existingValues = existingGstRecords.map((record) => record.id);
      idsToDelete = select
        .filter((record) => !existingValues.includes(record.supplierId))
        .map((record) => String(record.id));
    }
    if (idsToDelete.length === 0) {
      return res.status(500).json({
        error: true,
        message: "Cannot delete PAN compliance for registered suppliers.",
        data: [],
      });
    }
    const result = await functions.bulkDeleteRecords(
      tableName,
      idsToDelete,
      req
    );

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
      data: JSON.stringify(error.message),
    });
  }
};

const deleteMultipleRecordsMsme = async (req, res) => {
  try {
    const tableName = "validateGST_PAN";
    const { ids } = req.body;
    let idsToDelete = [];
    const select = await knex(tableName)
      .select("supplierId", "id")
      .whereIn("id", ids);

    if (select.length > 0) {
      const val = select.map((record) => record.supplierId);

      const existingGstRecords = await knex("supplier_details").whereIn(
        "id",
        val
      );

      const existingValues = existingGstRecords.map((record) => record.id);
      idsToDelete = select
        .filter((record) => !existingValues.includes(record.supplierId))
        .map((record) => String(record.id));
    }
    if (idsToDelete.length === 0) {
      return res.status(500).json({
        error: true,
        message: "Cannot delete MSME compliance for registered suppliers.",
        data: [],
      });
    }

    const result = await functions.bulkDeleteRecords(
      tableName,
      idsToDelete,
      req
    );

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
      data: JSON.stringify(error.message),
    });
  }
};

const getEinvoiceData = async(req,res)=>{
  // try {
    const {error,value} = validation.getEinvoiceData(req.body)
    if (error) {
      return res.status(400).json({
        error: true,
        message: error.details[0].message,
        data: error,
      });
    }

    const {gst, irn} = value
    const result = await masterindia.getEinvoice(irn,gst)
    return res.json({
      error:false,
      message:"IRN Data fetched succesfully",
      data:result.data.data
    })


  // } catch (error) {
  //   return res.json({
  //     error: true,
  //     message:'Failed to verify IRN'
  //   })
  // }
}

export default {
  verifyGst,
  verifyPan,
  callPeriodicallyVerifyPan,
  stopPeriodicallyVerifyPan,
  validatePan,
  gstComplianceCheck,
  gstComplianceCheckUpdated,
  addAllRecordsAtOnce,
  getGST,
  getPAN,
  getMsme,
  panComplianceCheck,
  panComplianceCheckUpdated,
  msmeComplianceCheck,
  msmeComplianceCheckUpdated,
  authForIrn,
  generateIrn,
  generateEwayBill,
  getLineItems,
  getSupplierDetails,
  getGstTimeline,
  excelExport,
  fetchMSME,
  deleteMultipleRecordsGST,
  deleteMultipleRecordsPan,
  deleteMultipleRecordsMsme,
  getEinvoiceData,
};
