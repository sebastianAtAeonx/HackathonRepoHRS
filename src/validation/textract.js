import Joi from "joi";

const textract = (data) => {
  const schema = Joi.object({
    size: Joi.number()
      .max(50 * 1024 * 1024)
      .required(),
    mimetype: Joi.string()
      .valid("image/png", "image/jpeg", "image/jpg", "application/pdf")
      .required(),
  });
  return schema.validate(data);
};

const forMapping = (data) => {
  const schema = Joi.object({
    size: Joi.number()
      .max(50 * 1024 * 1024)
      .required(),
    mimetype: Joi.string()
      .valid("image/png", "image/jpeg", "image/jpg", "application/pdf")
      .required(),
  });
  return schema.validate(data);
};

const mapping = (data) => {
  const schema = Joi.object({
    id: Joi.string().required(),
    mappedKeys: Joi.array()
      .items(
        Joi.object({
          extractedKey: Joi.string().required(),
          sapKey: Joi.string().required(),
        })
      )
      .required(),
  });

  return schema.validate(data);
};

const automateInvoice = (data) => {
  const schema = Joi.object({
    invoiceName: Joi.string()
      .regex(/^[a-zA-Z0-9_ -]+\.[a-zA-Z]{3,4}$/)
      .required(),
  });
  return schema.validate(data);
};

const automateInvoice2 = (data) => {
  const schema = Joi.object({
    invoiceName: Joi.array().required(),
  });
  return schema.validate(data);
};

const bulkUpload = (data) => {
    const schema = Joi.object({
        size: Joi.number()
          .max(50 * 1024 * 1024)
          .required(),
        mimetype: Joi.string()
          .valid("image/png", "image/jpeg", "image/jpg", "application/pdf")
          .required(),
      });
  return schema.validate(data);
};

const paginateInvoices = (data) => {
  const schema = Joi.object({
    offset: Joi.number().allow("", null).default(0),
    limit: Joi.number().allow("", null).default(10000),
    sort: Joi.string().allow("", null).default("id"),
    order: Joi.string().valid("asc", "desc").allow("", null).default("desc"),
    status: Joi.number()
      .valid("scan", "rescan", "saperror", "approved", "invoiced", "uploaded")
      .allow(null)
      .default(""),
    search: Joi.string().allow("", null).default(""),
  });
  return schema.validate(data);
};

const viewdata = (data) => {
  const schema = Joi.object({
    id: Joi.string().required(),
  });
  return schema.validate(data);
};

const deletedata = (data) => {
  const schema = Joi.object({
    id: Joi.string().required(),
  });
  return schema.validate(data);
};

const updatedata = (data) => {
  const schema = Joi.object({
    id: Joi.string().required(),
    data: Joi.object().required(),
    table: Joi.object().required(),
  });
  return schema.validate(data);
};

const deleteInvoice = (data) => {
  const schema = Joi.object({
    invoiceId: Joi.string().required(),
    s3Name: Joi.string().required(),
  });
  return schema.validate(data);
};

const textractSubmittedInvocieList = (data) => {
  const schema = Joi.object({
    offset: Joi.number().default(0),
    limit: Joi.number().default(50),
    sort: Joi.string().default("id"),
    order: Joi.string().valid("asc", "desc").default("desc"),
    status: Joi.string().valid("rescan", "saperror", "approved"),
    search: Joi.string().allow("", null).default(null),
    filter: Joi.object().default({}),
  });
  return schema.validate(data);
};

export default {
  textract,
  forMapping,
  mapping,
  automateInvoice,
  automateInvoice2,
  bulkUpload,
  paginateInvoices,
  viewdata,
  deletedata,
  updatedata,
  deleteInvoice,
  textractSubmittedInvocieList,
};
