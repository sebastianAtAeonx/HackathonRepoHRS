import knex from "../../config/mysql_db.js";
import functions from "../../helpers/functions.js";
import validation from "../../validation/workflow/approval_hierarchy.js";

// const createApprovalHierarchy = async (req, res) => {
//   try {
//     const schema = Joi.object({
//       subscriber_id: Joi.number().integer().required(),
//       role_id: Joi.number().integer().required(),
//       approval_hierarchy_level: Joi.number().integer().positive().required(),
//       approval_level_name: Joi.array()
//         .items(
//           Joi.object({
//             level: Joi.number().integer().positive().required(),
//             name: Joi.string().required(),
//             status: Joi.number().integer().required(),
//           })
//         )
//         .min(1)
//         .max(Joi.ref("approval_hierarchy_level"))
//         .required(),
//     });

//     const { error } = schema.validate(req.body);

//     if (error) {
//       return res
//         .status(400)
//         .json({
//           error: true,
//           message: error.details[0].message,
//         })
//
//     }

//     const {
//       subscriber_id,
//       role_id,
//       approval_hierarchy_level,
//       approval_level_name,
//     } = req.body;

//     const checkSubscriberIdExist = await knex("subscribers").where({
//       id: subscriber_id,
//     });

//     if (
//       Array.isArray(checkSubscriberIdExist) &&
//       checkSubscriberIdExist.length <= 0
//     ) {
//      return res.status(404).json({
//         error: true,
//         message: "Subscriber does not exist",
//       });
//
//     }

//     const checkSubscriberId = await knex("approval_hierarchy").where({
//       subscriber_id: subscriber_id,
//     });

//     if (checkSubscriberId == "") {
//       const result = await knex("approval_hierarchy").insert({
//         subscriber_id,
//         role_id,
//         approval_hierarchy_level,
//         approval_level_name: JSON.stringify(approval_level_name),
//       });

//       if (!result) {
//         return res
//           .json({
//             error: true,
//             message: "Unable to create approval hierarchy",
//           })
//
//       }

//       return res
//         .json({ message: "Approval hierarchy created successfully" })
//
//     }
//     if (checkSubscriberId[0].subscriber_id == subscriber_id) {
//       return res
//         .json({
//           error: true,
//           message: "Hierarchy already created for this subscriber",
//         })
//
//     }
//   } catch (error) {
//     return res
//       .json({
//         error: true,
//         message: "Something went wrong",
//         data: JSON.stringify(error),
//       })
//
//   }
// };

//this is testing for level 1 only code

const createApprovalHierarchy = async (req, res) => {
  try {
    const { error } = validation.create(req.body);

    if (error) {
      return res.status(400).json({
        error: true,
        message: error.details[0].message,
      });
    }

    const {
      subscriber_id,
      role_id,
      approval_hierarchy_level,
      approval_level_name,
    } = req.body;

    const checkSubscriberIdExist = await knex("subscribers").where({
      id: subscriber_id,
    });

    if (
      Array.isArray(checkSubscriberIdExist) &&
      checkSubscriberIdExist.length <= 0
    ) {
      return res.status(404).json({
        error: true,
        message: "Subscriber does not exist",
      });
    }

    const checkSubscriberId = await knex("approval_hierarchy").where({
      subscriber_id: subscriber_id,
    });

    if (checkSubscriberId == "") {
      const result = await knex("approval_hierarchy").insert({
        subscriber_id,
        role_id,
        approval_hierarchy_level,
        approval_level_name: JSON.stringify(approval_level_name),
      });

      if (!result) {
        return res.status(500).json({
          error: true,
          message: "Could not create",
        });
      }

      return res
        .status(200)
        .json({ message: "Approval hierarchy created successfully" });
    }
    if (checkSubscriberId[0].subscriber_id == subscriber_id) {
      return res.status(409).json({
        error: true,
        message: "Hierarchy already created for this subscriber",
      });
    }
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: "Could not create",
      data: JSON.stringify(error),
    });
  }
};

const updateApprovalHierarchy = async (req, res) => {
  try {
    const { error } = validation.update(req.body);

    if (error) {
      return res.status(400).json({
        error: true,
        message: error.details[0].message,
      });
    }

    const { subscriber_id, approval_hierarchy_level, approval_level_name } =
      req.body;

    const existingHierarchy = await knex("approval_hierarchy").where({
      subscriber_id: subscriber_id,
    });

    if (existingHierarchy.length === 0) {
      return res.status(404).json({
        error: true,
        message: "Approval hierarchy not found for this subscriber",
      });
    }

    const getId = await knex("approval_hierarchy")
      .where({ subscriber_id: subscriber_id })
      .select("id")
      .first();

    const updationDataIs = await functions.takeSnapShot(
      "approval_hierarchy",
      getId.id
    );

    const result = await knex("approval_hierarchy")
      .where({ subscriber_id: subscriber_id })
      .update({
        approval_hierarchy_level,
        approval_level_name: JSON.stringify(approval_level_name),
      });

    if (result === 0) {
      return res.status(500).json({
        error: true,
        message: "No records were updated",
      });
    }
    if (subscriber_id) {
      const modifiedByTable1 = await functions.SetModifiedBy(
        req.headers["authorization"],
        "approval_hierarchy",
        "subscriber_id",
        subscriber_id
      );
      console.log("isUpdated:-", modifiedByTable1);
    }
    return res
      .status(200)
      .json({ message: "Approval hierarchy updated successfully" });
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: "Could not update",
      data: JSON.stringify(error),
    });
  }
};

const deleteApprovalHierarchy = async (req, res) => {
  try {
    const tableName = "approval_hierarchy";
    const { error, value } = validation.del(req.params);
    if (error) {
      return res.status(400).json({
        error: true,
        message: error.details[0].message,
        data: error,
      });
    }
    const { id } = value;
    const check = await knex(tableName)
      .where({
        id: id,
      })
      .update('isDeleted', 1); //checked

    if (!check) {
      return res.status(500).json({
        error: true,
        message: "Delete Failed.",
      });
    }
    return res.status(200).json({
      error: false,
      message: "Deleted Successfully.",
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: "Could not delete",
      data: JSON.stringify(error),
    });
  }
};

const listApprovalHierarchy = async (req, res) => {
  try {
    const { error } = validation.view(req.body);
    if (error) {
      return res.status(400).json({
        error: true,
        message: error.details[0].message,
      });
    }

    const { subscriber_id, role_id, approval_hierarchy_id, approval_level } =
      req.body;

    // const getUserName = await knex("users")
    //   .select("username")
    //   .where("id", user_id);

    const getSubscriberName = await knex("subscribers")
      .where({ id: subscriber_id })
      .select("name");

    console.log("this is get subscriver ", getSubscriberName);

    const getRolename = await knex("users_roles")
      .select("role_name")
      .where("id", role_id);

    const getApproverName = await knex("approval_hierarchy")
      .select("approval_level_name")
      .where("id", approval_hierarchy_id);

    const getApproverNameAccLevel = await knex("approval_hierarchy")
      .select("approval_level_name")
      .where("id", approval_hierarchy_id)
      .first();

    // console.log("this is",JSON.parse(getApproverNameAccLevel.approval_level_name));
    let test = JSON.parse(getApproverNameAccLevel.approval_level_name);
    console.log("test", test);

    if (approval_level in test) {
      const approverNameAccLevel = test[approval_level];
      return res.status(200).json({
        SubscriberName: getSubscriberName[0].name,
        RoleName: getRolename[0].role_name,
        ApprovalLevel: approval_level,
        ApprovalLevelWithName: approverNameAccLevel,
      });
    } else {
      res.status(404).json({ error: "Key not found" });
    }
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: "Could not load record(s)",
      data: JSON.stringify(error),
    });
  }
};

const paginateApprovalHierarchy = async (req, res) => {
  try {
    const tableName = "approval_hierarchy";
    const searchFrom = ["subscriber_id"];

    const { error, value } = validation.paginate(req.body);
    if (error) {
      return res.status(400).json({
        error: true,
        message: error.details[0].message,
        data: error,
      });
    }

    let total = 0;

    let { offset, limit, order, sort, search, status } = value;
    let results = knex("approval_hierarchy");
    if (status !== undefined && status !== "") {
      results = results.where("status", status);
    }
    results = results.where(function () {
      if (search !== undefined && search !== "") {
        searchFrom.forEach((element) => {
          this.orWhereILike(element, `%${search}%`);
        });
      }
    });
    total = await results.count("id as total").first();
    let rows = knex(tableName);

    if (status !== undefined && status !== "") {
      rows.where("status", status);
    }
    rows = rows.where(function () {
      if (search !== undefined && search !== "") {
        searchFrom.forEach((element) => {
          this.orWhereILike(element, `%${search}%`);
        });
      }
    });

    rows = await rows.orderBy(sort, order).limit(limit).offset(offset);
    let data_rows = [];
    if (order === "desc") {
      let sr = offset + 1;
      for (const row of rows) {
        row.sr = sr;
        delete row.password;
        row.approval_level_name = JSON.parse(row.approval_level_name);

        const role_name = await knex("users_roles")
          .where("id", row.role_id)
          .select("role_name")
          .first();

        row.role_name = role_name.role_name;

        data_rows.push(row);
        sr++;
      }
    } else {
      let sr = total.total - limit * offset;
      for (const row of rows) {
        row.sr = sr;
        delete row.password;
        row.approval_level_name = JSON.parse(row.approval_level_name);
        const role_name = await knex("users_roles")
          .where("id", row.role_id)
          .select("role_name")
          .first();

        row.role_name = role_name.role_name;
        data_rows.push(row);
        sr--;
      }
    }
    if (data_rows.length > 0) {
      return res.status(200).json({
        error: false,
        message: "Retrieved successfully.",
        data: {
          rows: data_rows,
          total: total.total,
        },
      });
    } else {
      return res.status(404).json({
        error: false,
        message: "No data found",
      });
    }
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: "Could not load record(s)",
      data: JSON.stringify(error),
    });
  }
};

const delteMultipleRecords = async (req, res) => {
  try {
    const tableName = "approval_hierarchy";
    const { ids } = req.body;

    const result = await functions.bulkDeleteRecords(tableName, ids, req);

    if (result.error) {
      return res.status(500).json({
        error: true,
        message: "Failed to delete one or more records",
        errors: result.errors,
        deltedIds: result.messages,
      });
    }

    return res.status(200).json({
      error: false,
      message: "Deleted all selected records successfully",
      errors: result.errors,
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: "Could not delete records",
      data: JSON.stringify(error),
    });
  }
};

export default {
  createApprovalHierarchy,
  listApprovalHierarchy,
  paginateApprovalHierarchy,
  updateApprovalHierarchy,
  deleteApprovalHierarchy,
  delteMultipleRecords,
};
