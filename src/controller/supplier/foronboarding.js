import knex from "../../config/mysql_db.js";
import fun from "../../helpers/functions.js";
import validation from "../../validation/supplier/foronboarding.js";

const viewPage = async (req, res) => {
  try {
    const { error, value } = validation.view(req.body);
    if (error) {
      return res.status(400).json({
        error: true,
        message: error.details[0].message,
        data: error,
      });
    }

    const { id } = value;

    let result = [];

    if (id === "" || id === undefined) {
      //return false;
    } else {
      result = await fun.getSupplierData(id);
    }

    let [
      sources,
      payment_types,
      countries,
      states,
      company_types,
      business_types,
      currencies,
      business_partner_group,
    ] = await Promise.all([
      knex("company_source").limit(10000),
      knex("payment_types").limit(10000),
      knex("countries").limit(10000),
      knex("states").limit(10000),
      knex("company_types").limit(10000),
      knex("business_types").limit(10000),
      knex("currencies").limit(10000),
      knex("business_partner_groups").limit(10000),
    ]);
    const fieldsConfig = await fun.getFieldConfig("supplier_registration", 1);
    const fieldsConfig_international = await fun.getFieldConfigInternational(
      "supplier_registration",
      1
    );
    console.log("fieldsConfig", fieldsConfig);
    console.log("fieldsConfig_international", fieldsConfig_international);
    return res.status(200).json({
      error: false,
      message: "Recieved Successfully.",
      data: {
        supplier: result,
        sources,
        message: "Page view is successfully.",
        payment_types: payment_types,
        countries: countries,
        states: states,
        company_types: company_types,
        business_types: business_types,
        department: business_partner_group,
        currencies: currencies,
        fieldsConfig,
        fieldsConfig_international,
      },
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: "Could not fetch record.",
      data: JSON.stringify(error),
    });
  }
};

export default {
  viewPage,
};
