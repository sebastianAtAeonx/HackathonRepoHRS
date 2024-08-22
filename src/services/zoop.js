import axios from "axios";
import constants from "../helpers/constants.js";
import knex from "../config/mysql_db.js";

const getGstDetails = async (gstNo) => {
  const zoopKeys = await knex("apis").where("name", "zoop-auth").first();

  return new Promise((resolve, reject) => {
    let data = JSON.stringify({
      data: {
        business_gstin_number: gstNo,
        consent: "Y",
        consent_text:
          "I hear by declare my consent agreement for fetching my information via ZOOP API",
      },
    });

    if (zoopKeys == undefined) {
      console.log("3rd Party API(zoop-auth) values not found");
      return "3rd Party API(zoop-auth) values not found";
    }

    let config = {
      method: "post",
      maxBodyLength: Infinity,
      url: `${zoopKeys.url}/api/v1/in/merchant/gstin/advance`,
      headers: {
        auth: "false",
        "api-key": zoopKeys.apiKey,
        "app-id": zoopKeys.clientId,
        "Content-Type": "application/json",
      },
      maxRedirects: 0,
      data: data,
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

const getPanDetails = async (pan) => {
  const zoopKeys = await knex("apis").where("name", "zoop-auth").first();
  return new Promise((resolve, reject) => {
    let data = JSON.stringify({
      data: {
        customer_pan_number: pan,
        consent: "Y",
        consent_text:
          "I hear by declare my consent agreement for fetching my information via ZOOP API.",
      },
    });

    if (zoopKeys == undefined) {
      console.log("3rd Party API(zoop-auth) values not found");
      return "3rd Party API(zoop-auth) values not found";
    }

    let config = {
      method: "post",
      maxBodyLength: Infinity,
      url: `${zoopKeys.url}/api/v1/in/identity/pan/advance`,
      headers: {
        auth: "false",
        "api-key": zoopKeys.apiKey,
        "app-id": zoopKeys.clientId,
        "Content-Type": "application/json",
      },
      maxRedirects: 0,
      data: data,
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

const getBankAccountDetails = async (accountNo,ifsc) => {
const data =await new Promise((resolve, reject) => {
  let data = JSON.stringify({
    "mode": "sync",
    "data": {
      "account_number": accountNo,
      "ifsc": ifsc,
      "consent": "Y",
      "consent_text": "I hear by declare my consent agreement for fetching my information via ZOOP API"
    },
    "task_id": "f26eb21e-4c35-4491-b2d5-41fa0e545a34"
  });
   
  let config = {
    method: 'post',
    maxBodyLength: Infinity,
    url: `${constants.zoop.url}/api/v1/in/financial/bav/lite`,
    headers: { 
      'app-id': constants.zoop.appId, 
      'api-key': constants.zoop.apiKey, 
      'org-id': 'abc', 
      'Content-Type': 'application/json'
    },
    data : data
  };
   
  axios.request(config)
  .then((response) => {
    console.log(response.data);
    resolve(response.data);
  })
  .catch((error) => {
    console.log(error);
    reject(error)
  });
})

if(data.success == true && data.response_code == 100){
    return {
      error:false,
      message:data.response_message,
      data:data.result,
      metadata:data.metadata.reason_message,
      code:data.response_code,
    }
}

 return {
  error:true,
  message:data.response_message,
  data:data.result,
  metadata:data.metadata.reason_message,
  code:data.response_code,
}
}

export default {
  getGstDetails,
  getPanDetails,
  getBankAccountDetails
};
