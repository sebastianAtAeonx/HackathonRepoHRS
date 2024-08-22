import axios from "axios";
import constants from "../helpers/constants.js";
import { json } from "express";
import knex from "../config/mysql_db.js";

const apiforirn = async (data) => {
  const irnKyes = await knex("apis").where("name", "sandbox-irn").first();

  if (irnKyes == undefined) {
    console.log("3rd Party API(sandbox-irn) values not found");
    return "3rd Party API(sandbox-irn) values not found";
  }

  const options = {
    method: "POST",
    url: irnKyes.url,
    data,
    // data: {
    //   Version: "1.0",
    //   TranDtls: {
    //     TaxSch: "GST",
    //     SupTyp: "B2B",
    //     RegRev: "Y",
    //     EcmGstin: null,
    //     IgstOnIntra: "N",
    //   },
    //   DocDtls: { Typ: "INV", No: "DOC/001", Dt: "18/08/2020" },
    //   SellerDtls: {
    //     Gstin: "37ARZPT4384Q1MT",
    //     LglNm: "NIC company pvt ltd",
    //     TrdNm: "NIC Industries",
    //     Addr1: "5th block, kuvempu layout",
    //     Addr2: "kuvempu layout",
    //     Loc: "GANDHINAGAR",
    //     Pin: 518001,
    //     Stcd: "37",
    //     Ph: "9000000000",
    //     Em: "abc@gmail.com",
    //   },
    //   BuyerDtls: {
    //     Gstin: "29AWGPV7107B1Z1",
    //     LglNm: "XYZ company pvt ltd",
    //     TrdNm: "XYZ Industries",
    //     Pos: "12",
    //     Addr1: "7th block, kuvempu layout",
    //     Addr2: "kuvempu layout",
    //     Loc: "GANDHINAGAR",
    //     Pin: 562160,
    //     Stcd: "29",
    //     Ph: "91111111111",
    //     Em: "xyz@yahoo.com",
    //   },
    //   DispDtls: {
    //     Nm: "ABC company pvt ltd",
    //     Addr1: "7th block, kuvempu layout",
    //     Addr2: "kuvempu layout",
    //     Loc: "Banagalore",
    //     Pin: 562160,
    //     Stcd: "29",
    //   },
    //   ShipDtls: {
    //     Gstin: "29AWGPV7107B1Z1",
    //     LglNm: "CBE company pvt ltd",
    //     TrdNm: "kuvempu layout",
    //     Addr1: "7th block, kuvempu layout",
    //     Addr2: "kuvempu layout",
    //     Loc: "Banagalore",
    //     Pin: 562160,
    //     Stcd: "29",
    //   },
    //   ItemList: [
    //     {
    //       SlNo: "1",
    //       PrdDesc: "Rice",
    //       IsServc: "N",
    //       HsnCd: "1001",
    //       Barcde: "123456",
    //       Qty: 100.345,
    //       FreeQty: 10,
    //       Unit: "BAG",
    //       UnitPrice: 99.545,
    //       TotAmt: 9988.84,
    //       Discount: 10,
    //       PreTaxVal: 1,
    //       AssAmt: 9978.84,
    //       GstRt: 12,
    //       IgstAmt: 1197.46,
    //       CgstAmt: 0,
    //       SgstAmt: 0,
    //       CesRt: 5,
    //       CesAmt: 498.94,
    //       CesNonAdvlAmt: 10,
    //       StateCesRt: 12,
    //       StateCesAmt: 1197.46,
    //       StateCesNonAdvlAmt: 5,
    //       OthChrg: 10,
    //       TotItemVal: 12897.7,
    //       OrdLineRef: "3256",
    //       OrgCntry: "AG",
    //       PrdSlNo: "12345",
    //       BchDtls: { Nm: "123456", ExpDt: "01/08/2020", WrDt: "01/09/2020" },
    //       AttribDtls: [{ Nm: "Rice", Val: "10000" }],
    //     },
    //   ],
    //   ValDtls: {
    //     AssVal: 9978.84,
    //     CgstVal: 0,
    //     SgstVal: 0,
    //     IgstVal: 1197.46,
    //     CesVal: 508.94,
    //     StCesVal: 1202.46,
    //     Discount: 10,
    //     OthChrg: 20,
    //     RndOffAmt: 0.3,
    //     TotInvVal: 12908,
    //     TotInvValFc: 12897.7,
    //   },
    //   PayDtls: {
    //     Nm: "ABCDE",
    //     AccDet: "5697389713210",
    //     Mode: "Cash",
    //     FinInsBr: "SBIN11000",
    //     PayTerm: "100",
    //     PayInstr: "Gift",
    //     CrTrn: "test",
    //     DirDr: "test",
    //     CrDay: 100,
    //     PaidAmt: 10000,
    //     PaymtDue: 5000,
    //   },
    //   RefDtls: {
    //     InvRm: "TEST",
    //     DocPerdDtls: { InvStDt: "01/08/2020", InvEndDt: "01/09/2020" },
    //     PrecDocDtls: [
    //       { InvNo: "DOC/002", InvDt: "01/08/2020", OthRefNo: "123456" },
    //     ],
    //     ContrDtls: [
    //       {
    //         RecAdvRefr: "Doc/003",
    //         RecAdvDt: "01/08/2020",
    //         TendRefr: "Abc001",
    //         ContrRefr: "Co123",
    //         ExtRefr: "Yo456",
    //         ProjRefr: "Doc-456",
    //         PORefr: "Doc-789",
    //         PORefDt: "01/08/2020",
    //       },
    //     ],
    //   },
    //   AddlDocDtls: [
    //     {
    //       Url: "https://einv-apisandbox.nic.in",
    //       Docs: "Test Doc",
    //       Info: "Document Test",
    //     },
    //   ],
    //   ExpDtls: {
    //     ShipBNo: "A-248",
    //     ShipBDt: "01/08/2020",
    //     Port: "INABG1",
    //     RefClm: "N",
    //     ForCur: "AED",
    //     CntCode: "AE",
    //     ExpDuty: null,
    //   },
    //   EwbDtls: {
    //     TransId: "12AWGPV7107B1Z1",
    //     TransName: "XYZ EXPORTS",
    //     Distance: 100,
    //     TransDocNo: "DOC01",
    //     TransDocDt: "18/08/2020",
    //     VehNo: "ka123456",
    //     VehType: "R",
    //     TransMode: "1",
    //   },
    // },

    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: irnKyes.Authorization,
      "x-api-key": irnKyes.apiKey,
      "x-api-version": irnKyes.apiVersion,
    },
  };

  const response = await axios
    .request(options)
    .then(function (response) {
      return {
        error: false,
        data: response.data,
      };
    })
    .catch(function (error) {
      return {
        error: true,
        data: error.response.data,
      };
    });
  return response;
  // const requestData = {
  //   gstin: "22AAAAA0000A1Z5",
  //   fp: "07-2023",
  //   taxable_value: 10000,
  //   cess_amount: 200,
  //   sgst_amount: 500,
  //   cgst_amount: 500,
  //   igst_amount: 1000,
  //   invoice_type: "B2B",
  //   seller: {
  //     legal_name: "Seller Legal Name",
  //     trade_name: "Seller Trade Name",
  //     gstin: "22AAAAA0000A1Z5",
  //     state_code: "27",
  //     address: "Seller Address"
  //   },
  //   buyer: {
  //     legal_name: "Buyer Legal Name",
  //     trade_name: "Buyer Trade Name",
  //     gstin: "33BBBBB1111B1Z6",
  //     state_code: "27",
  //     address: "Buyer Address"
  //   },
  //   item_list: [
  //     {
  //       item_serial_number: 1,
  //       description: "Sample Item",
  //       unit_price: 100,
  //       quantity: 10,
  //       cess_rate: 2,
  //       sgst_rate: 5,
  //       cgst_rate: 5,
  //       igst_rate: 10,
  //       hsn_code: "HSN Code",
  //       item_total_value: 1000
  //     }
  //   ]
  // };

  // const authorizationToken = "Bearer eyJhbGciOiJIUzUxMiJ9.eyJhdWQiOiJBUEkiLCJyZWZyZXNoX3Rva2VuIjoiZXlKaGJHY2lPaUpJVXpVeE1pSjkuZXlKaGRXUWlPaUpCVUVraUxDSnpkV0lpT2lKa1pXVndZV3RBWVdWdmJuZ3VaR2xuYVhSaGJDSXNJbUZ3YVY5clpYa2lPaUpyWlhsZmJHbDJaVjltY1Zsak9WVjZZekp5UkRCalZVWTNkVE01UkdKYWFXRkJSa3cxTUU5S1p5SXNJbWx6Y3lJNkltRndhUzV6WVc1a1ltOTRMbU52TG1sdUlpd2laWGh3SWpveE56TTRORGM1TXpJMUxDSnBiblJsYm5RaU9pSlNSVVpTUlZOSVgxUlBTMFZPSWl3aWFXRjBJam94TnpBMk9EVTJPVEkxZlEubUZTZnlzVXptM185QTRNUVZkUkMtblNhMXVTN09wbFN0UDV3U0V2czFQUkR2R0NnbWtDeTItNktEcDdQUFVwVkxyYUdRRWtrZ3BDakVtaXJBLWVNc3ciLCJzdWIiOiJkZWVwYWtAYWVvbnguZGlnaXRhbCIsImFwaV9rZXkiOiJrZXlfbGl2ZV9mcVljOVV6YzJyRDBjVUY3dTM5RGJaaWFBRkw1ME9KZyIsImlzcyI6ImFwaS5zYW5kYm94LmNvLmluIiwiZXhwIjoxNzA2OTQzMzI1LCJpbnRlbnQiOiJBQ0NFU1NfVE9LRU4iLCJpYXQiOjE3MDY4NTY5MjV9.vJeeH3B4jQkZhkWdWXnSAP9XO9ul8Svp1pmeWXZgA8lQyVrK9bj2cmHC3C2ZJAzH44DOb2SMa6_BfaMP40mV0Q";

  // let config = {
  //   method: "post",
  //   maxBodyLength: Infinity,
  //   url: "https://api.sandbox.co.in/irp/tax-payer/e-invoice",
  //   data: requestData, // Set the request data here
  //   headers: {
  //     Authorization: authorizationToken,
  //     "Content-Type": "application/json",
  //     // Add other headers as needed
  //     "x-api-key": constants.sandBox.xApiKey,
  //     "x-api-version": "1.0"
  //   },
  // };

  // axios
  //   .request(config)
  //   .then((response) => {
  //     console.log("Request successful:");
  //     console.log(JSON.stringify(response.data));
  //     return response.data;
  //   })
  //   .catch((error) => {
  //     console.error("Request failed:");
  //     console.error(error);
  //     return error;
  //   });
};

const authenticate2 = async () => {
  try {
    const authSandBox = await knex("apis")
      .where("name", "sandbox-auth")
      .first();

    if (authSandBox == undefined) {
      console.log("3rd Party API(sandbox-auth) values not found");
      return "3rd Party API(sandbox-auth) values not found";
    }

    const config = {
      method: "post",
      maxBodyLength: Infinity,
      url: "https://api.sandbox.co.in/authenticate",
      headers: {
        accept: "application/json",
        "x-api-key": authSandBox.apiKey,
        "x-api-secret": authSandBox.secretKey,
        "x-api-version": authSandBox.apiVersion,
        Authorization: authSandBox.authorization,
      },
    };

    const response = await axios.request(config);
    return response.data;
  } catch (error) {
    const err = {
      error: true,
      message: error.message,
    };
    return err;
    //throw new Error(`Error during authentication: ${error.message}`);
  }
};

async function generateOtp(gstNo, username, authorizationToken) {
  try {
    const generateOtpKeys = await knex("apis")
      .where("name", "sandbox-otp")
      .first();

    if (generateOtpKeys == undefined) {
      console.log("3rd Party API(sandbox-otp) values not found");
      return "3rd Party API(sandbox-otp) values not found";
    }

    const url = "https://api.sandbox.co.in/gsp/tax-payer/" + gstNo + "/otp";
    const apiKey = generateOtpKeys.apiKey;
    const apiVersion = "1.0";

    const response = await axios.post(url, null, {
      params: { username },
      headers: {
        Authorization: authorizationToken,
        accept: "application/json",
        "content-type": "application/json",
        "x-api-key": generateOtpKeys.apiKey,
        "x-api-version": generateOtpKeys.apiVersion,
      },
    });

    //    const response = await axios(config);
    return response.data;
  } catch (error) {
    console.error("Error:", error.message);
    return error.message;
  }
}

const verifyOTP = async (gstno, username, otp, authorizationToken) => {
  try {
    const sandBoxKeys = await knex("apis").where("name", "sandBox").first();

    if (sandBoxKeys == undefined) {
      console.log("3rd Party API(sandBox) values not found");
      return "3rd Party API(sandBox) values not found";
    }

    const config = {
      method: "post",
      maxBodyLength: Infinity,
      url: `https://api.sandbox.co.in/gsp/tax-payer/${gstno}/otp/verify?username=${username}&otp=${otp}`,
      headers: {
        Authorization: authorizationToken,
        accept: "application/json",
        "content-type": "application/json",
        "x-api-key": sandBoxKeys.apiKey,
        "x-api-version": sandBoxKeys.apiVersion,
      },
    };

    const response = await axios.request(config);
    return response.data;
  } catch (error) {
    const err = {
      error: true,
      message: error.message,
    };
    return err;
    //throw new Error(`Error verifying OTP: ${error.message}`);
  }
};

const authenticateUser = async (gstno) => {
  try {
    const authUserKeys = await knex("apis")
      .where("name", "sandbox-authenticateUser")
      .first();

    if (authUserKeys == undefined) {
      console.log("3rd Party API(sandbox-authenticateUser) values not found");
      return "3rd Party API(sandbox-authenticateUser) values not found";
    }

    const data = JSON.stringify({
      username: authUserKeys.username,
      password: authUserKeys.password,
    });

    const config = {
      method: "post",
      maxBodyLength: Infinity,
      url: authUserKeys.url + gstno,
      headers: {
        Authorization: `${constants.sandBox.Authorization}`,
        accept: "application/json",
        "content-type": "application/json",
        "x-api-key": authUserKeys.apiKey,
        "x-api-version": authUserKeys.apiVersion,
        "x-source": "primary",
      },
      data: data,
    };

    const response = await axios.request(config);
    return response.data;
  } catch (error) {
    const err = {
      error: true,
      message: error.message,
    };
    return err;
    //throw new Error(`Error authenticating user: ${error.message}`);
  }
};

const fetchInvoiceDetails = async () => {
  try {
    const fetchInvoiceKeys = await knex("apis")
      .where("name", "sandbox-fetchInvoice")
      .first();

    if (fetchInvoiceKeys == undefined) {
      console.log("3rd Party API(sandbox-fetchInvoice) values not found");
      return "3rd Party API(sandbox-fetchInvoice) values not found";
    }

    const config = {
      method: "get",
      maxBodyLength: Infinity,
      url: fetchInvoiceKeys.url,
      headers: {
        Authorization: fetchInvoiceKeys.authorization,
        accept: "application/json",
        "x-api-key": fetchInvoiceKeys.apiKey,
        "x-api-version": fetchInvoiceKeys.apiVersion,
      },
    };

    const response = await axios.request(config);
    return response.data;
  } catch (error) {
    const err = {
      error: true,
      message: error.message,
    };
    return err;
    //throw new Error(`Error fetching invoice details: ${error.message}`);
  }
};

const ewaybill = async (requestData, requestHeaders) => {
  const ewayBillKeys = await knex("apis")
    .where("name", "sandbox-ewayBill")
    .first();

  if (ewayBillKeys == undefined) {
    console.log("3rd Party API(sandbox-ewayBill) values not found");
    return "3rd Party API(sandbox-ewayBill) values not found";
  }

  const apiUrl = ewayBillKeys.url;

  // axios
  //   .post(apiUrl, requestData, { headers: requestHeaders })
  //   .then((response) => {
  //     console.log("Response:", response.data);
  //   })
  //   .catch((error) => {
  //     console.error(
  //       "Error:",
  //       error.response ? error.response.data : error.message
  //     );
  //   });

  try {
    const response = await axios.post(apiUrl, requestData, {
      headers: requestHeaders,
    });
    console.log("Response:", response.data);
    return response.data;
  } catch (error) {
    console.error(
      "Error:",
      error.response ? error.response.data : error.message
    );
    return error.response ? error.response.data : error.message;
  }
};

const makeEWayBillRequest = async (requestData, requestHeaders) => {
  const apiUrl =
    "https://api.sandbox.co.in/irp/tax-payer/e-invoice/86cb880253c20a314fcddeb966870db8f272472172faf59c745338014c8767b5/e-way-bill";

  try {
    const response = await axios.post(apiUrl, requestData, {
      headers: requestHeaders,
    });
    console.log("Response:", response.data);
    return response.data;
  } catch (error) {
    console.error(
      "Error:",
      error.response ? error.response.data : error.message
    );
    return error.response ? error.response.data : error.message;
  }
};

const eWayAuthentication = async (gstin) => {
  const ewayAuthKeys = await knex("apis")
    .where("name", "sandbox-ewayAuth")
    .first();

  if (ewayAuthKeys == undefined) {
    console.log("3rd Party API(sandbox-ewayAuth) values not found");
    return "3rd Party API(sandbox-ewayAuth) values not found";
  }

  const options = {
    method: "POST",
    url: ewayAuthKeys.url + gstin,
    headers: {
      accept: "application/json",
      "x-api-version": ewayAuthKeys.apiVersion,
      "content-type": "application/json",
    },
    data: { username: ewayAuthKeys.username, password: ewayAuthKeys.password },
  };

  axios
    .request(options)
    .then(function (response) {
      console.log(response.data);
    })
    .catch(function (error) {
      console.error(error);
    });
};

async function refreshToken(gstin, accesstoken) {
  const sandBoxKeys = await knex("apis").where("name", "sandBox").first();

  if (sandBoxKeys == undefined) {
    console.log("3rd Party API(sandBox) values not found");
    return "3rd Party API(sandBox) values not found";
  }

  const apiUrl =
    "https://api.sandbox.co.in/gsp/tax-payer/" + gstin + "/session/refresh";
  const headers = {
    Authorization: accesstoken,
    accept: "application/json",
    "x-api-key": sandBoxKeys.apiKey,
    "x-api-version": sandBoxKeys.apiVersion,
  };

  try {
    const response = await axios.post(apiUrl, null, { headers });
    console.log("Refresh Token Response:", response.data);
    return response.data;
  } catch (error) {
    console.error(
      "Error refreshing token:",
      error.response ? error.response.data : error.message
    );
    return error;
  }
}

const validatePan = async (pan, accesstoken) => {
  try {
    const sandBoxKeys = await knex("apis").where("name", "sandBox").first();

    if (sandBoxKeys == undefined) {
      console.log("3rd Party API(sandBox) values not found");
      return "3rd Party API(sandBox) values not found";
    }

    const response = await axios.get(
      "https://api.sandbox.co.in/pans/" +
        pan +
        "/verify?consent=y&reason=For%20KYC%20of%20User",
      {
        headers: {
          Authorization: accesstoken,
          accept: "application/json",
          "content-type": "application/json",
          "x-api-key": sandBoxKeys.apiKey,
          "x-api-version": sandBoxKeys.apiVersion,
        },
      }
    );

    return response.data; // Assuming the response is JSON data
  } catch (error) {
    return "error";
  }
};

async function verifyBankAccount(ifsc, accountNo, authorization) {
  try {
    const sandBoxKeys = await knex("apis").where("name", "sandBox").first();

    if (sandBoxKeys == undefined) {
      console.log("3rd Party API(sandBox) values not found");
      return "3rd Party API(sandBox) values not found";
    }

    const url = `https://api.sandbox.co.in/bank/${ifsc}/accounts/${accountNo}/penniless-verify`;
    const response = await axios.get(url, {
      headers: {
        Authorization: authorization,
        accept: "application/json",
        "content-type": "application/json",
        "x-api-key": sandBoxKeys.apiKey,
        "x-api-version": sandBoxKeys.apiVersion,
      },
    });

    return response.data; // Assuming the response is JSON data
  } catch (error) {
    return "error";
  }
}

async function verifyGSTIN(gstin, authorization) {
  try {
    const verifyGstinKeys = await knex("apis")
      .where("name", "sandbox-verifygstin")
      .first();

    if (verifyGstinKeys == undefined) {
      console.log("3rd Party API(sandbox-verifygstin) values not found");
      return "3rd Party API(sandbox-verifygstin) values not found";
    }

    //const url = `https://api.sandbox.co.in/gsp/public/gstin/${gstin}`;
    const url = `${verifyGstinKeys.url}${gstin}`;
    const response = await axios.get(url, {
      headers: {
        Authorization: authorization,
        accept: "application/json",
        "content-type": "application/json",
        "x-api-key": verifyGstinKeys.apiKey,
        "x-api-version": verifyGstinKeys.apiVersion,
      },
    });

    return response.data; // Assuming the response is JSON data
  } catch (error) {
    return "error";
  }
}

const verifyMsme = async (msmeno) => {
  const msmeKey = await knex("apis").where("name", "msmeKey").first();

  if (msmeKey == undefined) {
    console.log("3rd Party API(msmeKey) values not found");
    return "3rd Party API(msmeKey) values not found";
  }

  let data = JSON.stringify({
    reg: msmeno,
  });

  let config = {
    method: "post",
    maxBodyLength: Infinity,
    url: msmeKey.url,
    headers: {
      Authorization: msmeKey.authorization,
      "Content-Type": "application/json",
    },
    data: data,
  };

  return axios
    .request(config)
    .then((response) => {
      console.log(response.data);
      return response.data; // Return data from the promise chain
    })
    .catch((error) => {
      console.log(error);
      return error; // error to propagate it further
    });
};

const verifyBankAcc = async (acc, ifsc) => {
  const bankAccKey = await knex("apis").where("name", "bankAccKey").first();

  if (bankAccKey == undefined) {
    console.log("3rd Party API(bankAccKey) values not found");
    return "3rd Party API(bankAccKey) values not found";
  }

  let data = JSON.stringify({
    acc: acc,
    ifsc: ifsc,
  });

  let config = {
    method: "post",
    maxBodyLength: Infinity,
    url: bankAccKey.url,
    headers: {
      Authorization: bankAccKey.authorization,
      "Content-Type": "application/json",
    },
    data: data,
  };

  return axios
    .request(config)
    .then((response) => {
      return response.data; // Return data from the promise chain
    })
    .catch((error) => {
      return error.response.data; // error to propagate it further
    });
};

export default {
  authenticate2,
  verifyOTP,
  authenticateUser,
  fetchInvoiceDetails,
  ewaybill,
  generateOtp,
  apiforirn,
  makeEWayBillRequest,
  eWayAuthentication,
  refreshToken,
  validatePan,
  verifyBankAccount,
  verifyGSTIN,
  verifyMsme,
  verifyBankAcc,
};
