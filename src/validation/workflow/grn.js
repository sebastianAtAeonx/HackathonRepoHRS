import Joi from "joi";

const normalgrn = (data) => {
  const schema = Joi.object({
    asnNo: Joi.string().required(),
    poNo: Joi.string().required(),
  });
  return schema.validate(data);
};

const incomingInvoice = (data) => {
  const schema = Joi.object({
    poNo: Joi.string().required(),
    asnNo: Joi.string().required(),
    reference: Joi.string().required(),
    baselineDate: Joi.string().required(),
    parkPostIndicator: Joi.string().required(),

    grnDoc: Joi.string().required(),
    grnDocYear: Joi.number().required(),
    grnDocItem: Joi.string().required(),

    freightConditionCode: Joi.string().required(),
    freightAmount: Joi.string().required(),
  });
  return schema.validate(data);
};

const listInvoice = (data) => {
  const schema = Joi.object({
    offset: Joi.number().default(0),
    limit: Joi.number().default(50),
    sort: Joi.string().default("id"),
    order: Joi.string().valid("asc", "desc").default("desc"),
    status: Joi.string().valid("0", "1", "").default(""),
    search: Joi.string().allow("", null).default(null),
  });
  return schema.validate(data);
};

const view = (data) => {
  const schema = Joi.object({
    id: Joi.string().required(),
  });
  return schema.validate(data);
};

const updateInvoice = (data) => {
  const invoiceItemSchema = Joi.object({
    invoiceItemId: Joi.string().allow(""),
    po: Joi.string().allow(""),
    poItem: Joi.string().allow(""),
    grnDoc: Joi.string().allow(""),
    grnDocYear: Joi.number().allow(""),
    grnDocItem: Joi.string().allow(""),
    taxCode: Joi.string().allow(""),
    amount: Joi.number().allow(""),
    quantity: Joi.number().allow(""),
    poUnit: Joi.string().allow(""),
  });

  const schema = Joi.object({
    id: Joi.string().required(),
    postingDate: Joi.string().allow(""),
    documentDate: Joi.string().allow(""),
    reference: Joi.string().allow(""),
    headerText: Joi.string().allow(""),
    companyCode: Joi.string().allow(""),
    currency: Joi.string().allow(""),
    baselineDate: Joi.string().allow(""),
    totalInvoiceAmount: Joi.string().allow(""),
    parkPostIndicator: Joi.string().allow(""),

    items: Joi.array().items(invoiceItemSchema).optional(),

    freightConditionCode: Joi.string().allow(""),
    po: Joi.string().allow(""),
    poItem: Joi.string().allow(""),
    grnDoc: Joi.string().allow(""),
    grnDocYear: Joi.number().allow(""),
    grnDocItem: Joi.string().allow(""),
    taxCode: Joi.string().allow(""),
    freightAmount: Joi.string().allow(""),
    quantity: Joi.string().allow(""),
  });
  return schema.validate(data);
};

const deleteInvoice = (data) => {
  const schema = Joi.object({
    id: Joi.string().required(),
  });
  return schema.validate(data);
};

const grnToSap = (data) => {
  const schema = Joi.object({
    fromDate: Joi.string().allow(""),
    toDate: Joi.string().allow(""),
    Days: Joi.number().allow("").default(30),
  });
  return schema.validate(data);
};

const invoiceToSap = (data) => {
  const schema = Joi.object({
    fromDate: Joi.string().allow(""),
    toDate: Joi.string().allow(""),
    Days: Joi.number().allow("").default(30),
  });
  return schema.validate(data);
};

const invoiceToSapNew = (data) => {
  const schema = Joi.object({
    fromDate: Joi.string().allow(""),
    toDate: Joi.string().allow(""),
    Days: Joi.number().allow("").default(30),
  });
  return schema.validate(data);
};

const sapToInvoiceCode = (data) => {
  const schema = Joi.object({
    invoiceCode: Joi.string().required(),
    uniqueId: Joi.string().required(),
    poNo: Joi.string().required(),
    indicator: Joi.string().valid("park", "post").required(),
  });
  return schema.validate(data);
};

const insertInvoiceCode = (data) => {
  const schema = Joi.object({
    invoiceCode: Joi.string().required(),
    uniqueId: Joi.string().required(),
    poNo: Joi.string().required(),
    indicator: Joi.string().valid("park", "post").required().default("park"),
  });
  return schema.validate(data);
};

const listAllInvoice = (data) => {
  const schema = Joi.object({
    offset: Joi.number().default(0),
    limit: Joi.number().default(50),
    sort: Joi.string().default("createdAt"),
    order: Joi.string().valid("asc", "desc").default("desc"),
    status: Joi.string().valid("0", "1", "").default(""),
    type: Joi.string().valid("park", "post", "").default(""),
    search: Joi.string().allow("", null).default(null),
    filter: Joi.object({
      startDate: Joi.date().allow("", null).default(null),
      endDate: Joi.date().allow("", null).default(null),
      dateField: Joi.string()
        .valid(
          "postingDate",
          "documentDate",
          "grnTime",
          "createdAt",
          "updatedAt"
        )
        .allow("", null)
        .default("createdAt"),
    }).default({}),
  });
  return schema.validate(data);
};

const SEStoSAP = (data) => {
  const schema = Joi.object({
    fromDate: Joi.string().allow(""),
    toDate: Joi.string().allow(""),
    Days: Joi.number().allow("").default(30),
  });
  return schema.validate(data);
};

const removeGRNCode = (data) => {
  const schema = Joi.object({
    grnUniqueId: Joi.string().required(),
  });
  return schema.validate(data);
};

const updateGRNCode = (data) => {
  const schema = Joi.object({
    grnUniqueId: Joi.string().required(),
    grnCode: Joi.string().required(),
  });

  return schema.validate(data);
};

const paginateGrn = (data) => {
  const schema = Joi.object({
    offset: Joi.number().default(0),
    limit: Joi.number().default(50),
    sort: Joi.string().default("id"),
    order: Joi.string().valid("asc", "desc").default("desc"),
    status: Joi.string().valid("0", "1", "").default(""),
    search: Joi.string().allow("", null).default(null),
    grnCodeExists: Joi.boolean(),
    asnIdExists: Joi.boolean(),
    filter: Joi.object({
      startDate: Joi.date().allow("", null).default(null),
      endDate: Joi.date().allow("", null).default(null),
      dateField: Joi.string()
        .valid(
          "postingDate",
          "documentDate",
          "grnTime",
          "created_at",
          "updated_at"
        )
        .allow("", null)
        .default("created_at"),
    }).default({}),
  });
  return schema.validate(data);
};

export default {
  normalgrn,
  incomingInvoice,
  listInvoice,
  view,
  updateInvoice,
  deleteInvoice,
  grnToSap,
  invoiceToSap,
  invoiceToSapNew,
  sapToInvoiceCode,
  insertInvoiceCode,
  listAllInvoice,
  SEStoSAP,
  removeGRNCode,
  updateGRNCode,
  paginateGrn,
};
