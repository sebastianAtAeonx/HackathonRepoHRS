import knex from "../../config/mysql_db.js";
import logs from "../../middleware/logs.js";
import functions from "../../helpers/functions.js";
import validation from "../../validation/admin/approver.js";;

const createApprover = async (req, res) => {
  try {
    const { error, value } = validation.create(req.body);

    if (error) {
      return res.status(400).json({
        error: true,
        message: error.details[0].message,
      });
    }

    const { department_id, levels } = value;

    // Check if department exists
    const check_department_id = await knex("departments").where({
      id: department_id,
    });

    if (check_department_id.length === 0) {
      return res.status(404).json({
        error: true,
        message: "Department does not exist",
      });
    }

    // Insert records into approverTest table
    for (const level of levels) {
      const { approvers } = level;
      for (const approverId of approvers) {
        await knex("approverTest").insert({
          departmentId: department_id,
          userId: approverId,
          level: level.level,
        });

        await knex("users").where("id", approverId).update({
          approverofdept: department_id,
        });
      }
    }

    return res.status(201).json({
      error: false,
      message: "Approvers created successfully",
    });
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({
      error: true,
      message: "Could not create record.",
      data: JSON.stringify(error),
    });
  }
};

// const getApprovers = async (req, res) => {
//   try {
//     const schema = Joi.object({
//       department_id: Joi.string().optional(),
//       offset: Joi.number().optional(),
//       limit: Joi.number().optional(),
//     });

//     const { error, value } = schema.validate(req.body);
//     if (error) {
//       return res.json({
//         error: true,
//         message: error.details[0].message,
//       });
//     }
//     const { department_id, offset = 0, limit = 10 } = value;

//     let approversQuery = knex("approverTest")
//       .select(
//         "approverTest.level",
//         "approverTest.userId",
//         "users.username",
//         "approverTest.departmentId"
//       )
//       .leftJoin("users", "approverTest.userId", "users.id");

//     // Apply department_id filter if provided
//     if (department_id) {
//       approversQuery = approversQuery.where(
//         "approverTest.departmentId",
//         department_id
//       );
//     }

//     // Retrieve all levels
//     const approvers = await approversQuery;

//     // Group approvers by department, level, and user ID
//     const groupedData = {};
//     approvers.forEach((approver) => {
//       const { departmentId, level, userId, username } = approver;
//       if (!groupedData[departmentId]) {
//         groupedData[departmentId] = {};
//       }
//       const adjustedLevel = level - 1; // Adjust level index to start from 0
//       if (!groupedData[departmentId][adjustedLevel]) {
//         groupedData[departmentId][adjustedLevel] = [];
//       }
//       groupedData[departmentId][adjustedLevel].push({
//         id: userId,
//         name: username,
//       });
//     });

//     // Convert groupedData to array for pagination
//     const departmentIds = Object.keys(groupedData);

//     // Paginate department IDs
//     const paginatedDepartmentIds = departmentIds.slice(offset, offset + limit);

//     // Construct the response data for paginated department IDs
//     const data = await Promise.all(
//       paginatedDepartmentIds.map(async (departmentId) => {
//         const departmentName = await knex("departments")
//           .select("name")
//           .where("id", departmentId)
//           .first();
//         return {
//           department: {
//             id: departmentId,
//             name: departmentName ? departmentName.name : null,
//           },
//           approvers: groupedData[departmentId] || {},
//         };
//       })
//     );

//     return res.json({
//       error: false,
//       message: "Approvers found successfully",
//       count: departmentIds.length,
//       data: data,
//     });
//   } catch (error) {
//     console.error("Error:", error);
//     return res.status(500).json({
//       error: true,
//       message: "Internal server error",
//     });
//   }
// };

const getApprovers = async (req, res) => {
  try {
    const { error, value } = validation.paginate(req.body);
    if (error) {
      return res.status(400).json({
        error: true,
        message: error.details[0].message,
      });
    }
    const {
      department_id,
      offset = 0,
      limit = 10,
      search,
      sort,
      order,
    } = value;

    let approversQuery = knex("approverTest")
      .select(
        "approverTest.level",
        "approverTest.userId",
        "users.username",
        "approverTest.departmentId"
      )
      .leftJoin("users", "approverTest.userId", "users.id")
      .leftJoin("departments", "approverTest.departmentId", "departments.id");

    if (department_id) {
      approversQuery = approversQuery.where(
        "approverTest.departmentId",
        department_id
      );
    }

    if (search) {
      approversQuery = approversQuery
        .where("users.username", "like", `%${search}%`)
        .orWhere("departments.name", "like", `%${search}%`);
    }

    if (sort && order) {
      approversQuery = approversQuery.orderBy(sort, order);
    }

    const approvers = await approversQuery;

    const groupedData = {};
    approvers.forEach((approver) => {
      const { departmentId, level, userId, username } = approver;
      if (!groupedData[departmentId]) {
        groupedData[departmentId] = {};
      }
      const adjustedLevel = level - 1;
      if (!groupedData[departmentId][adjustedLevel]) {
        groupedData[departmentId][adjustedLevel] = [];
      }
      groupedData[departmentId][adjustedLevel].push({
        id: userId,
        name: username,
      });
    });

    const departmentIds = Object.keys(groupedData);
    const paginatedDepartmentIds = departmentIds.slice(offset, offset + limit);

    const data = await Promise.all(
      paginatedDepartmentIds.map(async (departmentId) => {
        const departmentName = await knex("departments")
          .select("name")
          .where("id", departmentId)
          .first();
        return {
          department: {
            id: departmentId,
            name: departmentName ? departmentName.name : null,
          },
          approvers: groupedData[departmentId] || {},
        };
      })
    );

    return res.status(200).json({
      error: false,
      message: "Approvers found successfully",
      count: departmentIds.length,
      data: data,
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: "Could not fetch record.",
      data: JSON.stringify(error),
    });
  }
};

const updateApprover = async (req, res) => {
  try {
    const tableName="approverTest"
    const { error, value } = validation.update(req.body);

    if (error) {
      return res.status(400).json({
        error: true,
        message: error.details[0].message,
      });
    }

    const { department_id, levels } = value;

    try {
      await logs.logOldValuesForApprover(tableName, department_id, value, req);
    } catch {
      console.log(error);
    }

    // Check if department exists
    const check_department_id = await knex("departments").where({
      id: department_id,
    });

    if (check_department_id.length === 0) {
      return res.status(404).json({
        error: true,
        message: "Department does not exist",
      });
    }

    // Delete records from approverTest table
    await knex("approverTest").where("departmentId", department_id).del();

    // // Delete records from users table
    // await knex('users').where('approverofdept', department_id).update({
    //     approverofdept: null
    // });

    // Insert records into approverTest table
    for (const level of levels) {
      const { approvers } = level;
      for (const approverId of approvers) {
        await knex("approverTest").insert({
          departmentId: department_id,
          userId: approverId,
          level: level.level,
        });

        await knex("users").where("id", approverId).update({
          approverofdept: department_id,
        });
      }
    }

    return res.status(200).json({
      error: false,
      message: "Approvers Update successfully",
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: "Could not update record.",
      data: JSON.stringify(error),
    });
  }
};

const deleteApprover = async (req, res) => {
  try {
    const tableName="approverTest"
    const { error, value } = validation.del(req.params);
    if (error) {
      return res.status(400).json({
        error: true,
        message: error.details[0].message,
      });
    }
    const { department_id } = value;
    try {
      await logs.logOldValues(tableName, department_id, value, req);
    } catch {
      console.log(error);
    }

    await knex("approverTest").where("departmentId", department_id).del();
    return res.status(200).json({
      error: false,
      message: "Approvers Deleted successfully",
    });
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({
      error: true,
      message: "Could not delete record.",
      data: JSON.stringify(error),
    });
  }
};

const delteMultipleRecords = async (req, res) => {
  try {
    const tableName = "approverTest";
    const { ids } = req.body;
    const result = await functions.bulkDeleteRecords(tableName, ids, req);
    if (result.error) {
      return res.status(400).json({
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
      message: "Could not delete record.",
      data: JSON.stringify(error),
    });
  }
};
const listForAssignApprover = async (req, res) => {
  try {
    const getUserIds = await knex("approverTest").select("userId");

    const userIds = getUserIds.map(user => user.userId);

    const approverList = await knex("users")
      .where({ role_id: 16 })
      .whereNotIn("id", userIds);

    return res.json({
      error: false,
      message: "Approver list retrieved successfully",
      data: approverList,
      total:approverList.length
    });
  } catch (error) {
    console.error("Error retrieving approver list:", error);
    return res.status(500).json({
      error: true,
      message: "An error occurred while retrieving the approver list",
    });
  }
};


export default {
  createApprover,
  getApprovers,
  updateApprover,
  deleteApprover,
  delteMultipleRecords,
  listForAssignApprover,
};
