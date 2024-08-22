import knex from "../../config/mysql_db.js";
import { v4 as uuidv4 } from "uuid";
import fun from "../../helpers/functions.js";
import fetchUserName from "../../helpers/functions.js";
import logs from "../../middleware/logs.js";
import functions from "../../helpers/functions.js";
import validation from "../../validation/supplier/approver.js";

const deleteApprovers = async (req, res) => {
  try {
    const tableName = "approvers2";
    const { error, value } = validation.del(req.params);
    if (error) {
      return res.status(400).json({
        error: true,
        message: error.details[0].message,
        data: error,
      });
    }
    const { id } = value;

    try {
      await logs.logOldValues(tableName, id, value, req);
    } catch {
      console.log(error);
    }

    const check = await knex(tableName)
      .where({
        id: id,
      })
      .del();
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
      message: "Could not delete record",
      data: JSON.stringify(error),
    });
  }
};

const viewApprovers = async (req, res) => {
  try {
    const tableName = "approvers2";

    const { error, value } = validation.view(req.params);
    if (error) {
      return res.status(400).json({
        error: true,
        message: error.details[0].message,
        data: error,
      });
    }

    const { id } = value;

    const result = await knex(tableName)
      .where({
        id,
      })
      .first();
    if (!result) {
      return res.status(404).json({
        error: true,
        message: "Record not found",
      });
    }

    console.log("what is:", result.level_1_user_id);

    result.approver_1_user_id = JSON.parse(result.level_1_user_id);
    // result[0].approver_2_user_id = JSON.parse(result[0].approver_2_user_id);

    return res.status(200).json({
      error: false,
      message: "Record found Successfully",
      data: {
        result,
      },
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: "Could not fetch record",
      data: error.message,
    });
  }
};

// const createApprovers = async (req, res) => {
//   try {
//     const schema = Joi.object({
//       department_id: Joi.string().required(),
//       level_1_user_id: Joi.array().items(Joi.number()).required(),
//       // level_3_user_id: Joi.array().items(Joi.number()).required(),
//       // level_4_user_id: Joi.array().items(Joi.number()).required(),
//       level_2_user_id: Joi.array()
//         .items(Joi.number())
//         .custom((value, helpers) => {
//           const approver1Ids = req.body.level_1_user_id || [];
//           const invalidIds = value.filter((id) => approver1Ids.includes(id));
//           if (invalidIds.length > 0) {
//             return helpers.error("any.invalid");
//           }
//           return value;
//         }, "Custom Validation"),
//       status: Joi.string().valid("0", "1").default("1"),
//       approval_hierarchy_id: Joi.number().required(),
//     });

//     const { error, value } = schema.validate(req.body);
//     if (error) {
//       return res
//         .json({
//           error: true,
//           message: error.details[0].message,
//           data: [],
//         })
//         .end();
//     }

//     const {
//       department_id,
//       level_1_user_id,
//       level_2_user_id,
//       // level_3_user_id,
//       // level_4_user_id,
//       approval_hierarchy_id,
//       status,
//     } = value;

//     const check_department_id = await knex("departments").where({
//       id: department_id,
//     });

//     if (check_department_id.length == 0) {
//       return res
//         .json({
//           error: true,
//           message: "Department does not exist",
//         })
//         .end();
//     }

//     const check_department_name = await knex("approvers").where({
//       department_id: department_id,
//     });

//     if (
//       Array.isArray(check_department_name) &&
//       check_department_name.length != 0
//     ) {
//       res.json({
//         error: true,

//         message: "For this department roles are already assigned!!",
//       });

//       // return res.end();
//     }

//     // const check_department_name = await knex("approvers").where({
//     //   id: department_id,
//     // });

//     // if (check_department_name.length == 0) {
//     //   return res
//     //     .json({
//     //       error: true,
//     //       message: "Department name already exist",
//     //     })
//     //     .end();
//     // }

//     for (const element of level_1_user_id) {
//       const check_user_exist = await knex("users").where("id", element);
//       if (check_user_exist.length == 0) {
//         return res.json({
//           error: true,
//           message: "user" + element + " does not exist",
//         });
//       }

//       const check_user_role = await knex.raw(
//         "SELECT users_roles.role_name FROM users_roles" +
//           " WHERE users_roles.id = (SELECT users.role FROM users" +
//           " WHERE users.id = " +
//           element +
//           ")"
//       );

//       if (check_user_role[0].length == 0) {
//         return res
//           .json({
//             error: true,
//             message: "Role does not exist",
//           })
//           .end();
//       }

//       if (check_user_role[0][0].role_name !== "Approver") {
//         return res
//           .json({
//             error: true,
//             message: element + " user is not Verifier",
//           })
//           .end();
//       }
//     }

//     for (const element of level_2_user_id) {
//       const check_user_exist = await knex("users").where("id", element);
//       if (check_user_exist.length == 0) {
//         return res.json({
//           error: true,
//           message: "user id " + element + " does not exist",
//         });
//       }

//       const check_user_role = await knex.raw(
//         "SELECT users_roles.role_name FROM users_roles" +
//           " WHERE users_roles.id = (SELECT users.role FROM users" +
//           " WHERE users.id = " +
//           element +
//           ")"
//       );

//       if (check_user_role[0].length == 0) {
//         return res
//           .json({
//             error: true,
//             message: "Role does not exist",
//           })
//           .end();
//       }

//       if (check_user_role[0][0].role_name !== "Approver") {
//         return res
//           .json({
//             error: true,
//             message: element + " user is not Approver",
//           })
//           .end();
//       }
//     }

//     // for (const element of level_3_user_id) {
//     //   const check_user_exist = await knex("users").where("id", element);
//     //   if (check_user_exist.length == 0) {
//     //     return res.json({
//     //       error: true,
//     //       message: "user " + element + " does not exist",
//     //     });
//     //   }

//     //   const check_user_role = await knex.raw(
//     //     "SELECT users_roles.role_name FROM users_roles" +
//     //       " WHERE users_roles.id = (SELECT users.role FROM users" +
//     //       " WHERE users.id = " +
//     //       element +
//     //       ")"
//     //   );

//     //   if (check_user_role[0].length == 0) {
//     //     return res
//     //       .json({
//     //         error: true,
//     //         message: "Role does not exist",
//     //       })
//     //       .end();
//     //   }

//     //   if (check_user_role[0][0].role_name !== "Approver") {
//     //     return res
//     //       .json({
//     //         error: true,
//     //         message: element + " user is not Approver",
//     //       })
//     //       .end();
//     //   }
//     // }

//     // for (const element of level_4_user_id) {
//     //   const check_user_exist = await knex("users").where("id", element);
//     //   if (check_user_exist.length == 0) {
//     //     return res.json({
//     //       error: true,
//     //       message: "user" + element + " does not exist",
//     //     });
//     //   }

//     //   const check_user_role = await knex.raw(
//     //     "SELECT users_roles.role_name FROM users_roles" +
//     //       " WHERE users_roles.id = (SELECT users.role FROM users" +
//     //       " WHERE users.id = " +
//     //       element +
//     //       ")"
//     //   );

//     //   if (check_user_role[0].length == 0) {
//     //     return res
//     //       .json({
//     //         error: true,
//     //         message: "Role does not exist",
//     //       })
//     //       .end();
//     //   }

//     //   if (check_user_role[0][0].role_name !== "Approver") {
//     //     return res
//     //       .json({
//     //         error: true,
//     //         message: element + " user is not Approver",
//     //       })
//     //       .end();
//     //   }
//     // }

//     const insert_data = await knex("approvers").insert({
//       department_id: department_id,
//       level_1_user_id: JSON.stringify(level_1_user_id),
//       level_2_user_id: JSON.stringify(level_2_user_id),
//       approval_hierarchy_id,
//       // level_3_user_id: JSON.stringify(level_3_user_id),
//       // level_4_user_id: JSON.stringify(level_4_user_id),

//       status: status,
//     });

//     // insert level of user in users table
//     const [lev1, arr1] = level_1_user_id;
//     const [lev2, arr2] = level_2_user_id;
//     // const [lev3, arr3] = level_3_user_id;
//     // const [lev4, arr4] = level_4_user_id;
//     const arrr = [lev1, lev2];
//     let i = 1;
//     for (const iterator of arrr) {
//       const insert_data = await knex("users").where({ id: iterator }).update({
//         level: i,
//       });
//       i++;
//     }

//     if (!insert_data) {
//       return res
//         .json({
//           error: true,
//           message: "Record could not be submitted",
//         })
//         .end();
//     }

//     return res.json({
//       error: false,
//       message: "Record submitted successfully",
//       insertedId: insert_data[0],
//     });
//   } catch (error) {
//     return res
//       .json({
//         error: true,
//         message: "Something went wrong",
//         data: JSON.stringify(error),
//       })
//       .end();
//   }
// };

//this is testing for level 1 only
// const createApprovers = async (req, res) => {
//   // try {
//   const schema = Joi.object({
//     department_id: Joi.string().required(),
//     level_1_user_id: Joi.array().items(Joi.number()).required(),
//     status: Joi.string().valid("0", "1").default("1"),
//     approval_hierarchy_id: Joi.number().required(),
//   });

//   console.log("here1");

//   const { error, value } = schema.validate(req.body);
//   if (error) {
//     return res
//       .json({
//         error: true,
//         message: error.details[0].message,
//         data: [],
//       })
//       .end();
//   }

//   const { department_id, level_1_user_id, approval_hierarchy_id, status } =
//     value;

//   const check_department_id = await knex("departments").where({
//     id: department_id,
//   });

//   if (check_department_id.length === 0) {
//     return res
//       .json({
//         error: true,
//         message: "Department does not exist",
//       })
//       .end();
//   }

//   const check_department_name = await knex("approvers").where({
//     department_id: department_id,
//   });

//   if (
//     Array.isArray(check_department_name) &&
//     check_department_name.length !== 0
//   ) {
//     return res.json({
//       error: true,
//       message: "For this department roles are already assigned!!",
//     });
//   }

//   for (const element of level_1_user_id) {
//     const check_user_exist = await knex("users").where("id", element);
//     if (check_user_exist.length === 0) {
//       return res.json({
//         error: true,
//         message: "user " + element + " does not exist",
//       });
//     }

//     const check_user_role = await knex.raw(
//       "SELECT users_roles.role_name FROM users_roles" +
//         " WHERE users_roles.id = (SELECT users.role FROM users" +
//         " WHERE users.id = " +
//         element +
//         ")"
//     );

//     if (check_user_role[0].length === 0) {
//       return res
//         .json({
//           error: true,
//           message: "Role does not exist",
//         })
//         .end();
//     }

//     if (check_user_role[0][0].role_name !== "Approver") {
//       return res
//         .json({
//           error: true,
//           message: element + " user is not Verifier",
//         })
//         .end();
//     }
//   }

//   const insert_data = await knex("approvers2").insert({
//     department_id: department_id,
//     level_1_user_id: JSON.stringify(level_1_user_id),
//     approval_hierarchy_id,
//     status: status,
//   });

//   // insert level of user in users table
//   const [lev1] = level_1_user_id;
//   const arrr = [lev1];
//   let i = 1;
//   for (const iterator of arrr) {
//     const insert_data = await knex("users").where({ id: iterator }).update({
//       level: i,
//     });
//     i++;
//   }

//   if (!insert_data) {
//     return res
//       .json({
//         error: true,
//         message: "Record could not be submitted",
//       })
//       .end();
//   }

//   return res.json({
//     error: false,
//     message: "Record submitted successfully",
//     insertedId: insert_data[0],
//   });
//   // } catch (error) {
//   //   return res
//   //     .json({
//   //       error: true,
//   //       message: "Something went wrong",
//   //       data: JSON.stringify(error),
//   //     })
//   //     .end();
//   // }
// };

//this is with department
// const createApprovers = async (req, res) => {
//   try {
//     const schema = Joi.object({
//       department_id: Joi.string().required(),
//       portal_code: Joi.string().allow(""),
//       level_1_user_id: Joi.array().items(Joi.number()).required(),
//       status: Joi.string().valid("0", "1").default("1"),
//       approval_hierarchy_id: Joi.number().required(),
//     });

//     const { error, value } = schema.validate(req.body);
//     if (error) {
//       return res.status(400).json({
//         error: true,
//         message: error.details[0].message,
//         data: [],
//       });
//     }

//     const {
//       department_id,
//       portal_code,
//       level_1_user_id,
//       approval_hierarchy_id,
//       status,
//     } = value;

//     // Check if the department exists
//     const check_department = await knex("departments").where({
//       id: department_id,
//     });

//     if (check_department.length === 0) {
//       return res.status(404).json({
//         error: true,
//         message: "Department does not exist",
//       });
//     }

//     //check if poratl code exist

//     // const checkPoratalCode = await knex("department_portal_code").where(
//     //   "name",
//     //   portal_code
//     // );

//     // if (checkPoratalCode.length === 0) {
//     //   return res
//     //     .json({
//     //       error: true,
//     //       message: "Department does not exist",
//     //     })
//     //
//     // }

//     //portal code
//     const name = await knex("users")
//       .select("firstname", "lastname")
//       .where({ id: level_1_user_id[0] });
//     if (Array.isArray(name) && name.length == 0) {
//       return res.status(404).json({
//         error: true,
//         message: "No user found.",
//       });
//     }

//     const portal_code2 =
//       portal_code + "-" + name[0].firstname + "-" + name[0].lastname;

//     // Check if roles are already assigned for this department
//     const check_department_roles = await knex("approvers2").where({
//       department_id: department_id,
//     });

//     if (
//       Array.isArray(check_department_roles) &&
//       check_department_roles.length !== 0
//     ) {
//       return res.status(409).json({
//         error: true,
//         message: "Roles are already assigned for this department",
//       });
//     }

//     // Check users and roles
//     for (const element of level_1_user_id) {
//       const check_user_exist = await knex("users").where("id", element);

//       if (check_user_exist.length === 0) {
//         return res.json({
//           error: true,
//           message: "User " + element + " does not exist",
//         });
//       }

//       const check_user_role = await knex.raw(
//         "SELECT users_roles.role_name FROM users_roles" +
//           " WHERE users_roles.id = (SELECT users.role FROM users" +
//           " WHERE users.id = " +
//           element +
//           ")"
//       );

//       if (check_user_role[0].length === 0) {
//         return res.json({
//           error: true,
//           message: "Role does not exist",
//         });
//       }

//       if (check_user_role[0][0].role_name !== "Approver") {
//         return res.json({
//           error: true,
//           message: "User " + element + " is not an Approver",
//         });
//       }
//     }

//     // Insert data into approvers2 table
//     const insert_data = await knex("approvers2").insert({
//       department_id: department_id,
//       portal_code: portal_code2,
//       level_1_user_id: JSON.stringify(level_1_user_id),
//       approval_hierarchy_id,
//       status: status,
//     });

//     const insertPortalCodeTable = await knex("department_portal_code").insert({
//       name: portal_code2,
//       dept_id: department_id,
//     });
//     if (!insertPortalCodeTable) {
//       return res.json({ message: "unable to add" }).end();
//     }

//     // Insert department_id and level into users table
//     for (const [index, userId] of level_1_user_id.entries()) {
//       await knex("users")
//         .where({ id: userId })
//         .update({
//           level: index + 1,
//           approverofdept: department_id,
//         });

//       if (userId) {
//         const modifiedByTable1 = await functions.SetModifiedBy(
//           req.headers["authorization"],
//           "users",
//           "id",
//           userId
//         );
//         console.log("isUpdated:-", modifiedByTable1);
//       }
//     }

//     if (!insert_data) {
//       return res.status(500).json({
//         error: true,
//         message: "Record could not be submitted",
//       });
//     }

//     return res.status(201).json({
//       error: false,
//       message: "Approver created successfully",
//       insertedId: insert_data[0],
//     });
//   } catch (error) {
//     return res.status(500).json({
//       error: true,
//       message: "Could not create record",
//       data: error.message,
//     });
//   }
// };

const createApprovers = async (req, res) => {
  try {

    const { error, value } = validation.create(req.body);
    if (error) {
      return res.status(400).json({
        error: true,
        message: error.details[0].message,
        data: [],
      });
    }

    const {
      department_id,
      portal_code,
      level_1_user_id,
      level_2_user_id,
      approval_hierarchy_id,
      status,
    } = value;

    // Check if the department exists
    const check_department = await knex("departments").where({
      id: department_id,
    });

    if (check_department.length === 0) {
      return res.status(404).json({
        error: true,
        message: "Department does not exist",
      });
    }

    //check if poratl code exist

    // const checkPoratalCode = await knex("department_portal_code").where(
    //   "name",
    //   portal_code
    // );

    // if (checkPoratalCode.length === 0) {
    //   return res
    //     .json({
    //       error: true,
    //       message: "Department does not exist",
    //     })
    //
    // }

    //portal code
    const name = await knex("users")
      .select("firstname", "lastname")
      .where({ id: level_1_user_id[0] });
    if (Array.isArray(name) && name.length == 0) {
      return res.status(404).json({
        error: true,
        message: "No user found.",
      });
    }

    const portal_code2 =
      portal_code + "-" + name[0].firstname + "-" + name[0].lastname;

    // Check if roles are already assigned for this department
    const check_department_roles = await knex("approvers2").where({
      department_id: department_id,
    });

    if (
      Array.isArray(check_department_roles) &&
      check_department_roles.length !== 0
    ) {
      return res.status(409).json({
        error: true,
        message: "Roles are already assigned for this department",
      });
    }

    // Check users and roles
    for (const element of level_1_user_id) {
      const check_user_exist = await knex("users").where("id", element);

      if (check_user_exist.length === 0) {
        return res.json({
          error: true,
          message: "User " + element + " does not exist",
        });
      }

      const check_user_role = await knex.raw(
        "SELECT role.name FROM role" +
          " WHERE role.id = (SELECT users.role_id FROM users" +
          " WHERE users.id = " +
          element +
          ")"
      );

      console.log(check_user_role, "THIS")

      if (check_user_role[0].length === 0) {
        return res.json({
          error: true,
          message: "Role does not exist",
        });
      }

      if (check_user_role[0][0].name !== "Approver") {
        return res.json({
          error: true,
          message: "User " + element + " is not an Approver",
        });
      }
    }
    
    for (const element of level_2_user_id) {
      const check_user_exist = await knex("users").where("id", element);

      if (check_user_exist.length === 0) {
        return res.json({
          error: true,
          message: "User " + element + " does not exist",
        });
      }

      const check_user_role = await knex.raw(
        "SELECT role.name FROM role" +
          " WHERE role.id = (SELECT users.role_id FROM users" +
          " WHERE users.id = " +
          element +
          ")"
      );

      console.log(check_user_role, "THIS")

      if (check_user_role[0].length === 0) {
        return res.json({
          error: true,
          message: "Role does not exist",
        });
      }

      if (check_user_role[0][0].name !== "Approver") {
        return res.json({
          error: true,
          message: "User " + element + " is not an Approver",
        });
      }
    }

    // Insert data into approvers2 table
    const insert_data = await knex("approvers2").insert({
      department_id: department_id,
      portal_code: portal_code2,
      level_1_user_id: JSON.stringify(level_1_user_id),
      level_2_user_id: JSON.stringify(level_2_user_id),
      approval_hierarchy_id,
      status: status,
    });

    const insertPortalCodeTable = await knex("department_portal_code").insert({
      name: portal_code2,
      dept_id: department_id,
    });
    if (!insertPortalCodeTable) {
      return res.json({ message: "unable to add" }).end();
    }

    // Insert department_id and level into users table
    for (const [index, userId] of level_1_user_id.entries()) {
      await knex("users")
        .where({ id: userId })
        .update({
          level: index + 1,
          approverofdept: department_id,
        });

      if (userId) {
        const modifiedByTable1 = await functions.SetModifiedBy(
          req.headers["authorization"],
          "users",
          "id",
          userId
        );
        console.log("isUpdated:-", modifiedByTable1);
      }
    }

    if (!insert_data) {
      return res.status(500).json({
        error: true,
        message: "Record could not be submitted",
      });
    }

    return res.status(201).json({
      error: false,
      message: "Approver created successfully",
      insertedId: insert_data[0],
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: "Could not create record",
      data: error.message,
    });
  }
};
//update for level 1
const updateApprovers = async (req, res) => {
  try {
    const tableName = "approvers2";

    const { error, value } = validation.update(req.body);
    if (error) {
      return res.status(400)
        .json({
          error: true,
          message: error.details[0].message,
          data: [],
        })
        .end();
    }

    const { id, portal_code } = value;

    try {
      await logs.logOldValues(tableName, id, value, req);
    } catch {
      console.log(error);
    }

    // Check if the department exists
    // const check_department = await knex("departments").where({
    //   id: department_id,
    // });

    // if (check_department.length === 0) {
    //   return res
    //     .json({
    //       error: true,
    //       message: "Department does not exist",
    //     })
    //     .end();
    // }

    // // Check if roles are already assigned for this department
    // const check_department_roles = await knex("approvers2").where({
    //   department_id: department_id,
    // });

    // if (
    //   Array.isArray(check_department_roles) &&
    //   check_department_roles.length === 0
    // ) {
    //   return res.json({
    //     error: true,
    //     message: "No roles assigned for this department",
    //   });
    // }

    // Update portal_code in the approvers2 table
    const update_data = await knex("approvers2").where({ id: id }).update({
      portal_code: portal_code,
    });

    if (!update_data) {
      return res.status(500)
        .json({
          error: true,
          message: "Record could not be updated",
        })
        .end();
    }
    if (id) {
      const modifiedByTable1 = await functions.SetModifiedBy(
        req.headers["authorization"],
        "approvers2",
        "id",
        id
      );
      console.log("isUpdated:-", modifiedByTable1);
    }
    const getDeptId = await knex("approvers2")
      .where({ id: id })
      .select("department_id");
    // console.log("this is ",getDeptId);

    const depId = getDeptId[0].department_id;

    const getIdIs = await knex("department_portal_code")
      .where({ dept_id: depId })
      .select("id")
      .first();

    const updationDataIs = await functions.takeSnapShot(
      "department_portal_code",
      getIdIs.id
    );
    // Update portal_code in the department_portal_code table
    const updatePortalCodeTable = await knex("department_portal_code")
      .where({ dept_id: depId })
      .update({
        name: portal_code,
      });

    if (!updatePortalCodeTable) {
      return res.json({ message: "Unable to update portal code" }).end();
    }

    if (depId) {
      const modifiedByTable2 = await functions.SetModifiedBy(
        req.headers["authorization"],
        "department_portal_code",
        "dept_id",
        depId
      );
      console.log("isUpdated:-", modifiedByTable2);
    }
    return res.status(200).json({
      error: false,
      message: "Record updated successfully",
    });
  } catch (error) {
    console.error("Error in updateApproversPortalCode:", error);

    return res.status(500)
      .json({
        error: true,
        message: "Could not update record",
        data:JSON.stringify(error),
      })
      .end();
  }
};

// const updateApprovers = async (req, res) => {
//   try {
//     const schema = Joi.object({
//       id: Joi.number().required(),
//       department_id: Joi.string().required(),
//       level_1_user_id: Joi.array().items(Joi.number()).required(),
//       level_2_user_id: Joi.array().items(Joi.number()).required(),
//       // level_3_user_id: Joi.array().items(Joi.number()).required(),
//       // level_4_user_id: Joi.array().items(Joi.number()).required(),
//     });

//     const { error, value } = schema.validate(req.body);
//     if (error) {
//       return res.json({
//         error: true,
//         message: error.details[0].message,
//         data: [],
//       });
//     }
//     const {
//       id,
//       department_id,
//       level_1_user_id,
//       level_2_user_id,
//       // level_3_user_id,
//       // level_4_user_id,
//     } = value;

//     const check_department_id = await knex("departments").where({
//       id: department_id,
//     });

//     if (check_department_id.length == 0) {
//       return res.json({
//         error: true,
//         message: "Department does not exist",
//       });
//     }

//     const RollId = await knex("users_roles")
//       .where("role_name", "Approver")
//       .select("id")
//       .first();

//     //user roll checking...

//     for (const iterator of level_1_user_id) {
//       const checkUserRoll = await knex("users")
//         .where("id", iterator)
//         .select("role")
//         .first();
//       if (checkUserRoll == undefined) {
//         return res.json({
//           error: true,
//           message: iterator + " user does not exist",
//         });
//       }
//       if (checkUserRoll.role != RollId.id) {
//         return res.json({
//           error: true,
//           message: iterator + " user is not Approver",
//         });
//       }
//     }

//     for (const iterator of level_2_user_id) {
//       const checkUserRoll = await knex("users")
//         .where("id", iterator)
//         .select("role")
//         .first();
//       if (checkUserRoll == undefined) {
//         return res.json({
//           error: true,
//           message: iterator + " user does not exist",
//         });
//       }

//       if (checkUserRoll.role != RollId.id) {
//         return res.json({
//           error: true,
//           message: iterator + " user is not Approver",
//         });
//       }
//     }

//     // for (const iterator of level_3_user_id) {
//     //   const checkUserRoll = await knex("users")
//     //     .where("id", iterator)
//     //     .select("role")
//     //     .first();
//     //   if (checkUserRoll == undefined) {
//     //     return res
//     //       .json({
//     //         error: true,
//     //         message: iterator + " user does not exist",
//     //       })
//     //
//     //   }
//     //   if (checkUserRoll.role != RollId.id) {
//     //     return res
//     //       .json({
//     //         error: true,
//     //         message: iterator + " user is not Approver",
//     //       })
//     //
//     //   }
//     // }

//     // for (const iterator of level_4_user_id) {
//     //   const checkUserRoll = await knex("users")
//     //     .where("id", iterator)
//     //     .select("role")
//     //     .first();

//     //   if (checkUserRoll == undefined) {
//     //     return res
//     //       .json({
//     //         error: true,
//     //         message: iterator + " user does not exist",
//     //       })
//     //
//     //   }
//     //   if (checkUserRoll.role != RollId.id) {
//     //     return res
//     //       .json({
//     //         error: true,
//     //         message: iterator + " user is not Approver",
//     //       })
//     //
//     //   }
//     // }

//     // level_4_user_id.forEach(async(element) => {
//     //   const checkUserRoll = await knex("users").where("id", element).select("role").first();

//     //   if(checkUserRoll==undefined){
//     //     return res.json({
//     //       error:true,
//     //       message: element + " user does not exist",
//     //     })
//     //   }
//     //   if(checkUserRoll.role != RollId.id){
//     //     return res.json({
//     //       error: true,
//     //       message: element + " user  is not Approver",
//     //     })
//     //   }

//     // });

//     const updateRecord = await knex("approvers")
//       .update({
//         level_1_user_id: JSON.stringify(level_1_user_id),
//         level_2_user_id: JSON.stringify(level_2_user_id),
//         // level_3_user_id: JSON.stringify(level_3_user_id),
//         // level_4_user_id: JSON.stringify(level_4_user_id),
//       })
//       .where({ id: id });

//     // insert new updated level of user in users table
//     const [lev1, arr1] = level_1_user_id;
//     const [lev2, arr2] = level_2_user_id;
//     // const [lev3, arr3] = level_3_user_id;
//     // const [lev4, arr4] = level_4_user_id;
//     const arrr = [lev1, lev2];
//     let i = 1;
//     for (const iterator of arrr) {
//       const insert_data = await knex("users").where({ id: iterator }).update({
//         level: i,
//       });
//       i++;
//     }

//     if (!updateRecord) {
//       return res.json({
//         error: true,
//         message: "Record could not be updated",
//       });
//     }

//     return res.json({
//       error: false,
//       message: "Record updated successfully",
//     });
//   } catch (error) {
//     return res.json({
//       error: true,
//       message: "Something went wrong",
//       data: JSON.stringify(error),
//     });
//   }
// };

// const paginateApprovers = async (req, res) => {

//   const searchFrom = ["name"];

//   const schema = Joi.object({
//     offset: Joi.number().default(0),
//     limit: Joi.number().default(50),
//     sort: Joi.string().default("id"),
//     order: Joi.string().valid("asc", "desc").default("desc"),
//     status: Joi.string().valid("0", "1", "").default(""),
//     search: Joi.string().allow("", null).default(null),
//   });

//   const {
//     error,
//     value
//   } = schema.validate(req.body);
//   if (error) {
//     return res.json({
//       error: true,
//       message: error.details[0].message,
//       data: error,
//     });
//   }
//   let total = 0
//   let {
//     offset,
//     limit,
//     order,
//     sort,
//     search,
//     status
//   } = value;
//   let results =await knex("approvers")
//   if (status != undefined && status != "") {
//     total = results.where("status", status);
//   }
//   results = results.where(function () {
//     if (search != undefined && search != "") {
//       searchFrom.forEach((element) => {
//         this.orWhereILike(element, `%${search}%`);
//       });
//     }
//   });
//   total = await results.count("approvers.id as total").first();
//   let rows = await knex("approvers")

//   if (status != undefined && status != "") {
//     rows.where("status", status);
//   }
//   rows = rows.where(function () {
//     if (search != undefined && search != "") {
//       searchFrom.forEach((element) => {
//         this.orWhereILike(element, `%${search}%`);
//       });
//     }
//   });

//   rows = await rows.orderBy(sort, order).limit(limit).offset(offset);
//   let data_rows = [];
//   if (order === "desc") {
//     let sr = offset + 1;
//      rows.forEach((row) => {
//       row.sr = sr;
//       delete row.password;
//       data_rows.push(row);
//       sr++;
//     });
//   } else {
//     let sr = total.total - limit * offset;
//      rows.forEach((row) => {
//       row.sr = sr;
//       delete row.password;
//       data_rows.push(row);
//       sr--;
//     });
//   }

//   await Promise.all(data_rows.map(async (element) => {
//     const temp_ids = JSON.parse(element.approver_1_user_id);
//     let approver_1_names = [];

//     await Promise.all(temp_ids.map(async (element_2) => {
//       const get_name = await knex("users").where("id", element_2).select("username");
//       if (get_name.length > 0) {
//         approver_1_names.push(get_name[0].username);
//       }
//     }));

//     element.approver_1_user_names = approver_1_names;
//   }));

//   await Promise.all(data_rows.map(async (element) => {
//     const temp_ids = JSON.parse(element.approver_2_user_id);
//     let approver_2_names = [];

//     await Promise.all(temp_ids.map(async (element_2) => {
//       const get_name = await knex("users").where("id", element_2).select("username");
//       if (get_name.length > 0) {
//         approver_2_names.push(get_name[0].username);
//       }
//     }));

//     element.approver_2_user_names = approver_2_names;
//   }));

//   data_rows.forEach(element => {
//     const approver_1_user_ids = element.approver_1_user_id
//     element.approver_1_user_id = JSON.parse(approver_1_user_ids)
//     const approver_2_user_ids = element.approver_2_user_id
//     element.approver_2_user_id = JSON.parse(approver_2_user_ids)

//   });

//   for (const iterator of data_rows) {
//     const get_department_name = await knex("departments").where("id", iterator.department_id).select("name")
//     if (get_department_name.length > 0) {
//       iterator.department_name = get_department_name[0].name
//     }

//   }

//   res.status(200).json({
//     error: false,
//     message: "retrieved successfully.",
//     data: {
//       rows: data_rows,
//       total: total.total,
//     },
//   });

// };   do not delete

// const paginateApprovers = async (req, res) => {
//   try {
//     const tableName = "approvers2";
//     const searchFrom = ["department_id"];

//     const schema = Joi.object({
//       offset: Joi.number().default(0),
//       limit: Joi.number().default(50),
//       sort: Joi.string().default("id"),
//       order: Joi.string().valid("asc", "desc").default("desc"),
//       status: Joi.string().valid("0", "1", "").default(""),
//       search: Joi.string().allow("", null).default(null),
//     });

//     const { error, value } = schema.validate(req.body);
//     if (error) {
//       return res.json({
//         error: true,
//         message: error.details[0].message,
//         data: error,
//       });
//     }

//     let total = 0;

//     let { offset, limit, order, sort, search, status } = value;
//     let results = knex(tableName);
//     if (status !== undefined && status !== "") {
//       results = results.where("status", status);
//     }
//     results = results.where(function () {
//       if (search !== undefined && search !== "") {
//         searchFrom.forEach((element) => {
//           this.orWhereILike(element, `%${search}%`);
//         });
//       }
//     });
//     total = await results.count("id as total").first();
//     let rows = knex(tableName);

//     if (status !== undefined && status !== "") {
//       rows.where("status", status);
//     }
//     rows = rows.where(function () {
//       if (search !== undefined && search !== "") {
//         searchFrom.forEach((element) => {
//           this.orWhereILike(element, `%${search}%`);
//         });
//       }
//     });

//     rows = await rows.orderBy(sort, order).limit(limit).offset(offset);
//     let data_rows = [];
//     if (order === "desc") {
//       let sr = offset + 1;
//       for (const row of rows) {
//         row.sr = sr;
//         delete row.password;
//         const getDepartmentName = await knex("departments")
//           .where("id", row.department_id)
//           .select("name");
//         row.department_name = getDepartmentName[0].name;

//         row.level_1_usernames = await fetchUserName.fetchUsernames(
//           knex,
//           JSON.parse(row.level_1_user_id)
//         );

//         const getRecord = await knex("approval_hierarchy").where(
//           "id",
//           row.approval_hierarchy_id
//         );
//         const approvalJson = getRecord[0].approval_level_name;
//         const parsedJson = JSON.parse(approvalJson);

//         row.level_1_name = parsedJson[0]["name"];
//         row.level_2_usernames = await fetchUserName.fetchUsernames(
//           knex,
//           JSON.parse(row.level_2_user_id)
//         );
//         row.level_2_name = parsedJson[1]["name"];
//         // row.level_3_usernames = await fetchUserName.fetchUsernames(
//         //   knex,
//         //   JSON.parse(row.level_3_user_id)
//         // );
//         // row.level_3_name = parsedJson[2]["name"];
//         // row.level_4_usernames = await fetchUserName.fetchUsernames(
//         //   knex,
//         //   JSON.parse(row.level_4_user_id)
//         // );
//         // row.level_4_name = parsedJson[3]["name"];

//         data_rows.push(row);
//         sr++;
//       }
//     } else {
//       let sr = total.total - limit * offset;
//       for (const row of rows) {
//         row.sr = sr;
//         delete row.password;
//         // console.log("this is row",row);
//         const getDepartmentName = await knex("departments")
//           .where("id", row.department_id)
//           .select("name");
//         row.department_name = getDepartmentName[0].name;

//         row.level_1_usernames = await fetchUserName.fetchUsernames(
//           knex,
//           JSON.parse(row.level_1_user_id)
//         );

//         const getRecord = await knex("approval_hierarchy").where(
//           "id",
//           row.approval_hierarchy_id
//         );
//         const approvalJson = getRecord[0].approval_level_name;
//         const parsedJson = JSON.parse(approvalJson);

//         row.level_1_name = parsedJson[0]["name"];
//         row.level_2_usernames = await fetchUserName.fetchUsernames(
//           knex,
//           JSON.parse(row.level_2_user_id)
//         );
//         row.level_2_name = parsedJson[1]["name"];
//         row.level_3_usernames = await fetchUserName.fetchUsernames(
//           knex,
//           JSON.parse(row.level_3_user_id)
//         );
//         row.level_3_name = parsedJson[2]["name"];
//         row.level_4_usernames = await fetchUserName.fetchUsernames(
//           knex,
//           JSON.parse(row.level_4_user_id)
//         );
//         row.level_4_name = parsedJson[3]["name"];

//         data_rows.push(row);
//         sr--;
//       }
//     }
//     res.status(200).json({
//       error: false,
//       message: "Retrieved successfully.",
//       data: {
//         rows: data_rows,
//         total: total.total,
//       },
//     });
//   } catch (error) {
//     return res
//       .json({
//         error: true,
//         message: "Something went wrong",
//         data: JSON.stringify(error),
//       })
//       .end();
//   }
// };

///this is for level 1
const paginateApprovers = async (req, res) => {
  try {
    const tableName = "approvers2";
    const searchFrom = ["department_id"];

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
    let results = knex(tableName);
    if (status != undefined && status != "") {
      total = results.where("status", status);
    }
    results = results.where(function () {
      if (search != undefined && search != "") {
        searchFrom.forEach((element) => {
          this.orWhereILike(element, `%${search}%`);
        });
      }
    });
    total = await results.count("id as total").first();
    let rows = knex(tableName);

    if (status != undefined && status != "") {
      rows.where("status", status);
    }

    rows = rows.where(function () {
      if (search != undefined && search != "") {
        searchFrom.forEach((element) => {
          this.orWhereILike(element, `%${search}%`);
        });
      }
    });

    rows = await rows.orderBy(sort, order).limit(limit).offset(offset);
    let data_rows = [];

    for (const row of rows) {
      delete row.password;
      const getDepartmentName = await knex("departments")
        .where("id", row.department_id)
        .select("name");

      console.log("line 1240", getDepartmentName);
      row.department_name = getDepartmentName[0]?.name;

      // rows.departmentName=getDepartmentName[0].name

      // console.log("this is dept id", getDepartmentName);
      // const conc =
      //   getDepartmentName[0].name + "/" + getDepartmentName[0].portal_code_name;
      // row.department_name = conc;

      row.level_1_usernames = await fetchUserName.fetchUsernames(
        knex,
        JSON.parse(row.level_1_user_id)
      );

      const getRecord = await knex("approval_hierarchy").where(
        "id",
        row.approval_hierarchy_id
      );
      // console.log("this is get records", getRecord);
      // const approvalJson = getRecord[0].approval_level_name;
      // const parsedJson = JSON.parse(approvalJson);
      // console.log("this is parsed json", parsedJson);

      // row.level_1_name = parsedJson[0]["name"];
    }

    if (order === "desc") {
      let sr = offset + 1;
      await rows.forEach((row) => {
        row.sr = sr;
        delete row.password;
        data_rows.push(row);
        sr++;
      });
    } else {
      let sr = total.total - limit * offset;
      await rows.forEach((row) => {
        row.sr = sr;
        delete row.password;
        data_rows.push(row);
        sr--;
      });
    }
    return res.status(200).json({
      error: false,
      message: "retrieved successfully.",
      data: {
        rows: data_rows,
        total: total.total,
      },
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: "Could not load record(s)",
      data: error.message,
    });
  }
};

const getApproverName = async (req, res) => {
  try {

    const validate = validation.getApproverName(req.params);
    if (validate.error) {
      return res.status(400).json({
        error: true,
        message: validate.error.details[0].message,
      });
    }

    const { id } = validate.value;
    const { error, data, message } = await fun.getApproverName(id);

    return res.json({
      error: error,
      message: message,
      data,
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: "Could not load record",
      data: JSON.stringify(error),
    });
  }
};

//work in progress by hp
// const approverTimeline = async (req, res) => {
//   try {
//     const { supplierId, status } = req.body;
//     let query = knex("approval_timeline");
//     if (supplierId) {
//       query = query.where({ supplier_id: supplierId });
//     }

//     let statusFields = [];
//     if (status === "queried") {
//       statusFields = ["queried", "queriedTime", "queriedRemarks"];
//     } else if (status === "approved") {
//       statusFields = ["approved", "approvedTime", "approvedRemarks"];
//     } else if (status === "rejected") {
//       statusFields = ["rejected", "rejectedTime", "rejectedRemarks"];
//     }

//     if (statusFields.length > 0) {
//       query = query.select([
//         "supplier_id",
//         ...statusFields,
//         "created_at",
//         "updated_at",
//       ]);
//     }

//     const getStatus = await query.first();

//     if (!getStatus) {
//       return res.json({
//         error: true,
//         message: "No data found for the provided criteria",
//       });
//     }

//     const result = {};
//     if (statusFields.length > 0) {
//       const getUsername = await knex("users")
//         .where({ id: getStatus[status] })
//         .select("username")
//         .first();

//       result[`${status}By`] = getUsername ? getUsername.username : null;
//       result[`${status}Time`] = getStatus[`${status}Time`];
//       result[`${status}Remarks`] = getStatus[`${status}Remarks`];
//     } else {
//       const queriedByUsername = await knex("users")
//         .where({ id: getStatus.queried })
//         .select("username")
//         .first();
//       const approvedByUsername = await knex("users")
//         .where({ id: getStatus.approved })
//         .select("username")
//         .first();
//       const rejectedByUsername = await knex("users")
//         .where({ id: getStatus.rejected })
//         .select("username")
//         .first();

//       // Assign all fields including usernames if no status is provided
//       result.supplier_id = getStatus.supplier_id;
//       result.queriedBy = queriedByUsername ? queriedByUsername.username : null;
//       result.queriedTime = getStatus.queriedTime;
//       result.queriedRemarks = getStatus.queriedRemarks;
//       result.approvedBy = approvedByUsername
//         ? approvedByUsername.username
//         : null;
//       result.approvedTime = getStatus.approvedTime;
//       result.approvedRemarks = getStatus.approvedRemarks;
//       result.rejectedBy = rejectedByUsername
//         ? rejectedByUsername.username
//         : null;
//       result.rejectedTime = getStatus.rejectedTime;
//       result.rejectedRemarks = getStatus.rejectedRemarks;
//       result.created_at = getStatus.created_at;
//       result.updated_at = getStatus.updated_at;
//     }

//     return res.json({ error: false, data: result });
//   } catch (error) {
//     return res.json({
//       error: true,
//       message: "Something went wrong",
//     });
//   }
// };

const approverTimeline = async (req, res) => {
  try {
    const { supplier_id } = req.body;

    // Check if supplier_id is provided
    if (!supplier_id) {
      return res.status(400).json({
        error: true,
        message: "Supplier ID is required",
      });
    }

    const query = knex("approval_timeline").where({ supplier_id });
    const getStatus = await query;

    if (!getStatus || getStatus.length === 0) {
      return res.status(200).json({
        error: false,
        message: "No Timeline available for this supplier",
      });
    }

    const result = [];

    for (const statusEntry of getStatus) {
      const entryResult = { status: [] }; // Initialize status as an empty array

      entryResult.isEditable = statusEntry.isEditable;
      // Add queried details if available
      const queriedComments = await knex("supplier_query_respond")
        .whereNotNull("approverId")
        .andWhereNot("approverId", 0)
        .andWhere({ supplierId: statusEntry.supplier_id })
        .select(
          "query as remarks",
          "approverId as username",
          knex.raw("COALESCE(NULLIF(respond, ''), 'No response') as respond"),
          "createdAt",
          "updatedAt"
        );

      for (const comment of queriedComments) {
        const getUserName = await knex("users")
          .where({ id: comment.username })
          .first();
        if (getUserName) {
          comment.username = getUserName.username;
          const roleId = getUserName.role_id;
          const getRoleName = await knex("role")
            .where({ id: roleId })
            .select("name")
            .first();
          comment.role = getRoleName.name;
          comment.status = "queried";
          entryResult.status.push(comment);
          entryResult.isEditable;
        }
      }

      // Add approved details if available
      if (statusEntry.approved) {
        const approvedByUsername = await knex("users")
          .where({ id: statusEntry.approved })
          .select("username")
          .first();

        const approvedDetails = {
          status: "approved",
          username: approvedByUsername ? approvedByUsername.username : null,
          approvedTime: statusEntry.approvedTime,
          remarks: statusEntry.approvedRemarks,
          role: "Approver",
          createdAt: statusEntry.approvedTime,
        };

        entryResult.status.push(approvedDetails);
      }

      // Add rejected details if available
      if (statusEntry.rejected) {
        const rejectedByUsername = await knex("users")
          .where({ id: statusEntry.rejected })
          .select("username")
          .first();

        const rejectedDetails = {
          status: "rejected",
          username: rejectedByUsername ? rejectedByUsername.username : null,
          rejectedTime: statusEntry.rejectedTime,
          remarks: statusEntry.rejectedRemarks,
          role: "Approver",
          createdAt: statusEntry.rejectedTime,
        };

        entryResult.status.push(rejectedDetails);
      }

      result.push(entryResult);
    }

    // Get pending status after updating data if available
    const getSupplierId = await knex("approval_timeline")
      .where({ supplier_id: supplier_id })
      .select("supplier_id")
      .first();
    const supId = getSupplierId.supplier_id;

    const getPendingStatus = await knex("supplier_details")
      .where({ id: supId })
      .andWhere("status", "pending")
      .select("status", "status_update_date")
      .first();
    const statusInSupplierDetails = getPendingStatus?.status;

    if (statusInSupplierDetails && statusInSupplierDetails.trim() !== "") {
      result.forEach((entryResult) => {
        entryResult.status.push({
          status: "pending",
          username: null,
          remarks: statusInSupplierDetails,
          role: "Pending",
          createdAt: null,
        });
      });
    }

    return res.status(200).json({ error: false, data: result });
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: "Could not load record(s)",
      data: JSON.stringify(error),
    });
  }
};

const delteMultipleRecords=async(req,res)=>{
  try {
    const tableName = "approvers2";
    const { ids } = req.body;
  
    const result = await fun.bulkDeleteRecords(tableName, ids, req);
    console.log("this is result",result)
  
    if (result.error) {
      return res.status(400).json({
        error: true,
        message: "Failed to delete one or more records",
        errors: result.errors,
        deltedIds:result.messages,
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
        message: "Could not delete record.",
        data: JSON.stringify(error),
      });
    }
}

export default {
  createApprovers,
  updateApprovers,
  viewApprovers,
  deleteApprovers,
  paginateApprovers,
  getApproverName,
  approverTimeline,
  delteMultipleRecords
};
