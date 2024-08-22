import axios from "axios";
import constants from "../helpers/constants.js";
import knex from "../config/mysql_db.js";

const generateAccessToken = async () => {
  const masterIndiaKeys = await knex("apis")
    .where("name", "masterIndiaCreds")
    .first();

  if (masterIndiaKeys == undefined) {
    console.log("3rd Party API(masterIndiaCreds) values not found");
    return "3rd Party API(masterIndiaCreds) values not found";
  }

  let data =
    '{\r\n    "username": "' +
    masterIndiaKeys.username +
    '",\r\n    "password": "' +
    masterIndiaKeys.password +
    '",\r\n    "client_id": "' +
    masterIndiaKeys.clientId +
    '",\r\n    "client_secret": "' +
    masterIndiaKeys.clientSecret +
    '",\r\n    "grant_type": "' +
    masterIndiaKeys.grantType +
    '"\r\n}';

  let config = {
    method: "post",
    maxBodyLength: Infinity,
    url: "https://commonapi.mastersindia.co/oauth/access_token",
    headers: {
      "Content-Type": "application/json",
    },
    data: data,
  };

  try {
    const response = await axios.request(config);
    return {
      error: false,
      data: response.data,
    };
  } catch (error) {
    return {
      error: true,
      data: {},
    };
  }
};

const getGstDetails = async (gstNo) => {
  const masterIndiaKeys = await knex("apis")
    .where("name", "masterIndiaCreds")
    .first();
  if (masterIndiaKeys == undefined) {
    console.log("3rd Party API(masterIndiaCreds) values not found");
    return "3rd Party API(masterIndiaCreds) values not found";
  }

  const authorizationToken = await generateAccessToken();

  console.log("authorizationTokenis:-", authorizationToken);

  return new Promise((resolve, reject) => {
    let config = {
      method: "get",

      maxBodyLength: Infinity,

      url: `${masterIndiaKeys.url}commonapis/searchgstin?gstin=${gstNo}`,

      headers: {
        "Content-Type": " application/json",

        //Authorization: "Bearer " + authorizationToken.access_token,
        Authorization: masterIndiaKeys.authorization,
        client_id: masterIndiaKeys.clientId,
      },
    };

    axios
      .request(config)

      .then((response) => {
        resolve(response.data);
      })

      .catch((error) => {
        console.log(error);
        reject(error);
      });
  });
};

const getPanDetails = async (panNo) => {
  const masterIndiaKeys = await knex("apis")
    .where("name", "masterIndiaCreds")
    .first();

  if (masterIndiaKeys == undefined) {
    console.log("3rd Party API(masterIndiaCreds) values not found");
    return "3rd Party API(masterIndiaCreds) values not found";
  }

  const authorizationToken = await generateAccessToken();
  console.log("authorizationTokenis:-", authorizationToken);

  return new Promise((resolve, reject) => {
    let config = {
      method: "get",
      maxBodyLength: Infinity,
      url: `${masterIndiaKeys.url}commonapis/pandetail?pan=${panNo}`,

      headers: {
        "Content-Type": " application/json",
        //Authorization: "Bearer " + authorizationToken.access_token,
        Authorization: masterIndiaKeys.authorization,
        //Authorization: "Bearer " + "7686ac7a217b471b8acf1ab637bf7b1fdceb4f4b",
        client_id: `${masterIndiaKeys.clientId}`,
      },
    };

    axios
      .request(config)
      .then((response) => {
        resolve(response.data);
      })

      .catch((error) => {
        reject(error);
      });
  });
};

const authForIrn = async () => {
  try {
    let data = JSON.stringify({
      username: "testedoc@mastersindia.co",
      password: "S@nd#b@x!!123",
    });

    let config = {
      method: "post",
      maxBodyLength: Infinity,
      url: "https://sandb-api.mastersindia.co/api/v1/token-auth/",
      headers: {
        "Content-Type": "application/json",
      },
      data: data,
    };

    const response = await axios.request(config);
    return {
      error: false,
      data: response.data,
    };
  } catch (error) {
    return {
      error: true,
      data: {},
    };
  }
};

const generateIRN = async (data, token) => {
  // console.log("token:=", token);
  let config = {
    method: "post",
    maxBodyLength: Infinity,
    url: "https://sandb-api.mastersindia.co/api/v1/einvoice/",
    headers: {
      Authorization: "JWT" + " " + token,
      "Content-Type": "application/json",
    },
    data: data,
  };

  try {
    const response = await axios.request(config);
    return response.data;
  } catch (error) {
    throw error;
  }
};

const generateEwayBill = async (jsonData, token) => {
  console.log("token:=", token);
  let config = {
    method: "post",
    maxBodyLength: Infinity,
    url: "https://sandb-api.mastersindia.co/api/v1/ewayBillsGenerate/",
    headers: {
      Authorization: "JWT " + token, // Added space after "JWT"
      "Content-Type": "application/json",
    },
    data: jsonData, // Changed variable name here
  };

  try {
    const response = await axios.request(config);
    return response.data; // Return the data received from the API
  } catch (error) {
    throw error;
  }
};

const getEinvoiceToken = async()=>{
  try {
    let data2 = {
      "username": "chandresh.acharya@aeonx.digital",
      "password":"AeonxDigital@99"
    }
    let config = {
      method: "post",
      maxBodyLength: Infinity,
      url: "https://api-platform.mastersindia.co/api/v2/token-auth/",
      headers: {
        "Content-Type": "application/json",
      },
     data:data2,
    };

    const response = await axios.request(config)
    return {
      error:false,
      data:response
    }

  } catch (error) {
    // console.log(error)
    return {
      error:true,
      message:error.message,
      data:{}
    }
  }
}

const getEinvoice = async (IRN,GST) => {
  try {
    const getToken = await getEinvoiceToken()
    if(getToken.error == true){
      return {
        error: true,
        message:"Failed to generate Token"
      }
    }
    const token = getToken.data.data.token
    let config = {
      method: "get",
      maxBodyLength: Infinity,
      url: `https://api-platform.mastersindia.co/api/v2/saas-apis/irn/${IRN}`,
      // url: `/api/v1/get-einvoice/`,
      headers: {
        "Gstin":GST,
        Authorization: "JWT "+ token,
        "Content-Type": "application/json",
      }
    };

    const response = await axios.request(config);
    console.log(response)
    return{ 
      error:false,
      data:response
    };

  } catch (error) {
    // console.log(error)
    return {
      error: true,
      message: error.message,
      data: {},
    };
  }
};

export default {
  getGstDetails,
  getPanDetails,
  generateEwayBill,
  generateIRN,
  authForIrn,
  getEinvoice
};
