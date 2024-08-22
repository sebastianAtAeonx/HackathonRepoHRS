import sandbox from "../../services/sandbox.js";
import knex from "../../config/mysql_db.js";
import fun from "../../helpers/functions.js";
import constants from "../../helpers/constants.js";
import logApiCalls from "../../helpers/functions.js";
import validation from "../../validation/workflow/sandBoxController.js";

const authenticate2 = async (req, res) => {
  try {
    const replay = await sandbox.authenticate2();
    console.log(replay);
    return res.status(200)
      .json({ error: false, message: "Authenticated", data: replay })
      .end();
  } catch (error) {
    return res.status(500)
      .json({
        error: true,
        message: "Could not authenticate",
        data: { error: JSON.stringify(error) },
      })
      .end();
  }
};

const sendOtpProcess = async (req, res) => {
  try {
    const { error, value } = validation.sendOtp(req.body);
    if (error) {
      return res.status(400).json({ error: true, message: error.details[0].message }).end();
    }

    const { username, gstno } = value;

    //get access token process
    const getAccessToken = await sandbox.authenticate2();
    const AccessToken = getAccessToken.access_token;
    console.log(AccessToken);
    //send otp process

    const sendOtp = await sandbox.generateOtp(gstno, username, AccessToken);
    if (sendOtp.code == 200) {
      return res.status(200)
        .json({
          error: false,
          message: "OTP sent",
          data: sendOtp,
        })
        .end();
    } else {
      return res.status(500)
        .json({
          error: true,
          message: "OTP not sent",
          data: sendOtp,
        })
        .end();
    }
  } catch (error) {
    console.error(
      "Error occurred:",
      error.response ? error.response.data : error.message
    );

    return res.status(500)
      .json({
        error: true,
        message: "Could not send otp",
        data: { error: JSON.stringify(error) },
      })
      .end();
  }
};

const verifyOtpProcess = async (req, res) => {
  try {
    const { error, value } = validation.verifyOtp(req.body);
    if (error) {
      return res.status(400).json({ error: true, message: error.details[0].message }).end();
    }
    const { username, otp, gstno } = value;

    const getAccessToken = await sandbox.authenticate2();
    const AccessToken = getAccessToken.access_token;

    const verifyOtp = await sandbox.verifyOTP(
      gstno,
      username,
      otp,
      AccessToken
    );
    if (verifyOtp.code == 200 && verifyOtp.data.status_cd == 1) {
      return res.status(200)
        .json({ error: false, message: "OTP is Verified", data: verifyOtp })
        .end();
    } else {
      return res.status(500)
        .json({ error: true, message: "OTP is Wrong", data: verifyOtp })
        .end();
    }
  } catch (error) {
    return res.status(500)
      .json({
        error: true,
        message: "Could not verify",
        data: { error: JSON.stringify(error) },
      })
      .end();
  }
};

const generateIRN = async (req, res) => {
  try {
    const { error, value } = validation.generateIRN(req.body);
    if (error) {
      return res.status(400)
        .json({
          error: true,
          message: error.details[0].message,
        })
        .end();
    }
    // Log the API call

    const response = await sandbox.apiforirn(value);
    return res.status(500)
      .json({
        error: response.error,
        data: response.data,
      })
      .end();
  } catch (error) {
    return res.status(500)
      .json({
        error: true,
        message: "Could not generate",
        data: { error: JSON.stringify(error) },
      })
      .end();
  }
};
//direct ewaybill api
const ewaybill = async (req, res) => {
  try {
    const accesstoken = req.headers.accesstoken;

    if (!accesstoken) {
      return res.status(400)
        .json({ error: true, message: "Access token is required" })
        .end();
    }
    const { error, value } = validation.ewayBill(req.body);
    if (error) {
      return res.status(400)
        .json({
          error: true,
          message: error.details[0].message,
        })
        .end();
    }

    const {
      supplyType,
      subSupplyType,
      subSupplyDesc,
      docType,
      docNo,
      docDate,
      fromGstin,
      fromTrdName,
      fromAddr1,
      fromAddr2,
      fromPlace,
      fromPincode,
      actFromStateCode,
      fromStateCode,
      toGstin,
      toTrdName,
      toAddr1,
      toAddr2,
      toPlace,
      toPincode,
      actToStateCode,
      toStateCode,
      transactionType,
      otherValue,
      totalValue,
      cgstValue,
      sgstValue,
      igstValue,
      cessValue,
      cessNonAdvolValue,
      totInvValue,
      transporterId,
      transporterName,
      transDocNo,
      transMode,
      transDistance,
      transDocDate,
      vehicleNo,
      vehicleType,
      itemList,
    } = value;

    const requestData = {
      supplyType,
      subSupplyType,
      subSupplyDesc,
      docType,
      docNo,
      docDate,
      fromGstin,
      fromTrdName,
      fromAddr1,
      fromAddr2,
      fromPlace,
      fromPincode,
      actFromStateCode,
      fromStateCode,
      toGstin,
      toTrdName,
      toAddr1,
      toAddr2,
      toPlace,
      toPincode,
      actToStateCode,
      toStateCode,
      transactionType,
      otherValue,
      totalValue,
      cgstValue,
      sgstValue,
      igstValue,
      cessValue,
      cessNonAdvolValue,
      totInvValue,
      transporterId,
      transporterName,
      transDocNo,
      transMode,
      transDistance,
      transDocDate,
      vehicleNo,
      vehicleType,
      itemList,
    };

    const getSandBoxKeys = await knex("apis").where("name", "sandBox").first();

    if (getSandBoxKeys == undefined) {
      return res.status(404)
        .json({ error: true, message: "3rd party api credentials not found" })
        .end();
    }

    const requestHeaders = {
      Authorization: accesstoken,
      // "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzUxMiJ9.eyJzdWIiOiIyNEFBSkNBODY2M1IxWlYiLCJhdWQiOiJBUEkiLCJhcGlfa2V5Ijoia2V5X2xpdmVfZnFZYzlVemMyckQwY1VGN3UzOURiWmlhQUZMNTBPSmciLCJpc3MiOiJnc3AuZ3N0LnNhbmRib3guY28uaW4iLCJzb3VyY2UiOiJ0ZXJ0aWFyeSIsImV4cCI6MTcwNjk1ODIxNywiaWF0IjoxNzA2OTM2Njc3LCJpbnRlbnQiOiJBQ0NFU1NfVE9LRU4iLCJlbWFpbCI6ImRlZXBha0BhZW9ueC5kaWdpdGFsIn0.mgHoon3oEHEOFqNuFe1BUKTZ70d_CUSDfVyE9mlArR5jpvTmIk2z7nOcDAI2joASPXf1XMz_Dfs3OVow4GT2Sg",
      accept: "application/json",
      "content-type": "application/json",
      "x-api-key": getSandBoxKeys.apiKey,
      "x-api-version": getSandBoxKeys.apiVersion,
    };
    const result = await sandbox.ewaybill(requestData, requestHeaders);
    if (result.code != 200) {
      return res.status(500)
        .json({ error: true, message: "Error:" + result.message, data: result })
        .end();
    }
    return res.status(200)
      .json({
        error: false,
        message: "E-way Bill generated successfully",
        data: result,
      })
      .end();
  } catch (error) {
    return res.status(500)
      .json({
        error: true,
        message: "Could not generate.",
      })
      .end();
  }
};
//make ewaybill using irn
const makeEwayBill = async (req, res) => {
  try {
    const accesstoken = req.headers.accesstoken;

    if (!accesstoken) {
      return res.status(400)
        .json({ error: true, message: "Access token is required" })
        .end();
    }

    const { error, value } = validation.makeEwayBill(req.body);

    if (error) {
      console.error("Validation Error:", error.details[0].message);
    }

    const {
      Irn,
      Distance,
      TransMode,
      TransId,
      TransName,
      TransDocDt,
      TransDocNo,
      VehNo,
      VehType,
      ExpShipDtls,
      DispDtls,
    } = value;

    const sandBoxKey = await knex("apis").where("name", "sandBox").first();

    const headers = {
      Authorization: accesstoken,
      //"eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzUxMiJ9.eyJzdWIiOiIyNEFBSkNBODY2M1IxWlYiLCJhdWQiOiJBUEkiLCJhcGlfa2V5Ijoia2V5X2xpdmVfZnFZYzlVemMyckQwY1VGN3UzOURiWmlhQUZMNTBPSmciLCJpc3MiOiJnc3AuZ3N0LnNhbmRib3guY28uaW4iLCJzb3VyY2UiOiJ0ZXJ0aWFyeSIsImV4cCI6MTcwNjk1ODIxNywiaWF0IjoxNzA2OTM2Njc3LCJpbnRlbnQiOiJBQ0NFU1NfVE9LRU4iLCJlbWFpbCI6ImRlZXBha0BhZW9ueC5kaWdpdGFsIn0.mgHoon3oEHEOFqNuFe1BUKTZ70d_CUSDfVyE9mlArR5jpvTmIk2z7nOcDAI2joASPXf1XMz_Dfs3OVow4GT2Sg",
      accept: "application/json",
      "content-type": "application/json",
      "x-api-key": sandBoxKey.apiKey,
      "x-api-version": sandBoxKey.apiVersion,
    };

    const data = {
      Irn,
      Distance,
      TransMode,
      TransId,
      TransName,
      TransDocDt,
      TransDocNo,
      VehNo,
      VehType,
      ExpShipDtls,
      DispDtls,
    };

    const result = await sandbox.makeEWayBillRequest(data, headers);
    if (result.code != 200) {
      return res.status(500)
        .json({ error: true, message: "Error:" + result.message, data: result })
        .end();
    }
    return res.status(200)
      .json({
        error: false,
        message: "Ewaybill generated successfully",
        data: result,
      })
      .end();
  } catch (error) {
    return res.status(500)
      .json({
        error: true,
        message: "Could not make",
      })
      .end();
  }
};

const eWayAuthentication = async (req, res) => {
  try {
    const data = await sandbox.eWayAuthentication();
    return res.status(200).json({error:false,message:"Authenticated", data}).end();
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error:true, message: "Could not authenticate" }).end();
  }
};

const refreshToken = async (req, res) => {
  try {
    const { error, value } = validation.refreshToken(req.body);

    if (error) {
      return res.status(400).json({ error: true, message: error.details[0].message }).end();
    }

    const { gstno } = value;

    const currentToken = await knex("taxpayer_credentials")
      .where("gstno", gstno)
      .select("access_token")
      .first();

    if (!currentToken) {
      return res.status(500).json({ error: true, message: "No token found" }).end();
    }

    console.log("currentToken:=", currentToken);

    const data = await sandbox.refreshToken(gstno, currentToken);
    console.log("resis:=", data);
    if (data.code != 200) {
      return res.status(500)
        .json({ error: true, message: "Error:" + data.message, data: data })
        .end();
    }

    return res.status(200).json({error:false, message:"Retrived successfully", data}).end();
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error:true, message: "Could not retrive" }).end();
  }
};

const panValidate = async (req, res) => {
  try {
    const { error, value } = validation.panValidate(req.body);
    if (error) {
      return res.status(400).json({ error: true, message: error.details[0].message }).end();
    }

    const { pan } = value;
    const getAccessToken = await sandbox.authenticate2();
    console.log(getAccessToken);
    const validatePan = await sandbox.validatePan(
      pan,
      getAccessToken.access_token
    );

    if (validatePan != "error") {
      return res.status(200).json({ error: false, data: validatePan }).end();
    } else {
      return res.status(500).json({ error: true, message: "Could not verify" }).end();
    }
  } catch (error) {
    return res.status(500)
      .json({
        error: true,
        message: "Could not verify",
        data: error.message,
      })
      .end();
  }
};

const verifyBankAc = async (req, res) => {
  try {
    const { error, value } = validation.verifyBankAc(req.body);
    if (error) {
      return res.status(400).json({ error: true, message: error.details[0].message }).end();
    }
    const { bankAcNo, ifsc } = value;

    const getAccessToken = await sandbox.authenticate2();
    const verifyBankAc = await sandbox.verifyBankAccount(
      ifsc,
      bankAcNo,
      getAccessToken.access_token
    );
    if (verifyBankAc != "error") {
      return res.status(200).json({ error: false, data: verifyBankAc }).end();
    } else {
      return res.status(500).json({ error: true, message: "Could not verify" }).end();
    }
  } catch (error) {
    return res.status(500)
      .json({
        error: true,
        message: "Could not verify",
        data: error.message,
      })
      .end();
  }
};

const verifyGst = async (req, res) => {
  try {
    const { error, value } = validation.verifyGst(req.body);
    if (error) {
      return res.status(400).json({ error: true, message: error.details[0].message }).end();
    }
    const { gstno } = value;

    const getAccessToken = await sandbox.authenticate2();
    const verifyGst = await sandbox.verifyGSTIN(
      gstno,
      getAccessToken.access_token
    );
    if (verifyGst != "error") {
      return res.status(200).json({ error: false, data: verifyGst }).end();
    } else {
      return res.status(500).json({ error: true, message: "Could not verify" }).end();
    }
  } catch (error) {
    return res.status(500)
      .json({
        error: true,
        message: "Could not verify",
        data: error.message,
      })
      .end();
  }
};

const verifySuppliersGst = async (req, res) => {
  try {
    const getSuppliersGst = await knex("supplier_details").select(
      "id",
      "supplier_name",
      "gstNo"
    );
    if (getSuppliersGst.length <= 0) {
      return res.status(404).json({ error: true, message: "No suppliers found" }).end();
    }
    let validgst = 0;
    let invalidgst = 0;
    let nogst = 0;
    const validSupplierList = [];
    const invalidSupplierList = [];
    const noGstNo = [];
    const getAccessToken = await sandbox.authenticate2();
    for (const iterator of getSuppliersGst) {
      if (iterator.gstNo == "") {
        iterator.sr = nogst + 1;
        noGstNo.push(iterator);
        nogst++;
      }
      const verifyGst = await sandbox.verifyGSTIN(
        iterator.gstNo,
        getAccessToken.access_token
      );
      if (verifyGst != "error") {
        if (verifyGst.data.sts == "Active") {
          iterator.sr = validgst + 1;
          validSupplierList.push(iterator);
          validgst++;
        } else {
          iterator.sr = invalidgst + 1;
          invalidSupplierList.push(iterator);
          invalidgst++;
        }
      }
    }
    const data = {
      validGstSupplierList: validSupplierList,
      invalidGstSupplierList: invalidSupplierList,
      recordWithNoGstNo: noGstNo,
    };
    return res.status(200)
      .json({
        error: false,
        data: data,
        total: getSuppliersGst.length,
        valid: validgst,
        invalid: invalidgst,
        recordWithNoGstNo: noGstNo.length,
      })
      .end();
  } catch (error) {
    return res.status(500)
      .json({
        error: true,
        message: "Could not verify",
        data: error.message,
      })
      .end();
  }
};

const verifySuppliersPan = async (req, res) => {
  try {
    const getSuppliersPan = await knex("supplier_details").select(
      "id",
      "supplier_name",
      "panNo"
    );
    if (getSuppliersPan.length <= 0) {
      return res.status(404).json({ error: true, message: "No suppliers found" }).end();
    }

    const validPanSuppliers = [];
    const invalidPanSuppliers = [];

    let validPan = 0;
    let invalidPan = 0;

    const getAccessToken = await sandbox.authenticate2();
    for (const iterator of getSuppliersPan) {
      const validatePan = await sandbox.validatePan(
        iterator.panNo,
        getAccessToken.access_token
      );
      if (validatePan != "error") {
        if (validatePan.data.status == "VALID") {
          iterator.sr = validPan + 1;
          validPanSuppliers.push(iterator);
          validPan++;
        } else {
          iterator.sr = invalidPan + 1;
          invalidPanSuppliers.push(iterator);
          invalidPan++;
        }
      } else {
        //some code may be required here...
      }
    }

    const data = {
      validPanSuppliers: validPanSuppliers,
      invalidPanSuppliers: invalidPanSuppliers,
      total: getSuppliersPan.length,
      validPan: validPan,
      invalidPan: invalidPan,
    };

    return res.status(200).json({ error: false, data: data }).end();
  } catch (error) {
    return res.status(500)
      .json({
        error: true,
        message: "Could not verified",
        data: error.message,
      })
      .end();
  }
};

function callmyfunction() {
  console.log("testing...");
}

let intervalId; // Variable to store the interval ID

const callPeriodicallyVerifyPan = async (req, res) => {
  // Call the function immediately
  callmyfunction();

  // Call the function every 2 seconds (2000 milliseconds)
  // for 10 days give: 10 * 24 * 60 * 60 * 1000;
  intervalId = setInterval(callmyfunction, 2000);

  return res.status(200)
    .json({ error: false, message: "Periodic execution started." })
    .end();
};

// Function to stop the periodic execution
const stopPeriodicExecution = (req, res) => {
  clearInterval(intervalId); // Clear the interval using the interval ID
  console.log("Periodic execution stopped.");
  return res.status(200)
    .json({ error: false, message: "Periodic execution stopped." })
    .end();
};

// Example of how to stop the periodic execution after a certain time (e.g., 10 seconds)
//setTimeout(stopPeriodicExecution, 10000); // Stop after 10 seconds

const verifyMsme = async (req, res) => {
  const { error, value } = validation.verifyMsme(req.body);
  if (error) {
    return res.status(400).json({ error: true, message: error.details[0].message }).end();
  }
  // Log the API call
  await logApiCalls.logAPICalls(
    "sandBoxController-verifyMsme",
    req.originalUrl,
    "Sandbox"
  );

  const { msmeNo } = value;

  const result = await sandbox.verifyMsme(msmeNo);

  // return res.json({ error: false, message: result }).end();

  if (result.code == "ERR_BAD_REQUEST") {
    return res.status(500)
      .json({ error: true, message: result.message, data: result })
      .end();
  } else if (result.code == "ERR_BAD_RESPONSE") {
    return res.status(500)
      .json({ error: true, message: result.message, data: result })
      .end();
  } else if (result.code == "5041") {
    return res.status(500)
      .json({ error: true, message: result.message, data: result })
      .end();
  } else {
    return res.status(200)
      .json({
        error: false,
        message: result,
        data: result.classifications[0].type,
      })
      .end();
  }
};

const verifyBankAcc = async (req, res) => {
  try {
    const { error, value } = validation.verifyBankAcc(req.body);
    if (error) {
      return res.status(400).json({ error: true, message: error.details[0].message }).end();
    }
    // Log the API call
    const { acc, ifsc } = value;

    const result = await sandbox.verifyBankAcc(acc, ifsc);
    console.log("this is result", result);
    if (result.code == "ERR_BAD_REQUEST") {
      return res.status(500)
        .json({ error: true, message: result.message, data: result })
        .end();
    } else if (result.code == "ERR_BAD_RESPONSE") {
      return res.status(500)
        .json({ error: true, message: "Please try again...", data: result })
        .end();
    }
    return res.status(200).json({ error: false, message: result }).end();
  } catch (error) {
    return res.status(500).json({
      erro: true,
      message: "Could not verify",
    });
  }
};

export default {
  authenticate2,
  sendOtpProcess,
  verifyOtpProcess,
  ewaybill,
  generateIRN,
  makeEwayBill,
  eWayAuthentication,
  refreshToken,
  panValidate,
  verifyBankAc,
  verifyGst,
  verifySuppliersGst,
  verifySuppliersPan,
  callPeriodicallyVerifyPan,
  stopPeriodicExecution,
  verifyMsme,
  verifyBankAcc,
};
