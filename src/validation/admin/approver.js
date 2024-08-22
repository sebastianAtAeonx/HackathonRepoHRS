import Joi from "joi";

const create = (data) => {
  const schema = Joi.object({
    department_id: Joi.string().required(),
    levels: Joi.array()
      .items(
        Joi.object({
          level: Joi.number().integer().positive().required(),
          approvers: Joi.array()
            .items(Joi.number().integer().positive())
            .required(),
        })
      )
      .required(),
  }).custom((value, helpers) => {
    const levels = value.levels.map((obj) => obj.level);
    for (let i = 0; i < levels.length; i++) {
      if (levels[i] !== i + 1) {
        return helpers.message("Levels must be consecutive");
      }
    }

    const approverSet = new Set();
    for (const level of value.levels) {
      for (const approverId of level.approvers) {
        if (approverSet.has(approverId)) {
          return helpers.message(`Approver ${approverId} is already assigned`);
        }
        approverSet.add(approverId);
      }
    }

    return value;
  });
  return schema.validate(data);
};

const paginate = (data) => {
  const schema = Joi.object({
    department_id: Joi.string().optional(),
    offset: Joi.number().optional(),
    limit: Joi.number().optional(),
    search: Joi.string().optional().allow(""),
    sort: Joi.string().optional().allow(""),
    order: Joi.string().optional().allow(""),
  });
  return schema.validate(data);
};

const update = (data) => {
  const schema = Joi.object({
    department_id: Joi.string().required(),
    levels: Joi.array()
      .items(
        Joi.object({
          level: Joi.number().integer().positive().required(),
          approvers: Joi.array()
            .items(Joi.number().integer().positive())
            .required(),
        })
      )
      .required(),
  }).custom((value, helpers) => {
    const levels = value.levels.map((obj) => obj.level);
    for (let i = 1; i < levels.length; i++) {
      if (levels[i] - levels[i - 1] !== 1) {
        return helpers.message("Levels must be passed in ascending order");
      }
    }

    const approverSet = new Set();
    for (const level of value.levels) {
      for (const approverId of level.approvers) {
        if (approverSet.has(approverId)) {
          return helpers.message(`Approver ${approverId} is already assigned`);
        }
        approverSet.add(approverId);
      }
    }

    return value;
  });
  return schema.validate(data);
};

const del = (data) => {
  const schema = Joi.object({
    department_id: Joi.string().required(),
  });

  return schema.validate(data);
};
export default {
  create,
  paginate,
  update,
  del,
};
