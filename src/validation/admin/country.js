import Joi from "joi";

const create = (data) => {
  const schema = Joi.object({
    country_id: Joi.number().required(),
    capital: Joi.string().required().trim(),
    currency_code: Joi.number().required(),
    domain: Joi.string().required().trim(),
    emoji: Joi.string().required().trim(),
    country_key: Joi.string().required().trim(),
    iso3: Joi.string().required().trim(),
    latitude: Joi.string().required().trim(),
    longitude: Joi.string().required().trim(),
    name: Joi.string().required().trim(),
    native: Joi.string().required().trim(),
    phonecode: Joi.string().required().trim(),
    region: Joi.string().required().trim(),
    subregion: Joi.string().required().trim(),
    status: Joi.string().valid("0", "1", "").default(""),
  });
  return schema.validate(data);
};

const paginate = (data) => {
  const schema = Joi.object({
    offset: Joi.number().default(0),
    limit: Joi.number().default(50),
    sort: Joi.string().default("id"),
    order: Joi.string().valid("asc", "desc").default("desc"),
    status: Joi.string().valid("0", "1", "").default(""),
    search: Joi.string().allow("", null).default(null),
    key: Joi.string().allow("", null).default(null),
  });
  return schema.validate(data);
};

const update = (data) => {
  const schema = Joi.object({
    id: Joi.number().required(),
    country_id: Joi.number().required(),
    capital: Joi.string().required().trim(),
    currency_code: Joi.number().required(),
    domain: Joi.string().required().trim(),
    emoji: Joi.string().required().trim(),
    country_key: Joi.string().required().trim(),
    iso3: Joi.string().required().trim(),
    latitude: Joi.string().required().trim(),
    longitude: Joi.string().required().trim(),
    name: Joi.string().required().trim(),
    native: Joi.string().required().trim(),
    phonecode: Joi.string().required().trim(),
    region: Joi.string().required().trim(),
    subregion: Joi.string().required().trim(),
    status: Joi.string().valid("0", "1", "").default(""),
  });
  return schema.validate(data);
};

const del = (data) => {
  const schema = Joi.object({
    id: Joi.string().required(),
  });
  return schema.validate(data);
};
const view = (data) => {
  const schema = Joi.object({
    id: Joi.string().required(),
  });
  return schema.validate(data);
};

const importExcel = (data) => {
  const schema = Joi.object({
    capital: Joi.string().required().trim(),
    currency_code: Joi.number().required(),
    domain: Joi.string().required().trim(),
    emoji: Joi.string().required().trim(),
    country_key: Joi.string().required().trim(),
    iso3: Joi.string().required().trim(),
    latitude: Joi.string().required().trim(),
    longitude: Joi.string().required().trim(),
    name: Joi.string().required().trim(),
    native: Joi.string().required().trim(),
    phonecode: Joi.string().required().trim(),
    region: Joi.string().required().trim(),
    subregion: Joi.string().required().trim(),
  }).unknown(true);
  return schema.validate(data);
};

export default {
  create,
  paginate,
  update,
  del,
  view,
  importExcel,
};
