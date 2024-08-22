import Joi from "joi";

const create = (data) => {
  const lineItemSchema = Joi.object({
    itemName: Joi.string().allow(""),
    Quantity: Joi.number().required().allow(0),
    unit: Joi.string().allow(""),
    materialCode: Joi.string().allow(""),
    materialDescription: Joi.string().allow(""),
    pricePerUnit: Joi.number(),
    price: Joi.number(),
    gst: Joi.number(),
    subTotal: Joi.number(),
    hsnCode: Joi.string().allow(""),
    weight: Joi.string().allow(""),
    dimension: Joi.string().allow(""),
    material: Joi.string().allow(""),
    storageLocation: Joi.string().allow(""),
    batchNo: Joi.string().allow(""),
    uom: Joi.string().allow(""),
    specStock: Joi.string().allow(""),
    poItem: Joi.string().allow(""),
  });

  const schema = Joi.object({
    poNo: Joi.string(),
    poDate: Joi.string(),
    asnNo: Joi.string(),
    plantId: Joi.string(),
    supplierId: Joi.string(),
    dispatchDate: Joi.string().required(),
    type: Joi.string(),
    carrier: Joi.string().allow("").trim(),
    lineItems: Joi.array().items(lineItemSchema).optional(),
    status: Joi.valid(
      "materialShipped",
      "materialGateInward",
      "received",
      "qualityApproved",
      "invoiced",
      "partiallyPaid",
      "fullyPaid",
      "unpaid"
    )
      .allow("")
      .default("materialShipped"),
    gst: Joi.string(),
    pan: Joi.string(),
    irnNo: Joi.string().allow(""),
    gstInvoiceNumber: Joi.string().allow(""),
    shipToAddress: Joi.string(),
    billToAddress: Joi.string(),
    remarks: Joi.string().allow(""),
    file: Joi.string().allow(""),
    eWayBillNo: Joi.string().allow(""),
    irnNo: Joi.string().allow(""),
    departmentId: Joi.string().required().trim(),
    invoiceType: Joi.string()
      .valid("parkInvoiced", "postInvoiced")
      .allow("", null),
    companyPAN: Joi.string().allow("", null),
    companyGST: Joi.string().allow("", null),
    // totalAmount:Joi.number().integer().allow("",null).required()
  });

  return schema.validate(data);
};

const PaginateAsn2 = (data) => {
  const schema = Joi.object({
    offset: Joi.number().allow("", null).default(0),
    limit: Joi.number().allow("", null).default(10000),
    sort: Joi.string().allow("", null).default("id"),
    order: Joi.string().valid("asc", "desc").allow("", null).default("desc"),
    status: Joi.string()
      .valid(
        "all",
        "materialShipped",
        "materialGateInward",
        "materialReceived",
        "qualityApproved",
        "invoiced",
        "partiallyPaid",
        "fullyPaid",
        "unpaid",
        "requested",
        "accepted"
      )
      .allow("", null)
      .default("all"),
    type: Joi.string().valid("ASN", "SCR", "").allow("", null).default(""),
    search: Joi.string().allow("", null).default(""),
    filter: Joi.object({
      startDate: Joi.date().allow("", null).default(null),
      endDate: Joi.date()
        .min(Joi.ref("startDate"))
        .optional()
        .allow(null, "")
        .messages({
          "date.base": "End date must be a valid date.",
          "date.min": "End date cannot be before start date.",
        })
        .default(null),
      dateField: Joi.string()
        .valid("createdAt", "dispatchDate")
        .allow("", null)
        .default("createdAt"),
    }).default({}),
    dropdown: Joi.string()
      .valid("supplier", "all")
      .allow("", null)
      .default("supplier"),
  });
  return schema.validate(data);
};

const PaginateAsn = (data) => {
  const schema = Joi.object({
    offset: Joi.number().allow("", null).default(0),
    limit: Joi.number().allow("", null).default(10000),
    sort: Joi.string().allow("", null).default("id"),
    order: Joi.string().valid("asc", "desc").allow("", null).default("desc"),
    status: Joi.string()
      .valid(
        "all",
        "materialShipped",
        "materialGateInward",
        "materialReceived",
        "qualityApproved",
        "invoiced",
        "partiallyPaid",
        "fullyPaid",
        "unpaid",
        "requested",
        "accepted"
      )
      .allow("", null)
      .default("all"),
    type: Joi.string().valid("ASN", "SCR", "").allow("", null).default(""),
    search: Joi.string().allow("", null).default(""),
    filter: Joi.object({
      startDate: Joi.date().allow("", null).default(null),
      endDate: Joi.date()
        .min(Joi.ref("startDate"))
        .optional()
        .allow(null, "")
        .messages({
          "date.base": "End date must be a valid date.",
          "date.min": "End date cannot be before start date.",
        })
        .default(null),
      dateField: Joi.string()
        .valid("createdAt", "dispatchDate")
        .allow("", null)
        .default("createdAt"),
    }).default({}),
    dropdown: Joi.string()
      .valid("supplier", "all", "list")
      .allow("", null)
      .default("all"),
  });
  return schema.validate(data);
};

const del = (data) => {
  const schema = Joi.object({
    id: Joi.number().required(),
  });
  return schema.validate(data);
};

const view = (data) => {
  const schema = Joi.object({
    id: Joi.number().required(),
  });
  return schema.validate(data);
};

const update = (data) => {
  const lineItemSchema = Joi.object({
    sku: Joi.string().required(),
    itemName: Joi.string().required(),
    orderQuantity: Joi.number().positive().required(),
  });

  const schema = Joi.object({
    id: Joi.string().required(),
    poNo: Joi.string().required(),
    plantId: Joi.string().required(),
    supplierId: Joi.string().required(),
    dispatchDate: Joi.string().required(),
    type: Joi.string().required(),
    carrier: Joi.string().allow("").trim(),
    lineItems: Joi.array().items(lineItemSchema).min(1).required(),
    status: Joi.valid(
      "materialShipped",
      "materialGateInward",
      "received",
      "qualityApproved",
      "invoiced",
      "partiallyPaid",
      "fullyPaid",
      "unpaid"
    ).default("invoiced"),
  });
  return schema.validate(data);
};

const QRCodeAsn = (data) => {
  const schema = Joi.object({
    id: Joi.number().required(),
  });
  return schema.validate(data);
};

const checkQRCode = (data) => {
  const schema = Joi.object({
    text: Joi.string().allow(""),
    asn_Id: Joi.string().allow(""),
  });
  return schema.validate(data);
};

const asnStatusChange = (data) => {
  const schema = Joi.object({
    id: Joi.number().required(),
  });
  return schema.validate(data);
};

const paymentStatusUpdate = (data) => {
  const schema = Joi.object({
    id: Joi.number().required(),
    status: Joi.string()
      .valid("partiallyPaid", "fullyPaid", "unpaid")
      .allow("")
      .default("fullyPaid"),
  });
  return schema.validate(data);
};

const viewStatusHistory = (data) => {
  const schema = Joi.object({
    id: Joi.number().required(),
  });
  return schema.validate(data);
};

const viewCurrentStatus = (data) => {
  const schema = Joi.object({
    id: Joi.number().required(),
  });
  return schema.validate(data);
};

const getQRCode = (data) => {
  const schema = Joi.object({
    QrCode: Joi.string().required(),
  });
  return schema.validate(data);
};

const workFlowStatus = (data) => {
  const schema = Joi.object({
    text: Joi.string().required(),
  });
  return schema.validate(data);
};

const asnMaterialReceived = (data) => {
  const lineItemSchema = Joi.object({
    itemName: Joi.string().allow("").default(""),
    serviceName: Joi.string().allow(""),
    Quantity: Joi.number().required().allow(0),
    unit: Joi.string().allow(""),
    materialCode: Joi.string().allow(""),
    materialDescription: Joi.string().allow(""),
    pricePerUnit: Joi.number(),
    price: Joi.number(),
    gst: Joi.number(),
    subTotal: Joi.number(),
    hsnCode: Joi.string().allow(""),
    weight: Joi.string().allow(""),
    dimension: Joi.string().allow(""),
    material: Joi.string().allow(""),
    storageLocation: Joi.string().allow(""),
    uom: Joi.string().allow(""),
    specStock: Joi.string().allow(""),
    poItem: Joi.string().allow(""),
    previousQuantity: Joi.number().required(),
  });

  const schema = Joi.object({
    qrdata: Joi.object({
      id: Joi.number().allow(""),
      asn_id: Joi.number().allow(""),
      departmentId: Joi.string().required().trim(),
      poNo: Joi.string(),
      poDate: Joi.string().allow(null),
      asnNo: Joi.string(),
      plantId: Joi.string(),
      supplierId: Joi.string(),
      dispatchDate: Joi.string().allow(null),
      type: Joi.string(),
      carrier: Joi.string().allow("").trim(),
      lineItems: Joi.array().items(lineItemSchema).optional(),
      status: Joi.valid(
        "materialShipped",
        "materialGateInward",
        "materialReceived",
        "qualityApproved",
        "invoiced",
        "accepted",
        "requested",
        "partiallyReceived",
        "partiallyPaid",
        "fullyPaid",
        "unpaid"
      )
        .allow("")
        .default("materialShipped"),
      gst: Joi.string().allow("").default(0),
      pan: Joi.string(),
      irnNo: Joi.string().allow(null, ""),
      gstInvoiceNumber: Joi.string().allow(null, ""),
      shipToAddress: Joi.string(),
      billToAddress: Joi.string(),
      remarks: Joi.string().allow(null, ""),
      file: Joi.string().allow(""),
      eWayBillNo: Joi.string().allow(""),
      qrcode: Joi.string().allow(null, ""),
      editable: Joi.string().allow(null, ""),
      MaterialGateInwardRemarks: Joi.string().allow("").allow(null, ""),
      MaterialReceivedRemarks: Joi.string().allow("").allow(null, ""),
      InvoicedRemarks: Joi.string().allow("").allow(null, ""),
      QualityApprovedRemarks: Joi.string().allow("").allow(null, ""),
      vehicalDetails: Joi.string().allow("").allow(null, ""),
      createdAt: Joi.string(),
      updatedAt: Joi.string(),
      invoiceType: Joi.string()
        .valid("parkInvoiced", "postInvoiced")
        .allow("", null),
      companyPAN: Joi.string().allow("", null),
      companyGST: Joi.string().allow("", null),
      // totalAmount:Joi.number().allow(null,"").required(),
      grnId: Joi.number().allow("", null),
      sesId: Joi.string().allow("", null),
      giId: Joi.number().allow("", null),
      storageLocation: Joi.number().allow("", null),
      baseLineDate: Joi.string().allow("", null),
      isDeleted: Joi.string().allow("0", "1", ""),
    }),
    vehical: Joi.object({
      asn_id: Joi.number(),
      vehicalNo: Joi.string().allow(null, ""),
      // modalName: Joi.string().allow(null,""),
      arrivalDate: Joi.string().allow(null, ""),
      arrivalTime: Joi.string().allow(null, ""),
      comeFrom: Joi.string().allow(null, ""),
      driverFullName: Joi.string().allow(null, ""),
      driverLicenceNo: Joi.string().allow(null, ""),
      vehicalStatus: Joi.string().allow(null, ""),
      logisticCoName: Joi.string().allow(null, ""),
      gateInwardLocation: Joi.string().allow(null, ""),
      vehicalInwardPurpose: Joi.string().allow(null, ""),
      transporterName: Joi.string().allow(null, ""),
      transporterId: Joi.string().allow(null, ""),
      transDocNo: Joi.string().allow(null, ""),
      transDocDate: Joi.string().allow(null, ""),
      // plant_id: Joi.string().allow(""),
      status: Joi.valid("Inward", "Outward").allow(null, ""),
      gateInwardNumber: Joi.string().allow("", null),
    }),
  });
  return schema.validate(data);
};
const gateInward2 = (data) => {
  const vehicalSchema = Joi.object({
    asnNo: Joi.number(),
    vehicalNo: Joi.string(),
    modelName: Joi.string(),
    arrivalDate: Joi.string(),
    arrivalTime: Joi.string(),
    vehicalCameFromLoc: Joi.string(),
    vehicalStatus: Joi.string().valid("open", "shield"),
    logisticsCoName: Joi.string(),
    driverName: Joi.string(),
    driverLicenceNo: Joi.string(),
    gateInwardLoc: Joi.string(),
  });

  const lineItemSchema = Joi.object({
    itemName: Joi.string().allow("").default(""),
    serviceName: Joi.string().allow(""),
    Quantity: Joi.number().positive(),
    unit: Joi.string().allow(""),
    materialCode: Joi.string().allow(""),
    materialDescription: Joi.string().allow(""),
    pricePerUnit: Joi.number(),
    price: Joi.number(),
    gst: Joi.number(),
    subTotal: Joi.number(),
    hsnCode: Joi.string().allow(""),
    weight: Joi.string().allow(""),
    dimension: Joi.string().allow(""),
    material: Joi.string().allow(""),
    storageLocation: Joi.string().allow(""),
    uom: Joi.string().allow(""),
    specStock: Joi.string().allow(""),
    poItem: Joi.string().allow(""),
  });

  const schema = Joi.object({
    qrdata: Joi.object({
      id: Joi.number(),
      departmentId: Joi.string().required().trim(),
      poNo: Joi.string(),
      poDate: Joi.string().allow(null),
      asnNo: Joi.string(),
      plantId: Joi.string(),
      supplierId: Joi.string(),
      dispatchDate: Joi.string(),
      type: Joi.string(),
      carrier: Joi.string().allow("").trim(),
      lineItems: Joi.array().items(lineItemSchema).optional(),
      vehicalDetails: Joi.array().items(vehicalSchema).optional(),
      status: Joi.valid(
        "materialShipped",
        "materialGateInward",
        "materialReceived",
        "qualityApproved",
        "invoiced",
        "accepted",
        "requested",
        "partiallyPaid",
        "fullyPaid",
        "unpaid"
      )
        .allow("")
        .default("materialShipped"),
      gst: Joi.string(),
      pan: Joi.string(),
      irnNo: Joi.string().allow(null),
      gstInvoiceNumber: Joi.string().allow(null),
      shipToAddress: Joi.string(),
      billToAddress: Joi.string(),
      remarks: Joi.string().allow(null),
      file: Joi.string().allow(""),
      eWayBillNo: Joi.string().allow(""),
      qrcode: Joi.string().allow(null),
      companyPAN: Joi.string().allow(""),
      companyGST: Joi.string().allow(""),
      grnId: Joi.string().allow(""),
      createdAt: Joi.string(),
      updatedAt: Joi.string(),
    }),
  });
  return schema.validate(data);
};

const gateInward = (data) => {
  const schema = Joi.object({
    asn_id: Joi.number(),
    vehicalNo: Joi.string().allow(""),
    modalName: Joi.string().allow(""),
    arrivalDate: Joi.string().allow(""),
    arrivalTime: Joi.string().allow(""),
    comeFrom: Joi.string().allow(""),
    driverFullName: Joi.string().allow(""),
    driverLicenceNo: Joi.string().allow(""),
    vehicalStatus: Joi.string().allow(""),
    logisticCoName: Joi.string().allow(""),
    gateInwardLocation: Joi.string().allow(""),
    vehicalInwardPurpose: Joi.string().allow(""),
    // plant_id: Joi.string().allow(""),
    status: Joi.valid("Inward", "Outward").allow(""),
  });
  return schema.validate(data);
};

const scannerHistory = (data) => {
  const schema = Joi.object({
    offset: Joi.number().default(0),
    limit: Joi.number().default(50),
    sort: Joi.string().default("id"),
    order: Joi.string().valid("asc", "desc").default("desc"),
    status: Joi.string().valid("0", "1", "").default(""),
    search: Joi.string().allow("", null).default(null),
    filter: Joi.object({
      startDate: Joi.date().allow("", null).default(null),
      endDate: Joi.date().allow("", null).default(null),
      dateField: Joi.string()
        .valid("createdAt", "updatedAt")
        .allow("", null)
        .default("createdAt"),
    }).default({}),
  });
  return schema.validate(data);
};

const updateVehicalStatus = (data) => {
  const schema = Joi.object({
    vehicalNo: Joi.string().required(),
    status: Joi.valid("Inward", "Outward").required(),
    asn_id: Joi.number().required(),
  });
  return schema.validate(data);
};

const cancelASN = (data) => {
  const schema = Joi.object({
    asn_id: Joi.string().required(),
    remarks: Joi.string().allow("", null),
  });
  return schema.validate(data);
};

const unitConversion = (data) => {
  const schema = Joi.object({
    whichvalue: Joi.string().required(),
    fromUnit: Joi.string().required(),
    toUnit: Joi.string().required(),
  });
  return schema.validate(data);
};

const getRemainQuantity = (data) => {
  const schema = Joi.object({
    poNo: Joi.string().required(),
    Quantity: Joi.array().required(),
  });
  return schema.validate(data);
};

const exportToExcel = (data) => {
  const schema = Joi.object({
    sort: Joi.string().allow("", null).default("id"),
    order: Joi.string().valid("asc", "desc").allow("", null).default("desc"),
    status: Joi.string()
      .valid(
        "all",
        "materialShipped",
        "materialGateInward",
        "materialReceived",
        "qualityApproved",
        "invoiced",
        "partiallyPaid",
        "fullyPaid",
        "unpaid",
        "requested",
        "accepted"
      )
      .allow("", null)
      .default("all"),
    type: Joi.string().valid("ASN", "SCR", "").allow("", null).default(""),
    filter: Joi.object({
      startDate: Joi.date().allow("", null).default(null),
      endDate: Joi.date().allow("", null).default(null),
      dateField: Joi.string()
        .valid("createdAt", "dispatchDate")
        .allow("", null)
        .default("createdAt"),
    }).default({}),
    dropdown: Joi.string()
      .valid("supplier", "all", "list")
      .allow("", null)
      .default("all"),
    asn_ids: Joi.alternatives(
      Joi.number().allow("").default(""),
      Joi.array().items(Joi.number())
    ).default(""),
  }).unknown(true);
  return schema.validate(data);
};

export default {
  create,
  PaginateAsn2,
  PaginateAsn,
  del,
  view,
  update,
  QRCodeAsn,
  checkQRCode,
  asnStatusChange,
  paymentStatusUpdate,
  viewStatusHistory,
  viewCurrentStatus,
  getQRCode,
  workFlowStatus,
  asnMaterialReceived,
  gateInward2,
  gateInward,
  scannerHistory,
  updateVehicalStatus,
  cancelASN,
  unitConversion,
  getRemainQuantity,
  exportToExcel,
};
