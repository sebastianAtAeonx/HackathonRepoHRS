import axios from "axios";
import constants from "../helpers/constants.js";
import knex from "../config/mysql_db.js";
 
const createCSRF = async() => {
  const sapKeys = await knex("sapConfiguration")
    .where("name", "sap-createCSRFToken")
    .first();
    const token = btoa(sapKeys.username + ":" + sapKeys.password);
  return new Promise((resolve, reject) => {
    let data = "";
    let config = {
      method: "get",
      maxBodyLength: Infinity,
      // url: `http://${constants.sapconfig.ip}:8000/SUPPLIERX/PO_GET_DETAIL?${constants.sapconfig.client}`,
      url: sapKeys.url + sapKeys.tokenPath + sapKeys.client,
      headers: {
        "x-csrf-token": "Fetch",
        Authorization:`Basic ${token}`,
        Cookie: sapKeys.cookie,
      },
      data: data,
    };
 
    axios
      .request(config)
      .then((response) => {
        const headers = {
          cookie: response.headers.get("set-cookie")[0],
          token: response.headers.get("x-csrf-token"),
        };
        resolve(headers);
      })
 
      .catch((error) => {
        reject(error);
      });
  });
};
 
const fetchPoDetails = async (poNo, token, cookie) => {
  const sapKeys = await knex("sapConfiguration")
    .where("name", "sap-fetchPoDetails")
    .first();
 
  if (sapKeys == undefined) {
    console.log("3rd Party API(sap-fetchPoDetails) values not found");
    return "3rd Party API(sap-fetchPoDetails) values not found";
  }
 
  //console.log("sap:=", sapKeys.url, sapKeys.tokenPath, sapKeys.client);
  return new Promise((resolve, reject) => {
    let data = JSON.stringify({
      PoNumber: poNo,
    });
    let config = {
      method: "post",
      maxBodyLength: Infinity,
      //url: http://9.100.1.115:8000/SUPPLIERX/PO_GET_DETAIL?client=120
      url: sapKeys.url + sapKeys.tokenPath + sapKeys.client,
      headers: {
        "x-csrf-token": token,
        "Content-Type": "application/json",
        Cookie: `${cookie} ; ${sapKeys.cookie}`,
      },
      data: data,
    };
    axios
      .request(config)
      .then((response) => {
        resolve(response.data);
      })
      .catch((error) => {
        resolve({error:true});
      });
  });
};
 
const fetchPoList = async (vendorCode, token, cookie) => {
 
  const getSapKeys = await knex("sapConfiguration")
    .where("name", "sap-fetchPoList")
    .first();
  if (getSapKeys == undefined) {
    console.log("3rd Party API(sap-fetchPoList) values not found");
    return "3rd Party API(sap-fetchPoList) values not found";
  }
 
  return new Promise((resolve, reject) => {
    let data = JSON.stringify({
      SUPPLIER: vendorCode,
    });
 
    let config = {
      method: "post",
      maxBodyLength: Infinity,
      //url: `http://9.100.1.115:8000/SUPPLIERX/GET_PO_LIST?client=120`,
      url: getSapKeys.url + getSapKeys.tokenPath + getSapKeys.client,
      headers: {
        "x-csrf-token": token,
        "Content-Type": "application/json",
        Cookie: `${cookie} ; ${getSapKeys.cookie}`,
      },
      data: data,
    };
    axios
      .request(config)
      .then((response) => {
        resolve(response.data);
      })
      .catch((error) => {
        resolve({error:true})
      });
  });
};
 
export default {
  createCSRF,
  fetchPoDetails,
  fetchPoList,
};