import Joi from "joi";

const create = (data) => {
  const lineItemSchema = Joi.object({
    itemName: Joi.string().allow(""),
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
    deliveryDate: Joi.string().required(),
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
    departmentId: Joi.string().required().trim(),
  });
  return schema.validate(data);
};

const paginate = (data) => {
  const schema = Joi.object({
    offset: Joi.number().default(0),
    limit: Joi.number().default(50),
    sort: Joi.string().default("id"),
    order: Joi.string().valid("asc", "desc").default("desc"),
    status: Joi.valid(
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
    ).default(""),
    search: Joi.string().allow("", null).default(null),
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
    deliveryDate: Joi.string().required(),
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

const QRScan = (data) => {
  const schema = Joi.object({
    id: Joi.number().required(),
  });
  return schema.validate(data);
};

const checkQR = (data) => {
  const schema = Joi.object({
    text: Joi.string().required(),
  });
  return schema.validate(data);
};

const statusChange = (data) => {
  const schema = Joi.object({
    id: Joi.number().required(),
  });

  return schema.validate(data);
};
const asnPaymentStatusUpdate = (data) => {
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

const workflowStatus = (data) => {
  const schema = Joi.object({
    text: Joi.string().required(),
  });
  return schema.validate(data);
};

const materialReceived = (data) => {
  const lineItemSchema = Joi.object({
    itemName: Joi.string().allow(""),
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
      deliveryDate: Joi.string(),
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
      irnNo: Joi.string().allow(null),
      gstInvoiceNumber: Joi.string().allow(null),
      shipToAddress: Joi.string(),
      billToAddress: Joi.string(),
      remarks: Joi.string().allow(null),
      file: Joi.string().allow(""),
      eWayBillNo: Joi.string().allow(""),
      qrcode: Joi.string(),
      createdAt: Joi.string(),
      updatedAt: Joi.string(),
    }),
  });

  return schema.validate(data);
};

export default {
  create,
  paginate,
  update,
  del,
  view,
  QRScan,
  checkQR,
  statusChange,
  asnPaymentStatusUpdate,
  viewStatusHistory,
  viewCurrentStatus,
  getQRCode,
  workflowStatus,
  materialReceived,
};
