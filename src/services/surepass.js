import axios from "axios";
import constants from "../helpers/constants.js";
import knex from "../config/mysql_db.js";

async function sendOtpForMsme(regNo, mobNo) {
  try {
    //get api's fixed values from apis table.

    const getApiDetails = await knex("apis")
      .where({
        name: "surepass_send_otp_for_msme",
      })
      .first();

    if(!getApiDetails){
      console.log("api details:",getApiDetails);
      console.log("Surepass API details not found");
      return -1;
    }

    let data = JSON.stringify({
      registration_number: regNo, //"UDYAM-MH-19-0111155",
      mobile_number: mobNo, //"8879290459"
    });

    let config = {
      method: "post",
      maxBodyLength: Infinity,
      //url: "https://sandbox.surepass.io/api/v1/udyam-otp/send-otp",
      url: getApiDetails.url,
      headers: {
        "Content-Type": "application/json",
        Authorization: getApiDetails.authorization,
        //"Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJmcmVzaCI6ZmFsc2UsImlhdCI6MTcxMjgzMDM1NSwianRpIjoiZTdlMzYwODktOTQwZS00NjVhLThhMDgtMDI4MmI5MDBlNDk1IiwidHlwZSI6ImFjY2VzcyIsImlkZW50aXR5IjoiZGV2LmFlb254QHN1cmVwYXNzLmlvIiwibmJmIjoxNzEyODMwMzU1LCJleHAiOjE3MTU0MjIzNTUsInVzZXJfY2xhaW1zIjp7InNjb3BlcyI6WyJ1c2VyIl19fQ.UicwTPvorwucT3-ROZ56TqY5Qwm1D_QkJk3m6E7HUhY",
      },
      data: data,
    };

    const response = await axios.request(config);
    return response.data;
  } catch (error) {
    const myerror = error.response;
    return myerror;
  }
}

async function submitOtpForMsme(clientId, otp) {
  try {
    //get api's fixed values from apis table.

    const getApiDetails = await knex("apis")
      .where({
        name: "surepass_submit_otp_for_msme",
      })
      .first();

    if(!getApiDetails){
      console.log("api details:",getApiDetails);
      console.log("Surepass API details not found");
      return -1;
    }

    let data = JSON.stringify({
      client_id: clientId, //"udyam_otp_kTdztbsrADSNJbGolXFE",
      otp: otp, //"749569"
    });

    let config = {
      method: "post",
      maxBodyLength: Infinity,
      //url: "https://sandbox.surepass.io/api/v1/udyam-otp/submit-otp",
      url: getApiDetails.url,
      headers: {
        "Content-Type": "application/json",
        Authorization: getApiDetails.authorization,
        //"Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJmcmVzaCI6ZmFsc2UsImlhdCI6MTcxMjgzMDM1NSwianRpIjoiZTdlMzYwODktOTQwZS00NjVhLThhMDgtMDI4MmI5MDBlNDk1IiwidHlwZSI6ImFjY2VzcyIsImlkZW50aXR5IjoiZGV2LmFlb254QHN1cmVwYXNzLmlvIiwibmJmIjoxNzEyODMwMzU1LCJleHAiOjE3MTU0MjIzNTUsInVzZXJfY2xhaW1zIjp7InNjb3BlcyI6WyJ1c2VyIl19fQ.UicwTPvorwucT3-ROZ56TqY5Qwm1D_QkJk3m6E7HUhY",
      },
      data: data,
    };

    const response = await axios.request(config);
    return response.data;
  } catch (error) {
    //throw error;
    const myerror = error.response;
    return myerror;
  }
}

async function getMsmeDetails(msmeNo) {

  try {
    //get api's fixed values from apis table.
    
    const getApiDetails = await knex("apis")
    .where({
      name: "surepass_get_msme_details",
    })
    .first();
    
    if (!getApiDetails) {
      console.log("getApiDetails",getApiDetails);
      console.log("Surepass msme details are not found in database.")
      return -1;
    }

    let data = JSON.stringify({
      id_number: msmeNo, //"UDYAM-MH-19-0111155"
    });

    let config = {
      method: "post",
      maxBodyLength: Infinity,
      //url: "https://sandbox.surepass.io/api/v1/corporate/udyog-aadhaar",
      url: getApiDetails.url,
      headers: {
        "Content-Type": "application/json",
        Authorization: getApiDetails.authorization,
        //"Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJmcmVzaCI6ZmFsc2UsImlhdCI6MTcxMjgzMDM1NSwianRpIjoiZTdlMzYwODktOTQwZS00NjVhLThhMDgtMDI4MmI5MDBlNDk1IiwidHlwZSI6ImFjY2VzcyIsImlkZW50aXR5IjoiZGV2LmFlb254QHN1cmVwYXNzLmlvIiwibmJmIjoxNzEyODMwMzU1LCJleHAiOjE3MTU0MjIzNTUsInVzZXJfY2xhaW1zIjp7InNjb3BlcyI6WyJ1c2VyIl19fQ.UicwTPvorwucT3-ROZ56TqY5Qwm1D_QkJk3m6E7HUhY",
      },
      data: data,
    };
    // console.log("here : I am");
    const response = await axios.request(config);
    // console.log("msme data retrived:", response.data);
    return response.data;
  } catch (error) {
    const myerror = error.response;
    // console.log("myerror",myerror);
    return myerror;
  }
}

async function verifyBankAc(bankAcNo,ifscCode){ 
  try {

    const getApiDetails = await knex("apis")
    .where({
      name: "surepass_get_bank_details",
    })
    .first();
    
    if(!getApiDetails){
      console.log("api details:",getApiDetails);
      console.log("Surepass API details not found");
      return -1;
    }

    let data = JSON.stringify({
      "id_number": bankAcNo,
      "ifsc": ifscCode,
      "ifsc_details": true
    });

    let config = {
      method: 'post',
      maxBodyLength: Infinity,
      url: getApiDetails.url,
      // url: 'https://kyc-api.surepass.io/api/v1/bank-verification/',
      headers: { 
        'Content-Type': 'application/json', 
        'Authorization': getApiDetails.authorization,
        // 'Authorization': 'Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJmcmVzaCI6ZmFsc2UsImlhdCI6MTcxNjgwNzY1NywianRpIjoiMzhjYTZjMzYtMWYxNy00YzQwLTljZTktZWJiODM5OWEyZjMyIiwidHlwZSI6ImFjY2VzcyIsImlkZW50aXR5IjoiZGV2LmFlb254QHN1cmVwYXNzLmlvIiwibmJmIjoxNzE2ODA3NjU3LCJleHAiOjIwMzIxNjc2NTcsImVtYWlsIjoiYWVvbnhAc3VyZXBhc3MuaW8iLCJ0ZW5hbnRfaWQiOiJtYWluIiwidXNlcl9jbGFpbXMiOnsic2NvcGVzIjpbInVzZXIiXX19.4uodyJ0aIZ44ZdFgkxlGo8BxtkTJGSft2WTIb8hl82M'
      },
      data : data
    };

    const response = await axios.request(config);
    return response.data;
  } catch (error) {
    console.log("error:-", error.response);
    const myerror = error.response;
    return 0;
  }
}
export default {
  sendOtpForMsme,
  submitOtpForMsme,
  getMsmeDetails,
  verifyBankAc,
};
