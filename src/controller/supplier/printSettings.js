import convert from "convert-units";
import knex from "../../config/mysql_db.js";
import { v4 as uuidv4 } from "uuid";
import AWS from "aws-sdk";
import QRCode from "qrcode";
import constant from "../../helpers/constants.js";
import CryptoJS from "crypto-js";
import jwt from "jsonwebtoken";
import po from "../../../src/services/poFromSap.js";
import moment from "moment-timezone";
import validation from "../../validation/supplier/printSettings.js";

const getSettings = async (req, res) => {
  const { error, value } = validation.getSetting(req.body);
  if (error) {
    return res.status(400).json({
      error: true,
      message: error.details[0].message,
    });
  }

  const { supplier_id } = value;

  const getSettings = await knex("asn_print_settings")
    .where({ supplier_id: supplier_id })
    .first();

  if (getSettings == undefined) {
    return res.status(404).json({
      error: true,
      message: "Settings not found",
    });
  }

  return res.status(200).json({
    error: false,
    message: "Settings found",
    data: getSettings,
  });
};

const setSettings = async (req, res) => {
  const { error, value } = validation.setSetting(req.body);
  if (error) {
    return res.status(400).json({
      error: true,
      message: error.details[0].message,
    });
  }

  const {
    supplier_id,
    gstHide,
    asnHide,
    supplierHide,
    emailHide,
    addressHide,
    panHide,
    orderLineHide,
    billaddressHide,
    supplieraddressHide,
    inrHide,
    ewayHide,
    invoiceHide,
  } = value;

  const updateSettings = await knex("asn_print_settings")
    .update({
      gstHide,
      asnHide,
      supplierHide,
      emailHide,
      addressHide,
      panHide,
      orderLineHide,
      billaddressHide,
      supplieraddressHide,
      inrHide,
      invoiceHide,
      ewayHide,
    })
    .where({ supplier_id: supplier_id });

  if (!updateSettings) {
    return res.status(500).json({
      error: true,
      message: "Error updating settings",
    });
  }

  if (supplier_id) {
    const modifiedByTable1 = await functions.SetModifiedBy(
      req.headers["authorization"],
      "asn_print_settings",
      "supplier_id",
      supplier_id
    );
    console.log("isUpdated:-", modifiedByTable1);
  }
  return res.status(200).json({
    error: false,
    message: "Settings updated successfully",
  });
};

export default {
  getSettings,
  setSettings,
};
