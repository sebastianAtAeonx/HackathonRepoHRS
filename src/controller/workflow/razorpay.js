import knex from "../../config/mysql_db.js";
import validation from "../../validation/workflow/razorpay.js";
import axios from "axios";

async function ifsctoaddrs(ifsc) {
  let config = {
    method: "get",
    maxBodyLength: Infinity,
    url: `https://ifsc.razorpay.com/${ifsc}`,
    headers: {},
  };

  try {
    const response = await axios.request(config);
    console.log(JSON.stringify(response.data));
    return response.data;
  } catch (error) {
    console.log(error);
    return 0;
  }
}

const ifsctobankdetails = async (req, res) => {
  try {
    const { error, value } = validation.ifsctobankdetails(req.params);
    if (error) {
      return res.status(400).json({
        error: true,
        message: error.details[0].message,
      });
    }
    const { ifsc } = value;
    const getBankAddress = await ifsctoaddrs(ifsc);
    if (!getBankAddress) {
      return res.status(404).json({
        error: true,
        message: "Bank details not found",
        ifsc,
      });
    }
    return res.status(200).json({
      error: false,
      message: "Bank Address retrieved successfully",
      data: getBankAddress,
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: "Error occurred.",
      data: { error: JSON.stringify(error) },
    });
  }
};

export default {
  ifsctobankdetails,
};
