import md5 from "md5";
import knex from "../config/mysql_db.js";
import fun from "../helpers/functions.js";
import constant from "../helpers/constants.js";
import CryptoJS from "crypto-js";
import jwt from "jsonwebtoken";
import moment from "moment-timezone";
import functions from "../helpers/functions.js";
import validation from "../validation/users.js";

function validatePassword(password) {
  // Regular expression to match a strong password with the following rules:
  // - At least 8 characters
  // - Contains at least one uppercase letter
  // - Contains at least one lowercase letter
  // - Contains at least one number
  // - Contains at least one special character (such as !@#$%^&*)
  const passwordRegex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,}$/;

  if (!passwordRegex.test(password)) {
    return "Password should be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character.";
  }
  return "valid";
}

const createUsers = async (req, res) => {
  const tableName = "users";

  try {
    const { error, value } = validation.create(req.body);
    if (error) {
      return res.json({
        error: true,
        message: error.details[0].message,
        data: JSON.stringify(error),
      });
    }

    const {
      username,
      firstname,
      lastname,
      email,
      password,
      status,
      role,
      // role_id,
      location,
    } = value;

    if (fun.validateEmail(email)) {
      console.log("Email is valid");
    } else {
      console.log("Email is invalid");
      return res.json({ error: true, message: "Email is invalid" }).end();
    }

    const check_password_complexity = validatePassword(password);

    if (check_password_complexity != "valid") {
      return res.json({
        error: true,
        message: check_password_complexity,
      });
    }

    const email_result = await knex(tableName).where({
      email: email,
    });
    if (Array.isArray(email_result) && email_result.length != 0) {
      return res.json({
        error: true,
        message: "email alredy exist",
      });
    }

    const username_result = await knex(tableName).where({
      username: username,
    });
    if (Array.isArray(username_result) && username_result.length != 0) {
      return res.json({
        error: true,
        message: "username alredy exist",
      });
    }

    const timestampis = knex.fn.now();
    const created = timestampis;
    const hashedPassword = md5(password);
    const insertId = await knex(tableName).insert({
      username,
      firstname,
      lastname,
      email: email,
      password: hashedPassword,
      status,
      role_id : role,
      // role_id,
      location: location,
      created,
    });
    if (!insertId) {
      return res.json({
        error: true,
        message: "User not created",
      });
    }
    return res.json({
      error: false,
      message: "User created",
      data: {
        insertId,
      },
    });
  } catch (error) {
    fun.sendErrorLog(req, error);
    return res.json({
      error: true,
      message: "Something went wrong.",
      data: {
        error: JSON.stringify(error),
      },
    });
  }
};

const viewUsers = async (req, res) => {
  const tableName = "users";
  try {
    const { error, value } = validation.view(req.params);
    if (error) {
      return res.json({
        error: true,
        message: error.details[0].message,
        data: error,
      });
    }

    const { id } = value;
    const result = await knex("users")
      .join("role", "role.id", "users.role_id")
      .where("users.id", id)
      .select(
        "users.username",
        "users.firstname",
        "users.lastname",
        "users.email",
        "users.status",
        "users.role_id as roleid",
        "role.name as role_name"
      );

      console.log("result:",result);

    if (result == "") {
      return res.json({
        error: true,
        message: "Record not found",
      });
    }

    return res.json({
      error: false,
      data: result,
    });
  } catch (error) {
    fun.sendErrorLog(req, error);
    return res.json({
      error: true,
      message: "Something went wrong.",
      data: {
        error: JSON.stringify(error),
      },
    });
  }
};

const updateUsers = async (req, res) => {
  const tableName = "users";

  try {
    const { error, value } = validation.update(req.body);
    if (error) {
      return res.json({
        error: true,
        message: error.details[0].message,
        data: JSON.stringify(error),
      });
    }

    const {
      id,
      username,
      firstname,
      lastname,
      email,
      password,
      status,
      role,
      location,
    } = value;

    if (fun.validateEmail(email)) {
      console.log("Email is valid");
    } else {
      console.log("Email is invalid");
      return res.json({ error: true, message: "Email is invalid" }).end();
    }

    const email_check = await knex(tableName)
      .where({
        email: email,
      })
      .where("id", "!=", id);
    if (Array.isArray(email_check) && email_check.length != 0) {
      return res.json({
        error: true,
        message: "Record with this email already exist",
      });
    }

    const username_check = await knex(tableName)
      .where({
        username: username,
      })
      .where("id", "!=", id);
    if (Array.isArray(username_check) && username_check.length != 0) {
      return res.json({
        error: true,
        message: "Record with this username already exist",
      });
    }

    const hashedPassword = md5(password);

    const timestampis = knex.fn.now();
    const updated = timestampis;

    const updationDataIs = await functions.takeSnapShot(tableName,id);

    const insertId = await knex(tableName)
      .where({
        id: id,
      })
      .update({
        username,
        firstname,
        lastname,
        email: email,
        password: hashedPassword,
        status,
        role,
        location: location,
        updated,
      });

    if (!insertId) {
      return res.json({
        error: true,
        message: "Update failed",
      });
    }
    if(id){
    const modifiedByTable1 = await functions.SetModifiedBy(req.headers["authorization"],"users","id",id);
      console.log("isUpdated:-", modifiedByTable1);
  }
    return res.json({
      error: false,
      message: "User updated successfully",
      data: {
        updated_id: id,
      },
    });
  } catch (error) {
    fun.sendErrorLog(req, error);
    return res.json({
      error: true,
      message: "Something went wrong.",
      data: {
        error: JSON.stringify(error),
      },
    });
  }
};

const updateProfile = async (req, res) => {
  const tableName = "users";
  try {
    const token = req.headers["authorization"];
    if (!token) {
      return res.json({
        error: true,
        message: "Token is required.",
      });
    }
    const { jwtConfig } = constant;
    const payload = jwt.decode(token.split(" ")[1], jwtConfig.secret);
    const statusChanger = payload.permissions[0];
    const statusChangerId = payload.id;
    const emailStatuschanger = payload.email;
    const { error, value } = validation.updateProfile(req.body);
    if (error) {
      return res.json({
        error: true,
        message: error.details[0].message,
        data: JSON.stringify(error),
      });
    }

    const { id, username, firstname, lastname, email, status } = value;

    if (fun.validateEmail(email)) {
      console.log("Email is valid");
    } else {
      console.log("Email is invalid");
      return res.json({ error: true, message: "Email is invalid" }).end();
    }

    const email_check = await knex(tableName)
      .where({
        email: email,
      })
      .where("id", "!=", id);
    if (Array.isArray(email_check) && email_check.length != 0) {
      return res.json({
        error: true,
        message: "Record with this email already exist",
      });
    }

    const username_check = await knex(tableName)
      .where({
        username: username,
      })
      .where("id", "!=", id);
    if (Array.isArray(username_check) && username_check.length != 0) {
      return res.json({
        error: true,
        message: "Record with this username already exist",
      });
    }

    if (statusChangerId === id) {
      const timestampis = knex.fn.now();
      const updated = timestampis;

      const updationDataIs = await functions.takeSnapShot(tableName,id);
      const insertId = await knex(tableName)
        .where({
          id: id,
        })
        .update({
          username,
          firstname,
          lastname,
          email: email,
          status,
          updated,
        });

      if (!insertId) {
        return res.json({
          error: true,
          message: "Update failed",
        });
      }

      if(id){
      const modifiedByTable1 = await functions.SetModifiedBy(req.headers["authorization"],"users","id",id);
      console.log("isUpdated:-", modifiedByTable1);
    }
      return res.json({
        error: false,
        message: "User updated successfully",
        data: {
          updated_id: id,
        },
      });
    }
    return res
      .json({
        error: true,
        message: "Unauthorized",
      })
      .end();
  } catch (error) {
    fun.sendErrorLog(req, error);
    return res.json({
      error: true,
      message: "Something went wrong.",
      data: {
        error: JSON.stringify(error),
      },
    });
  }
};

const deleteUsers = async (req, res) => {
  const tableName = "users";
  try {

    const { error, value } = validation.del(req.params);
    if (error) {
      return res.json({
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
      .delete();
      // .update('isDeleted', 1); 

    if (result) {
      return res.json({
        error: false,
        message: "Record deleted successfully",
      });
    } else {
      return res.json({
        error: true,
        message: "Record not found",
      });
    }
  } catch (error) {
    fun.sendErrorLog(req, error);
    return res.json({
      error: true,
      message: "Something went wrong.",
      data: {
        error: JSON.stringify(error),
      },
    });
  }
};

//for old permission module
// const paginateUsers = async (req, res) => {
//   try {
//     const tableName = "users";
//     const searchFrom = ["username", "firstname", "lastname"];

//     const schema = Joi.object({
//       offset: Joi.number().default(0),
//       limit: Joi.number().default(50),
//       sort: Joi.string().default("id"),
//       order: Joi.string().valid("asc", "desc").default("desc"),
//       status: Joi.string().valid("0", "1", "").default(""),
//       search: Joi.string().allow("", null).default(null),
//       role: Joi.string().allow("", null).default(null), // New role filter
//       department: Joi.string().allow("", null).default(null), // New department filter
//     });

//     const { error, value } = schema.validate(req.body);
//     if (error) {
//       return res.json({
//         error: true,
//         message: error.details[0].message,
//         data: error,
//       });
//     }

//     const getUserRoleNo = await knex("users_roles")
//       .where("role_name", "Supplier")
//       .first();
//     let rollno = 0;
//     if (getUserRoleNo != undefined) {
//       rollno = getUserRoleNo.id;
//     }

//     let { offset, limit, order, sort, search, status, role, department } = value;
//     let results = knex("users")
//       .join("users_roles", "users_roles.id", "users.role")
//       .leftJoin("departments", "users.approverofdept", "departments.id")
//       .select("users.*", "users_roles.role_name", "departments.name")
//       .whereNot("users.role", rollno);

//     // Apply role filter
//     if (role) {
//       results = results.where("users.role", role);
//     }

//     // Apply department filter
//     if (department) {
//       results = results.where("departments.id", department);
//     }

//     let total = 0;
//     if (status != undefined && status != "") {
//       total = results.where("users.status", status);
//     }

//     results = results.where(function () {
//       if (search != undefined && search != "") {
//         searchFrom.forEach((element) => {
//           this.orWhereILike(element, `%${search}%`);
//         });
//       }
//     });

//     total = await results.count("users.id as total").first();

//     let rows = knex("users")
//       .join("users_roles", "users_roles.id", "users.role")
//       .leftJoin("departments", "users.approverofdept", "departments.id")
//       .select("users.*", "users_roles.role_name", "departments.name")
//       .whereNot("users.role", rollno);

//     // Apply status filter
//     if (status != undefined && status != "") {
//       rows = rows.where("users.status", status);
//     }

//     // Apply role filter
//     if (role) {
//       rows = rows.where("users.role", role);
//     }

//     // Apply department filter
//     if (department) {
//       rows = rows.where("departments.id", department);
//     }

//     rows = rows.where(function () {
//       if (search != undefined && search != "") {
//         searchFrom.forEach((element) => {
//           this.orWhereILike(element, `%${search}%`);
//         });
//       }
//     });

//     rows = await rows.orderBy(sort, order).limit(limit).offset(offset);

//     for (const currentrow of rows) {
//       const getLocationName = await knex("plants")
//         .where("id", currentrow.location)
//         .first()
//         .select("name");
//       if (getLocationName != undefined) {
//         currentrow.location_name = getLocationName.name;
//       }
//     }

//     let data_rows = [];
//     if (order === "desc") {
//       let sr = offset + 1;
//       await rows.forEach((row) => {
//         row.sr = sr;
//         delete row.password;
//         data_rows.push(row);
//         sr++;
//       });
//     } else {
//       let sr = offset + 1;
//       await rows.forEach((row) => {
//         row.sr = sr;
//         delete row.password;
//         data_rows.push(row);
//         sr++;
//       });
//     }
//     return res.status(200).json({
//       error: false,
//       message: "retrieved successfully.",
//       data: {
//         rows: data_rows,
//         total: total.total,
//       },
//     });
//   } catch (error) {
//     fun.sendErrorLog(req, error);
//     return res.json({
//       error: true,
//       message: "Something went wrong.",
//       data: {
//         error: JSON.stringify(error),
//       },
//     });
//   }
// };

const paginateUsers = async (req, res) => {
  try {
    const tableName = "users";
    const searchFrom = ["username", "firstname", "lastname"];
    const { error, value } = validation.paginate(req.body);
    if (error) {
      return res.json({
        error: true,
        message: error.details[0].message,
        data: error,
      });
    }

    const getUserRoleNo = await knex("role")
      .where("name", "Supplier")
      .first();
    let rollno = 0;
    if (getUserRoleNo != undefined) {
      rollno = getUserRoleNo.id;
    }

    let { offset, limit, order, sort, search, status, role, department,roleName } = value;
    let results = knex("users")
      .join("role", "role.id", "users.role_id")
      .leftJoin("departments", "users.approverofdept", "departments.id")
      .select("users.*", "role.name as role_name", "departments.name")
      .whereNot("users.role_id", rollno);


      
    // Apply role filter
    if (role) {
      results = results.where("users.role_id", role);
    }

    if(roleName){
      const getRoleId = await knex('role').where('name',roleName).select('id').first()
      if(getRoleId){
        results = results.where('users.role_id', getRoleId.id)
      }
      }

    // Apply department filter
    if (department) {
      results = results.where("departments.id", department);
    }

    let total = 0;
    if (status != undefined && status != "") {
      total = results.where("users.status", status);
    }

    results = results.where(function () {
      if (search != undefined && search != "") {
        searchFrom.forEach((element) => {
          this.orWhereILike(element, `%${search}%`);
        });
      }
    });

    total = await results.count("users.id as total").first();

    let rows = knex("users")
      .join("role", "role.id", "users.role_id")
      .leftJoin("departments", "users.approverofdept", "departments.id")
      .select("users.*", "role.name as role_name", "departments.name ")
      .whereNot("users.role_id", rollno);

    // Apply status filter
    if (status != undefined && status != "") {
      rows = rows.where("users.status", status);
    }

    // Apply role filter
    if (role) {
      rows = rows.where("users.role_id", role);
    }

    // Apply department filter
    if (department) {
      rows = rows.where("departments.id", department);
    }

    rows = rows.where(function () {
      if (search != undefined && search != "") {
        searchFrom.forEach((element) => {
          this.orWhereILike(element, `%${search}%`);
        });
      }
    });

    rows = await rows.orderBy(sort, order).limit(limit).offset(offset);

    for (const currentrow of rows) {
      const getLocationName = await knex("plants")
        .where("id", currentrow.location)
        .first()
        .select("name");
      if (getLocationName != undefined) {
        currentrow.location_name = getLocationName.name;
      }
    }

    let data_rows = [];
    if (order === "desc") {
      let sr = offset + 1;
      await rows.forEach((row) => {
        row.sr = sr;
        delete row.password;
        data_rows.push(row);
        sr++;
      });
    } else {
      let sr = offset + 1;
      await rows.forEach((row) => {
        row.sr = sr;
        delete row.password;
        data_rows.push(row);
        sr++;
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
    fun.sendErrorLog(req, error);
    return res.json({
      error: true,
      message: "Something went wrong.",
      data: {
        error: JSON.stringify(error),
      },
    });
  }
};


const changePassword = async (req, res) => {
  try {
    const token = req.headers["authorization"];
    if (!token) {
      return res.json({
        error: true,
        message: "Token is required.",
      });
    }
    const { jwtConfig } = constant;
    const payload = jwt.decode(token.split(" ")[1], jwtConfig.secret);
    const statusChanger = payload.permissions[0];
    const statusChangerId = payload.id;
    const emailStatuschanger = payload.email;

    const { error, value } = validation.changePassword(req.body);

    if (error) {
      return res.json({
        error: true,
        message: error.details[0].message,
      });
    }

    const { id, email, old_password, new_password } = value;

    //check if oldpassword in correct or not
    const getOldPassword = await knex("users")
      .where({ id: id })
      .select("password")
      .first();
    if (!getOldPassword) {
      return res.json({
        error: true,
        message: "password not found",
      });
    }
    const check_password_complexity = validatePassword(new_password);
    if (check_password_complexity != "valid") {
      return res.json({
        error: true,
        message: check_password_complexity,
      });
    }

    const hashedPassword = md5(new_password);
    const hasedOldPassword = md5(old_password);

    //comparing old and newpassword
    if (hashedPassword === hasedOldPassword) {
      return res.json({
        error: true,
        message: "New password must be different from the old password",
      });
    }

    if (statusChangerId == id) {
      if (hasedOldPassword == getOldPassword.password) {

        const getIds = await knex("users").where({id:id, email:email}).first();
        const updationDataIs = await functions.takeSnapShot("users",getIds.id);

        const updatePassword = await knex("users")
          .where({ id: id, email: email })
          .update({ password: hashedPassword });

        if (!updatePassword) {
          return res.json({
            error: true,
            message: "Email is not valid",
          });
        }

        if(id){
        const modifiedByTable1 = await functions.SetModifiedBy(req.headers["authorization"],"users","id",id);
        console.log("isUpdated:-", modifiedByTable1);
      }
        return res.json({
          error: false,
          message: "Password updated successfully",
        });
      } else {
        return res
          .json({
            error: true,
            message: "Old passoword is incorrect",
          })
          .end();
      }
    }
    return res
      .json({
        error: true,
        message: "Unauthorized",
      })
      .end();
  } catch (error) {
    fun.sendErrorLog(req, error);
    return res.json({
      error: true,
      message: "Something went wrong.",
      data: { error: JSON.stringify(error) },
    });
  }
};
//specific user activity
const userActivity = async (req, res) => {
  try {
    const userId = req.params.id;
    const userActivities = fun.getUserActivities(userId);

    console.log("user", userActivities);
    // Respond with the activities
    res.json(await userActivities);
  } catch (error) {
    return res.json({
      error: true,
      message: "something went wrong",
    });
  }
};

//all user activity
//---without pagination---////
// const allUserActivity = async (req, res) => {
//   try {
//     const getAllUserActivity = await knex("logs").select(
//       "userId",
//       "emailId",
//       "activities",
//     );

//     const getAllIds=getAllUserActivity.map(i=>i.userId)
//     console.log("ids",getAllIds)

//     const getUserNames=await knex("users").whereIn("id",getAllIds).select("id","username")

//     const parsedUserActivities = getAllUserActivity.map(user => {
//       const activities = user.activities ? JSON.parse(user.activities) : [];

//       const userName = getUserNames.find(u => u.id === user.userId);
//       const username = userName ? userName.username : null;

//       return {
//         userId: user.userId,
//         username: username,
//         emailId: user.emailId,
//         activities: activities
//       };
//     });

//     const totalRecords=parsedUserActivities.length
//     return res.json({
//       error: false,
//       results: parsedUserActivities,
//       totalRecord:totalRecords
//     });
//   } catch (error) {
//     return res.json({ error: true, message: "something went wrong" });
//   }
// };

// const allUserActivity = async (req, res) => {
//   try {
//     const schema = Joi.object({
//       offset: Joi.number().required(),
//       limit: Joi.number().required(),
//       sort: Joi.string().valid("userId", "emailId").default("userId"),
//       order: Joi.string().valid("asc", "desc").default("desc"),
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

//     const { offset, limit, sort, order, search } = value;

//     let query = knex("logs").select("userId", "emailId", "activities");

//     if (search) {
//       query.where(function () {
//         this.where("userId", "like", `%${search}%`).orWhere(
//           "emailId",
//           "like",
//           `%${search}%`
//         );
//       });
//     }

//     const totalRecords = await query.clone().count("* as totalRecords").first();

//     const userActivities = await query
//       .orderBy(sort, order)
//       .limit(limit)
//       .offset(offset);

//     const userIds = userActivities.map((activity) => activity.userId);

//     const getUserNames = await knex("users")
//       .whereIn("id", userIds)
//       .select("id", "username");

//     const parsedUserActivities = userActivities.map((user, index) => {
//       const activities = user.activities ? JSON.parse(user.activities) : [];

//       const userName = getUserNames.find((u) => u.id === user.userId);
//       const username = userName ? userName.username : null;

//       return {
//         userId: user.userId,
//         username: username,
//         emailId: user.emailId,
//         activities: activities,
//         totalEndPointAccessed: activities.length,
//         srNo: index + 1,
//       };
//     });
//     return res.json({
//       error: false,
//       data: parsedUserActivities,
//       totalRecord: totalRecords.totalRecords,
//     });
//   } catch (error) {
//     return res.json({ error: true, message: "something went wrong" });
//   }
// };

const allUserActivity = async (req, res) => {
  try {
    const { error, value } = validation.allUserActivity(req.body);
    if (error) {
      return res.json({
        error: true,
        message: error.details[0].message,
        data: error,
      });
    }

    const { offset, limit, sort, order, search } = value;

    let query = knex("logs").select("userId", "emailId", "activities");

    if (search) {
      query.where(function () {
        this.where("userId", "like", `%${search}%`).orWhere(
          "emailId",
          "like",
          `%${search}%`
        );
      });
    }

    const totalRecords = await query.clone().count("* as totalRecords").first();

    console.log("Total Records:", totalRecords);

    const userActivities = await query
      .orderBy(sort, order)
      .limit(limit)
      .offset(offset);

    // Parse activities field from JSON string to object and move userId and emailId inside each activity
    let srNo = offset + 1; // Initialize srNo with the starting index
    const activities = userActivities.reduce((acc, curr) => {
      const parsedActivities = JSON.parse(curr.activities).map((a) => ({
        ...a,
        userId: curr.userId,
        emailId: curr.emailId,
        srNo: srNo++,
      }));
      return acc.concat(parsedActivities);
    }, []);

    return res.json({
      error: false,
      data: {
        activities: activities,
        totalRecord: activities.length,
      },
    });
  } catch (error) {
    console.error("Error:", error);
    return res.json({ error: true, message: "Something went wrong" });
  }
};

///this is working with filter
// const newAllUserActivity = async (req, res) => {
//   try {
//     const tableName = "logstest";
//     const searchFrom = ["activity_type", "route", "response"]; // Specify columns for search

//     const schema = Joi.object({
//       offset: Joi.number().default(0),
//       limit: Joi.number().default(10),
//       sort: Joi.string().default("timestamp"),
//       order: Joi.string().valid("asc", "desc").default("desc"),
//       search: Joi.string().allow("", null).default(null),
//       filter: Joi.object({
//         startDate: Joi.date().iso().optional(),
//         endDate: Joi.date().iso().optional(),
//       }).optional(),
//     });

//     const { error, value } = schema.validate(req.body); // Assuming the request body is used for validation

//     if (error) {
//       return res.status(400).json({
//         error: true,
//         message: error.details[0].message,
//         data: error,
//       });
//     }

//     let { offset, limit, order, sort, search, filter } = value;

//     let results = knex(tableName)
//       .select("logstest.user_id", "users.username", "logstest.activity_type", "logstest.route", "logstest.response", "logstest.timestamp")
//       .leftJoin("users", "logstest.user_id", "users.id");

//     if (filter && filter.startDate && filter.endDate) {
//       // Adjust endDate to include entire day
//       const endDate = moment(filter.endDate).endOf('day').format('YYYY-MM-DD HH:mm:ss');
//       results = results.whereBetween('logstest.timestamp', [filter.startDate, endDate]);
//     }

//     const total = await results.clone().count("logstest.id as total").first();

//     results = await results
//       .orderBy(sort, order)
//       .limit(limit)
//       .offset(offset);

//     results = results.map((row) => {
//       row.timestamp = moment(row.timestamp).tz('Asia/Kolkata').format('YYYY-MM-DD HH:mm:ss'); // Convert to IST and format
//       try {
//         row.response = JSON.parse(row.response); // Parse response JSON
//       } catch (error) {
//         console.error("Error parsing response JSON:", error);
//         row.response = {}; // Assign empty object if parsing fails
//       }
//       return row;
//     });

//     if (results.length === 0) {
//       return res.status(404).json({
//         error: true,
//         message: "No results found for the given date range.",
//         data: {
//           rows: [],
//           total: 0,
//         },
//       });
//     }

//     return res.status(200).json({
//       error: false,
//       message: "Data retrieved successfully.",
//       data: {
//         rows: results,
//         total: total.total,
//       },
//     });
//   } catch (error) {
//     console.error("Error retrieving user activity:", error);
//     return res.status(500).json({
//       error: true,
//       message: "Something went wrong",
//       data: JSON.stringify(error),
//     });
//   }
// };
const newAllUserActivity = async (req, res) => {
  try {
    const tableName = "logstest";
    const searchFrom = ["activity_type", "route", "response"]; // Specify columns for search
    const { error, value } = validation.newAllUserActivity(req.body); // Assuming the request body is used for validation

    if (error) {
      return res.status(400).json({
        error: true,
        message: error.details[0].message,
        data: error,
      });
    }

    let { offset, limit, order, sort, search, filter } = value;

    let results = knex(tableName)
      .select(
        "logstest.user_id",
        "users.username",
        "logstest.activity_type",
        "logstest.route",
        "logstest.response",
        "logstest.timestamp"
      )
      .leftJoin("users", "logstest.user_id", "users.id");

    if (filter) {
      const { startDate, endDate, dateField } = filter;
      if (startDate && endDate && dateField) {
        const endDate = moment(filter.endDate)
          .endOf("day")
          .format("YYYY-MM-DD HH:mm:ss");
        results = results.whereBetween("logstest.timestamp", [
          filter.startDate,
          endDate,
        ]);
      }
    }

    const total = await results.clone().count("logstest.id as total").first();

    results = await results.orderBy(sort, order).limit(limit).offset(offset);

    results = results.map((row, index) => {
      row.timestamp = moment(row.timestamp)
        .tz("Asia/Kolkata")
        .format("YYYY-MM-DD HH:mm:ss"); // Convert to IST and format
      try {
        row.response = JSON.parse(row.response); // Parse response JSON
      } catch (error) {
        console.error("Error parsing response JSON:", error);
        row.response = {}; // Assign empty object if parsing fails
      }
      row.srNo = offset + index + 1; // Calculate serial number
      return row;
    });

    if (results.length === 0) {
      return res.json({
        error: true,
        message: "No results found for the given date range.",
        data: {
          rows: [],
          total: 0,
        },
      });
    }

    return res.status(200).json({
      error: false,
      message: "Data retrieved successfully.",
      data: {
        rows: results,
        total: total.total,
      },
    });
  } catch (error) {
    console.error("Error retrieving user activity:", error);
    return res.status(500).json({
      error: true,
      message: "Something went wrong",
      data: JSON.stringify(error),
    });
  }
};

const newIndividualUserActivity = async (req, res) => {
  try {
    const id = req.params.id;
    const { offset, limit, sort, order, search, filter } = req.body;

    let query = knex("logstest")
      .where({ user_id: id })
      .select(
        "logstest.user_id",
        "users.username",
        "logstest.activity_type",
        "logstest.route",
        "logstest.response",
        "logstest.timestamp"
      )
      .leftJoin("users", "logstest.user_id", "users.id")
      .orderBy(sort || "logstest.timestamp", order || "desc");

    // if (filter && filter.startDate && filter.endDate) {
    //   const startDate = moment(filter.startDate)
    //     .startOf("day")
    //     .format("YYYY-MM-DD HH:mm:ss");
    //   const endDate = moment(filter.endDate)
    //     .endOf("day")
    //     .format("YYYY-MM-DD HH:mm:ss");
    //   query = query.whereBetween("logstest.timestamp", [startDate, endDate]);
    // }
    if (filter) {
      const { startDate, endDate, dateField } = filter;
      if (startDate && endDate && dateField) {
        const startDate = moment(filter.startDate)
          .startOf("day")
          .format("YYYY-MM-DD HH:mm:ss");
        const endDate = moment(filter.endDate)
          .endOf("day")
          .format("YYYY-MM-DD HH:mm:ss");
        query = query.whereBetween(`logstest.${dateField}`, [
          startDate,
          endDate,
        ]);
      }
    }

    const total = await query.clone().count("logstest.id as total").first();

    const results = await query.limit(limit || 10).offset(offset || 0);

    if (!results || results.length === 0) {
      return res.json({
        error: true,
        message: "No result found for given date range",
      });
    }

    const parsedResponse = results.map((activity, index) => ({
      user_id: activity.user_id,
      username: activity.username,
      activity_type: activity.activity_type,
      route: activity.route,
      response: JSON.parse(activity.response),
      timestamp: moment(activity.timestamp)
        .tz("Asia/Kolkata")
        .format("YYYY-MM-DD HH:mm:ss"),
      srNo: offset + index + 1, // Calculate serial number
    }));

    return res.status(200).json({
      error: false,
      message: "Data retrieved successfully",
      data: parsedResponse,
      total: total.total,
    });
  } catch (error) {
    console.error("Error retrieving individual user activity:", error);
    return res.status(500).json({
      error: true,
      message: "Something went wrong",
    });
  }
};

const delteMultipleRecords=async(req,res)=>{
  try {
    const tableName = "users";
    const { ids } = req.body;
  
    const result = await functions.bulkDeleteRecordsUsers(tableName, ids, req);
  
    if (result.error) {
      return res.json({
        error: true,
        message: "Failed to delete one or more records",
        errors: result.errors,
        deltedIds:result.messages,
      });
    }
  
    return res.json({
      error: false,
      message: "Deleted all selected records successfully",
      errors: result.errors,
    });
  
    } catch (error) {
      return res.json({
        error: true,
        message: "Something went wrong",
        data: JSON.stringify(error),
      });
    }
}

export default {
  createUsers,
  paginateUsers,
  updateUsers,
  deleteUsers,
  viewUsers,
  changePassword,
  updateProfile,
  userActivity,
  allUserActivity,
  newAllUserActivity,
  newIndividualUserActivity,
  delteMultipleRecords
};
