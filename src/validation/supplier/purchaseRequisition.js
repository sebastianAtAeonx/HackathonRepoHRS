import Joi from "joi";

// const createPR = (data) => {
//   const schema = Joi.object({
//     document_type: Joi.string().required(),
//     header_text: Joi.string().required(),
//     pr_type: Joi.string().valid("item", "service").required(),
//     total: Joi.number().required(),
//     plant_id: Joi.string().required().messages({
//       "any.required": "Plant is required",
//       "string.empty": "Plant is required",
//     }),
//     stor_loc_id: Joi.number().required(),
//     delivery_date: Joi.date().required(),
//     purchase_org_id: Joi.number().required(),
//     attachment: Joi.string().allow("", null),
//     pr_data: Joi.array()
//       .items(
//         Joi.object({
//           // item_text: Joi.string().required(),
//           material_id: Joi.number().when("pr_type", {
//             is: "item",
//             then: Joi.number().required(),
//             otherwise: Joi.number().disallow("", null),
//           }),
//           short_text: Joi.string().required(),
//           quantity: Joi.number().required(),
//           uom_id: Joi.number().required(),
//           matl_group_id: Joi.number().when("pr_type", {
//             is: "item",
//             then: Joi.number().required(),
//             otherwise: Joi.number().disallow("", null),
//           }),
//           // vendor_id: Joi.string().required(),
//           price: Joi.number().required(),
//           subtotal: Joi.number().required(),
//         })
//       )
//       .min(1),
//   });

//   return schema.validate(data);
// };

const createPR = (data) => {
  const schema = Joi.object({
    document_type: Joi.string().required(),
    header_text: Joi.string().required(),
    pr_type: Joi.string().valid("item", "service").required(),
    total: Joi.number().required(),
    plant_id: Joi.string().required().messages({
      "any.required": "Plant is required",
      "string.empty": "Plant is required",
    }),
    stor_loc_id: Joi.number().required(),
    delivery_date: Joi.date().required(),
    purchase_grp_id: Joi.number().required(),
    purchase_org_id: Joi.number().required(),
    attachment: Joi.string().allow("", null),
    pr_data: Joi.array()
      .items(
        Joi.object({
          short_text: Joi.string().required(),
          quantity: Joi.number().required(),
          uom_id: Joi.number().required(),
          price: Joi.number().required(),
          subtotal: Joi.number().required(),
          material_id: Joi.number().when(Joi.ref("/pr_type"), {
            is: "item",
            then: Joi.number().required(),
            otherwise: Joi.forbidden(),
          }),
          service_id: Joi.number().when(Joi.ref("/pr_type"), {
            is: "service",
            then: Joi.number().required(),
            otherwise: Joi.forbidden(),
          }),
          matl_group_id: Joi.number().required(),
        })
      )
      .min(1),
  });

  return schema.validate(data);
};

const paginatePR = (data) => {
  const schema = Joi.object({
    offset: Joi.number().default(0),
    limit: Joi.number().default(50),
    sort: Joi.string().default("id"),
    order: Joi.string().valid("asc", "desc").default("desc"),
    status: Joi.string()
      .valid("draft", "submitted", "approved", "rejected", "")
      .default(""),
    search: Joi.string().allow("", null).default(null),
    delivery_date: Joi.string().allow("", null).default(null),
    material: Joi.array().items(Joi.string()).default([]),
    material_group: Joi.array().items(Joi.string()).default([]),
    stor_loc: Joi.array().items(Joi.string()).default([]),
    plant: Joi.array().items(Joi.string()).default([]),
    // vendor: Joi.array().items(Joi.string()).default([]),
    type: Joi.string()
      .optional()
      .valid("service", "item", "")
      .allow("", null)
      .default(""),
    filter: Joi.object().default({}),
  });
  return schema.validate(data);
};

const updatePR = (data) => {
  const schema = Joi.object({
    id: Joi.number().required(),
    document_type: Joi.string().required(),
    header_text: Joi.string().required(),
    pr_type: Joi.string().valid("item", "service").required(),
    total: Joi.number().required(),
    plant_id: Joi.string().required().messages({
      "any.required": "Plant is required",
      "string.empty": "Plant is required",
    }),
    stor_loc_id: Joi.number().required(),
    delivery_date: Joi.date().required(),
    purchase_grp_id: Joi.number().required(),
    purchase_org_id: Joi.number().required(),
    attachment: Joi.string().allow("", null),
    status: Joi.string()
      .valid("pending", "approved", "rejected")
      .required()
      .default("pending"),
    pr_data: Joi.array()
      .items(
        Joi.object({
          short_text: Joi.string().required(),
          quantity: Joi.number().required(),
          uom_id: Joi.number().required(),
          price: Joi.number().required(),
          subtotal: Joi.number().required(),
          material_id: Joi.number().when(Joi.ref("/pr_type"), {
            is: "item",
            then: Joi.number().required(),
            otherwise: Joi.forbidden(),
          }),
          service_id: Joi.number().when(Joi.ref("/pr_type"), {
            is: "service",
            then: Joi.number().required(),
            otherwise: Joi.forbidden(),
          }),
          matl_group_id: Joi.number().required(),
        })
      )
      .min(1),
  });
  return schema.validate(data);
};

const deletePR = (data) => {
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

const fetchPRList = (data) => {
  const schema = Joi.object({
    fromDate: Joi.date().iso().required(),
    toDate: Joi.date().iso().required(),
    search: Joi.string().allow("").default(""),
    offset: Joi.number().integer().default(0),
    limit: Joi.number().integer().default(100),
    order: Joi.string().valid("asc", "desc").default("desc"),
    sort: Joi.string().default("PR_NO"),
  }).unknown(true);

  return schema.validate(data);
};

const fetchPRDetails = (data) => {
  const schema = Joi.object({
    PR_NO: Joi.string().required(),
  });
  return schema.validate(data);
};

export default {
  createPR,
  paginatePR,
  updatePR,
  deletePR,
  view,
  fetchPRList,
  fetchPRDetails,
};
