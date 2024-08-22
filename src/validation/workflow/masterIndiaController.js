import Joi from "joi";

const verifyGst = (data) => {
  const schema = Joi.object({
    gst: Joi.string()
      .alphanum()
      .min(15)
      .max(15)
      .trim()
      .pattern(
        new RegExp(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/),
        "Incorrect GST number"
      )
      .required(),
    refresh: Joi.bool(),
  });
  return schema.validate(data);
};

const verifyPan = (data) => {
  const schema = Joi.object({
    pan: Joi.string()
      .alphanum()
      .min(10)
      .max(10)
      .trim()
      .pattern(new RegExp(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/), "Incorrect PAN number")
      .required(),
    refresh: Joi.bool(),
  });

  return schema.validate(data);
};

const gstComplianceCheck = (data) => {
  const schema = Joi.object({
    Days: Joi.number().default(20),
  });

  return schema.validate(data);
};

const gstComplianceCheckUpdated = (data) => {
  const schema = Joi.object({
    gstNo: Joi.array().items(
      Joi.object({
        supplierId: Joi.string().allow("", null),
        gst: Joi.string().allow("", null),
      })
    ),
  });

  return schema.validate(data);
};

const panComplianceCheck = (data) => {
  const schema = Joi.object({
    Days: Joi.number().default(20),
  });

  return schema.validate(data);
};

const panComplianceCheckUpdated = (data) => {
  const schema = Joi.object({
    panNo: Joi.array().items(
      Joi.object({
        supplierId: Joi.string().allow("", null),
        pan: Joi.string().allow("", null),
      })
    ),
  });

  return schema.validate(data);
};
const msmeComplianceCheck = (data) => {
  const schema = Joi.object({
    Days: Joi.number().default(20),
  });
  return schema.validate(data);
};

const msmeComplianceCheckUpdated = (data) => {
  const schema = Joi.object({
    msmeNo: Joi.array().items(
      Joi.object({
        supplierId: Joi.string().allow("", null),
        msmeNo: Joi.string().allow("", null),
      })
    ),
  });
  return schema.validate(data);
};

const generateEwayBill = (data) => {
  const schema = Joi.object({
    userGstin: Joi.string().required(),
    supply_type: Joi.string().required(),
    sub_supply_type: Joi.string().required(),
    sub_supply_description: Joi.string().required(),
    document_type: Joi.string().required(),
    document_number: Joi.string().required(),
    document_date: Joi.string().required(),
    gstin_of_consignor: Joi.string().required(),
    legal_name_of_consignor: Joi.string().allow("").optional(),
    address1_of_consignor: Joi.string().allow("").optional(),
    address2_of_consignor: Joi.string().allow("").optional(),
    place_of_consignor: Joi.string().allow("").optional(),
    pincode_of_consignor: Joi.number().required(),
    state_of_consignor: Joi.string().required(),
    actual_from_state_name: Joi.string().allow("").optional(),
    gstin_of_consignee: Joi.string().required(),
    legal_name_of_consignee: Joi.string().allow("").optional(),
    address1_of_consignee: Joi.string().allow("").optional(),
    address2_of_consignee: Joi.string().allow("").optional(),
    place_of_consignee: Joi.string().required(),
    pincode_of_consignee: Joi.number().required(),
    state_of_supply: Joi.string().required(),
    actual_to_state_name: Joi.string().allow("").optional(),
    transaction_type: Joi.number().required(),
    other_value: Joi.number().required(),
    total_invoice_value: Joi.number().required(),
    taxable_amount: Joi.number().required(),
    cgst_amount: Joi.number().allow("").optional(),
    sgst_amount: Joi.number().allow("").optional(),
    igst_amount: Joi.number().allow("").optional(),
    cess_amount: Joi.number().required(),
    cess_nonadvol_value: Joi.number().required(),
    transporter_id: Joi.string().required(),
    transporter_name: Joi.string().allow("").optional(),
    transporter_document_number: Joi.string().allow("").optional(),
    transporter_document_date: Joi.string().allow("").optional(),
    transportation_mode: Joi.string().required(),
    transportation_distance: Joi.string().required(),
    vehicle_number: Joi.string().required(),
    vehicle_type: Joi.string().required(),
    generate_status: Joi.number().required(),
    data_source: Joi.string().required(),
    user_ref: Joi.string().allow("").optional(),
    location_code: Joi.string().allow("").optional(),
    eway_bill_status: Joi.string().required(),
    auto_print: Joi.string().required(),
    email: Joi.string().allow("").optional(),
    delete_record: Joi.string().required(),
    itemList: Joi.array()
      .items(
        Joi.object({
          product_name: Joi.string().required(),
          product_description: Joi.string().required(),
          hsn_code: Joi.string().required(),
          quantity: Joi.number().required(),
          unit_of_product: Joi.string().required(),
          cgst_rate: Joi.number().required(),
          sgst_rate: Joi.number().required(),
          igst_rate: Joi.number().required(),
          cess_rate: Joi.number().allow("").optional(),
          cessNonAdvol: Joi.number().allow("").optional(),
          taxable_amount: Joi.number().required(),
        })
      )
      .required(),
  });
  return schema.validate(data);
};

const fetchMSME = (data) => {
  const schema = Joi.object({
    sort: Joi.string().default("id"),
    order: Joi.string().valid("asc", "desc").default("desc"),
    filter: Joi.object().keys({
      startDate: Joi.date().iso().raw().allow(""),
      endDate: Joi.date().iso().raw().allow(""),
      dateField: Joi.string().valid("msmeTime", "msmeOdTime").allow(""),
    }),
    status: Joi.string().allow(""),
    selected_ids: Joi.alternatives(
      Joi.string().allow("").default(""),
      Joi.array().items(Joi.alternatives(Joi.string(), Joi.number()))
    ).default([]),
  }).unknown(true);

  return schema.validate(data);
};

const fetchGST = (data) => {
  const schema = Joi.object({
    sort: Joi.string().default("id"),
    order: Joi.string().valid("asc", "desc").default("desc"),
    filter: Joi.object().keys({
      startDate: Joi.date().iso().raw().allow(""),
      endDate: Joi.date().iso().raw().allow(""),
      dateField: Joi.string().valid("gstTime", "gstOdTime").allow(""),
    }),
    status: Joi.string().allow(""),
    selected_ids: Joi.alternatives(
      Joi.string().allow("").default(""),
      Joi.array().items(Joi.alternatives(Joi.string(), Joi.number()))
    ).default([]),
  }).unknown(true);
  return schema.validate(data);
};

const fetchPAN = (data) => {
  const schema = Joi.object({
    sort: Joi.string().default("id"),
    order: Joi.string().valid("asc", "desc").default("desc"),
    filter: Joi.object().keys({
      startDate: Joi.date().iso().raw().allow(""),
      endDate: Joi.date().iso().raw().allow(""),
      dateField: Joi.string().valid("panTime", "panOdTime").allow(""),
    }),
    status: Joi.string().allow(""),
    selected_ids: Joi.alternatives(
      Joi.string().allow("").default(""),
      Joi.array().items(Joi.alternatives(Joi.string(), Joi.number()))
    ).default([]),
  }).unknown(true);
  return schema.validate(data);
};

const getEinvoiceData = (data) => {
  const schema = Joi.object({
    gst: Joi.string()
      .alphanum()
      .min(15)
      .max(15)
      .trim()
      .pattern(
        new RegExp(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/),
        "Incorrect GST number"
      )
      .required(),
    irn: Joi.string().required(),
  });
  return schema.validate(data);
};

const generateIRN = (data) => {
  const transactionDetailsSchema = Joi.object({
    supply_type: Joi.string().required(),
    charge_type: Joi.string().allow("").optional(),
    igst_on_intra: Joi.string().allow("").optional(),
    ecommerce_gstin: Joi.string().allow("").optional(),
  }).required();

  const documentDetailsSchema = Joi.object({
    document_type: Joi.string().required(),
    document_number: Joi.string().required(),
    document_date: Joi.string().required(),
  }).required();

  const sellerDetailsSchema = Joi.object({
    gstin: Joi.string().required(),
    legal_name: Joi.string().required(),
    trade_name: Joi.string().allow("").optional(),
    address1: Joi.string().required(),
    address2: Joi.string().allow("").optional(),
    location: Joi.string().required(),
    pincode: Joi.number().required(),
    state_code: Joi.string().required(),
    phone_number: Joi.string().allow("").optional(),
    email: Joi.string().allow("").optional(),
  })
    .allow("")
    .optional();

  const buyerDetailsSchema = Joi.object({
    gstin: Joi.string().required(),
    legal_name: Joi.string().required(),
    trade_name: Joi.string().allow("").optional(),
    address1: Joi.string().required(),
    address2: Joi.string().allow("").optional(),
    location: Joi.string().required(),
    pincode: Joi.number().required(),
    place_of_supply: Joi.string().required(),
    state_code: Joi.string().required(),
    phone_number: Joi.string().allow("").optional(),
    email: Joi.string().allow("").optional(),
  }).required();

  const dispatchDetailsSchema = Joi.object({
    company_name: Joi.string().required(),
    address1: Joi.string().required(),
    address2: Joi.string().allow("").optional(),
    location: Joi.string().required(),
    pincode: Joi.number().required(),
    state_code: Joi.string().required(),
  })
    .allow("")
    .optional();

  const shipDetailsSchema = Joi.object({
    gstin: Joi.string().allow("").optional(),
    legal_name: Joi.string().required(),
    trade_name: Joi.string().allow("").optional(),
    address1: Joi.string().required(),
    address2: Joi.string().allow("").optional(),
    location: Joi.string().required(),
    pincode: Joi.number().required(),
    state_code: Joi.string().required(),
  }).required();

  const exportDetailsSchema = Joi.object({
    ship_bill_number: Joi.string().allow("").optional(),
    ship_bill_date: Joi.string().allow("").optional(),
    country_code: Joi.string().required(),
    foreign_currency: Joi.string().allow("").optional(),
    refund_claim: Joi.string().allow("").optional(),
    port_code: Joi.string().allow("").optional(),
    export_duty: Joi.string().allow("").optional(),
  }).required();

  const paymentDetailsSchema = Joi.object({
    bank_account_number: Joi.string().allow("").optional(),
    paid_balance_amount: Joi.string().allow("").optional(),
    credit_days: Joi.number().allow("").optional(),
    credit_transfer: Joi.string().allow("").optional(),
    direct_debit: Joi.string().allow("").optional(),
    branch_or_ifsc: Joi.string().allow("").optional(),
    payment_mode: Joi.string().allow("").optional(),
    payee_name: Joi.string().allow("").optional(),
    outstanding_amount: Joi.string().allow("").optional(),
    payment_instruction: Joi.string().allow("").optional(),
    payment_term: Joi.string().allow("").optional(),
  })
    .allow("")
    .optional();

  const referenceDetailsSchema = Joi.object({
    invoice_remarks: Joi.string().allow("").optional(),
    document_period_details: Joi.object({
      invoice_period_start_date: Joi.string().required(),
      invoice_period_end_date: Joi.string().required(),
    }).required(),
    preceding_document_details: Joi.array()
      .items(
        Joi.object({
          reference_of_original_invoice: Joi.string().required(),
          preceding_invoice_date: Joi.string().required(),
          other_reference: Joi.string().allow("").optional(),
        })
      )
      .required(),
    contract_details: Joi.array()
      .items(
        Joi.object({
          receipt_advice_number: Joi.string().allow("").optional(),
          receipt_advice_date: Joi.string().allow("").optional(),
          batch_reference_number: Joi.string().allow("").optional(),
          contract_reference_number: Joi.string().allow("").optional(),
          other_reference: Joi.string().allow("").optional(),
          project_reference_number: Joi.string().allow("").optional(),
          vendor_po_reference_number: Joi.string().allow("").optional(),
          vendor_po_reference_date: Joi.string().allow("").optional(),
        })
      )
      .allow("")
      .optional(),
  })
    .allow("")
    .optional();

  const additionalDocumentDetailsSchema = Joi.object({
    supporting_document_url: Joi.string().allow("").optional(),
    supporting_document: Joi.string().allow("").optional(),
    additional_information: Joi.string().allow("").optional(),
  })
    .allow("")
    .optional();

  const ewaybillDetailsSchema = Joi.object({
    transporter_id: Joi.string().allow("").optional(),
    transporter_name: Joi.string().allow("").optional(),
    transportation_mode: Joi.string().required(),
    transportation_distance: Joi.number().required(),
    transporter_document_number: Joi.string().allow("").optional(),
    transporter_document_date: Joi.string().allow("").optional(),
    vehicle_number: Joi.string().allow("").optional(),
    vehicle_type: Joi.string().allow("").optional(),
  }).required();

  const valueDetailsSchema = Joi.object({
    total_assessable_value: Joi.number().required(),
    total_cgst_value: Joi.string().allow("").optional(),
    total_sgst_value: Joi.number().allow("").optional(),
    total_igst_value: Joi.number().allow("").optional(),
    total_cess_value: Joi.number().allow("").optional(),
    total_cess_value_of_state: Joi.number().allow("").optional(),
    total_discount: Joi.number().allow("").optional(),
    total_other_charge: Joi.number().allow("").optional(),
    total_invoice_value: Joi.number().required(),
    round_off_amount: Joi.number().allow("").optional(),
    total_invoice_value_additional_currency: Joi.number().allow("").optional(),
  }).required();

  const batchDetailsSchema = Joi.object({
    name: Joi.string().required(),
    expiry_date: Joi.string().allow("").optional(),
    warranty_date: Joi.string().allow("").optional(),
  }).required();

  const attributeDetailsSchema = Joi.object({
    item_attribute_details: Joi.string().allow("").optional(),
    item_attribute_value: Joi.string().allow("").optional(),
  })
    .allow("")
    .optional();

  const itemListSchema = Joi.object({
    item_serial_number: Joi.string().required(),
    product_description: Joi.string().allow("").optional(),
    is_service: Joi.string().required(),
    hsn_code: Joi.string().required(),
    bar_code: Joi.string().allow("").optional(),
    quantity: Joi.number().allow("").optional(),
    free_quantity: Joi.number().allow("").optional(),
    unit: Joi.string().allow("").optional(),
    unit_price: Joi.number().required(),
    total_amount: Joi.number().required(),
    pre_tax_value: Joi.number().allow("").optional(),
    discount: Joi.number().allow("").optional(),
    other_charge: Joi.number().allow("").optional(),
    assessable_value: Joi.number().required(),
    gst_rate: Joi.number().required(),
    igst_amount: Joi.number().allow("").optional(),
    cgst_amount: Joi.number().allow("").optional(),
    sgst_amount: Joi.number().allow("").optional(),
    cess_rate: Joi.number().allow("").optional(),
    cess_amount: Joi.number().allow("").optional(),
    cess_nonadvol_amount: Joi.number().allow("").optional(),
    state_cess_rate: Joi.number().allow("").optional(),
    state_cess_amount: Joi.number().allow("").optional(),
    state_cess_nonadvol_amount: Joi.number().allow("").optional(),
    total_item_value: Joi.number().required(),
    country_origin: Joi.string().allow("").optional(),
    order_line_reference: Joi.string().allow("").optional(),
    product_serial_number: Joi.string().allow("").optional(),
    batch_details: batchDetailsSchema.allow("").optional(),
    attribute_details: Joi.array()
      .items(attributeDetailsSchema)
      .allow("")
      .optional(),
  })
    .allow("")
    .optional();

  // Define the main schema for validation
  const schema = Joi.object({
    asnNo: Joi.string().required(),
    user_gstin: Joi.string().required(),
    data_source: Joi.string().allow("").optional(),
    transaction_details: transactionDetailsSchema,
    document_details: documentDetailsSchema,
    seller_details: sellerDetailsSchema,
    buyer_details: buyerDetailsSchema,
    dispatch_details: dispatchDetailsSchema,
    ship_details: shipDetailsSchema,
    export_details: exportDetailsSchema,
    payment_details: paymentDetailsSchema,
    reference_details: referenceDetailsSchema,
    additional_document_details: Joi.array()
      .items(additionalDocumentDetailsSchema)
      .allow("")
      .optional(),
    ewaybill_details: ewaybillDetailsSchema,
    value_details: valueDetailsSchema,
    item_list: Joi.array().items(itemListSchema).optional(),
  });

  return schema.validate(data);
};

export default {
  verifyGst,
  verifyPan,
  gstComplianceCheck,
  gstComplianceCheckUpdated,
  panComplianceCheck,
  panComplianceCheckUpdated,
  msmeComplianceCheck,
  msmeComplianceCheckUpdated,
  generateEwayBill,
  fetchMSME,
  fetchGST,
  fetchPAN,
  getEinvoiceData,
  generateIRN,
};
