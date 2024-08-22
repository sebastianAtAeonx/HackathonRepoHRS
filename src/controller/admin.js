import md5 from "md5";
import knex from "../config/mysql_db.js";
import model from "../model/admin.js";
import validation from "../validation/admin.js";
import RoleModel from "../model/role.js";
import fun from "../helpers/functions.js";
import Joi from "joi";
import jwt from "jsonwebtoken";

const createAdminUser = async (req, res) => {
  try {
    const schema = Joi.object({
      firstname: Joi.string().required().trim(),
      lastname: Joi.string().required().trim(),
      email: Joi.string()
        .email({ tlds: { allow: false } })
        .required(),
      password: Joi.string().min(8).max(35).required(),
      role: Joi.number().required(),
      username: Joi.string().required().trim(),
    });

    const { error, value } = schema.validate(req.body);

    if (error) {
      return res.json({
        error: true,
        message: error.details[0].message,
      });
    }

    const { firstname, lastname, email, password, role, username } = value;

    if (fun.validateEmail(email)) {
      console.log("Email is valid");
    } else {
      console.log("Email is invalid");
      return res.json({ error: true, message: "Email is invalid" }).end();
    }

    const data = {
      username: username,
      firstname: firstname,
      lastname: lastname,
      email: email,
      password: password,
      role: role,
      status: 1,
    };

    const checkValidation = validation.createValidateUser(data);
    if (checkValidation.error) {
      const details = checkValidation.error.details;
      const message = details.map((i) => {
        const err_msg = i.message;
        return err_msg.replace(/\"/g, "");
      });
      return res.json({
        error: true,
        message: message,
      });
    }

    console.log("hello");

    const checkEmail = await model.getUserDetail({ email });
    if (checkEmail.length) {
      return res.status(200).json({
        error: true,
        message: "Email already exist...",
        data: [],
      });
    }

    const id = await model.insertAdmin({ ...data, password: md5(password) });
    if (id) {
      return res.status(200).json({
        error: false,
        message: "User has been created",
        data: id,
      });
    }

    return res.json({
      error: true,
      message: "User has been not created",
      data: id,
    });
  } catch (error) {
    return res.json({
      error: true,
      message: "Something went wrong.",
      data: { error: JSON.stringify(error) },
    });
  }
};

const paginateAdmin = async (req, res) => {
  try {
    let {
      offset = 0,
      limit = 10,
      order = "asc",
      sort = "id",
      search,
      status,
    } = req.body;

    let searchFrom = ["firstname", "lastname", "email"];
    const total = await model.paginateAdminTotal(searchFrom, search, status);
    const roles = await knex("users_roles").select(
      "role_name as label",
      "id as value"
    );

    const rows = await model.paginateAdmin(
      limit,
      offset,
      searchFrom,
      status,
      sort,
      search,
      order
    );
    // rows = rows.map(row => {
    //     row.image = constants.getStaticUrl(row.image)
    //     return row
    // })
    let data_rows = [];
    if (order === "asc") {
      let sr = total.total - limit * offset;
      await rows.forEach((row) => {
        row.sr = sr;
        data_rows.push(row);
        sr--;
      });
    } else {
      let sr = offset + 1;
      await rows.forEach((row) => {
        row.sr = sr;
        data_rows.push(row);
        sr++;
      });
    }
    return res.status(200).json({
      error: false,
      message: "Admin received successfully.",
      data: {
        rows: data_rows,
        total,
        roles,
      },
    });
  } catch (error) {
    fun.sendErrorLog(req, error);
    return res.json({
      error: true,
      message: "Something went wrong.",
      data: { error: JSON.stringify(error) },
    });
  }
};

const updateAdmin = async (req, res) => {
  try {
    const schema = Joi.object({
      id: Joi.number().required(),
      firstname: Joi.string().required().trim(),
      lastname: Joi.string().required().trim(),
      email: Joi.string().email({ tlds: { allow: false } }),
      role: Joi.number().required(),
      password: Joi.string().min(8).max(35),
      status: Joi.number().valid("1", "0").default("1"),
    });

    const { error, value } = schema.validate(req.body);

    if (error) {
      return res.json({
        error: true,
        message: error.details[0].message,
      });
    }

    const { id, firstname, lastname, email, role, password, status } = value;

    if (fun.validateEmail(email)) {
      console.log("Email is valid");
    } else {
      console.log("Email is invalid");
      return res.json({ error: true, message: "Email is invalid" }).end();
    }

    const data = {
      id,
      firstname,
      lastname,
      password,
      email,
      role,
      status,
    };
    const checkValidation = validation.validateUpdateUser(data);
    if (checkValidation.error) {
      const details = checkValidation.error.details;
      const message = details.map((i) => {
        const err_msg = i.message;
        return err_msg.replace(/\"/g, "");
      });
      return res.json({
        error: true,
        message: message,
      });
    }

    const checkEmail = await model.checkEmail({ email }, { id });
    if (checkEmail.length) {
      return res.status(200).json({
        error: true,
        message: "Email already exist...",
        data: [],
      });
    }

    const updateData = {
      firstname,
      lastname,
      email,
      role,
      status,
    };
    if (password) updateData.password = md5(password);

    const update = await model.updateAdmin({ id }, updateData);
    if (update) {
      return res.json({
        error: false,
        message: "User has been updated",
      });
    }
  } catch (error) {
    fun.sendErrorLog(req, error);
    return res.json({
      error: true,
      message: "Something went wrong.",
      data: { error: JSON.stringify(error) },
    });
  }
};

const deleteAdmin = async (req, res) => {
  try {
    const schema = Joi.object({
      id: Joi.number().required(),
    });

    const { error, value } = schema.validate(req.body);
    if (error) {
      return res.json({
        error: true,
        message: error.details[0].message,
      });
    }
    const { id } = req.body;
    const status = await model.deleteAdmin({ id });

    if (status) {
      return res.json({
        error: false,
        message: "User has been deleted",
      });
    }
  } catch (error) {
    fun.sendErrorLog(req, error);
    return res.json({
      error: true,
      message: "Something went wrong.",
      data: { error: JSON.stringify(error) },
    });
  }
};

const rolesListing = async (req, res) => {
  try {
    const { limit, offset, search, order, sort, status } = req.body;
    const rows = await RoleModel.paginatRole(
      limit,
      offset,
      ["role_name"],
      status,
      sort,
      search,
      order
    );
    const total = await RoleModel.paginatRoleTotal(
      ["role_name"],
      search,
      status
    );

    let data_rows = [];
    if (order === "asc") {
      let sr = total.total - limit * offset;
      await rows.forEach((row) => {
        row.sr = sr;
        data_rows.push(row);
        sr--;
      });
    } else {
      let sr = offset + 1;
      await rows.forEach((row) => {
        row.sr = sr;
        data_rows.push(row);
        sr++;
      });
    }

    return res.json({
      error: false,
      message: "Data received successfully",
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
      data: { error: JSON.stringify(error) },
    });
  }
};

const modulesListing = async (req, res) => {
  try {
    if (!req.validate("admin", "read")) {
      return false;
    }
    const { role_id = -1 } = req.body;
    let data = await knex("users_roles as ar")
      .leftJoin("users_roles_permissions as rp", "ar.id", "rp.role_id")
      .leftJoin("modules as m", "m.id", "rp.module_id")
      .where("ar.id", "=", role_id)
      .select(
        "m.module_key",
        "rp.createP as create",
        "rp.updateP as update",
        "rp.deleteP as delete",
        "rp.readP as read",
        "ar.role_name"
      );
    let role_name = "";
    if (data.length && data.length != 0) {
      role_name = data[0].role_name;
    }
    let permissions = data.map((val) => {
      delete val.role_name;
      Object.keys(val).map((data) => {
        if (data != "module_key") {
          if (val[data] == "1") {
            val[data] = true;
          } else {
            val[data] = false;
          }
        }
      });
      return val;
    });
    const modules = await knex("modules");
    return res.json({
      error: false,
      message: "Modules recieved successfully",
      data: {
        modules,
        permissions,
        role_name,
      },
    });
  } catch (error) {
    fun.sendErrorLog(req, error);
    return res.json({
      error: true,
      message: "Something went wrong.",
      data: { error: JSON.stringify(error) },
    });
  }
};

const getApprover = async (req, res) => {
  try {
    const schema = Joi.object({
      id: Joi.number().required(),
    });

    const { error, value } = schema.validate(req.params);
    if (error) {
      return res.json({
        error: true,
        message: error.details[0].message,
      });
    }

    const { id } = req.params;

    const result = await knex("users as a")
      .select(
        "a.firstname",
        "a.lastname",
        "users_roles.role_name",
        "users_roles.id"
      )

      .join("users_roles", "a.role", "users_roles.id")

      .where("users_roles.id", id);

    if (!result) {
      return res.json({
        error: true,

        data: error,
      });
    }

    return res.json({
      error: false,

      data: result,
    });
  } catch (error) {
    return res.json({
      error: true,

      message: "something went wrong",
    });
  }
};

function isTokenExpiredcheck(token) {
  try {
    // Decode the token without verifying the signature
    const decoded = jwt.decode(token, { complete: true });

    console.log("decode:-", decoded.payload.exp);
    console.log("time:-", Math.floor(Date.now() / 1000));

    // Check if the decoded token contains an 'exp' (expiration) claim
    if (decoded && decoded.payload && decoded.payload.exp) {
      // Get the expiration time from the decoded token
      const expirationTime = decoded.payload.exp;

      // Get the current time in seconds
      const currentTime = Math.floor(Date.now() / 1000);

      // Check if the token has expired by comparing the expiration time with the current time
      if (expirationTime < currentTime) {
        // Token has expired
        return true;
      } else {
        // Token is still valid
        return false;
      }
    } else {
      // If the token doesn't contain an 'exp' claim, consider it as expired
      return true;
    }
  } catch (error) {
    // If an error occurs during decoding or checking, consider the token as expired
    console.error("Error:", error);
    return true;
  }
}

const isTokenExpired = async (req, res) => {
  const authHeader = req.headers["authorization"];

  if (authHeader) {
    // Extract the token from the Authorization header (Bearer token)
    const token = authHeader.split(" ")[1]; // Assuming the format is "Bearer <token>"

    const isExpired = isTokenExpiredcheck(token);
    console.log("Is token expired?", isExpired);

    return res.json({
      error: false,
      jwt: isExpired,
    });
  } else {
    return res.status(401).json({ error: "Authorization header not found" });
  }
};

export default {
  createAdminUser,
  paginateAdmin,
  updateAdmin,
  deleteAdmin,
  rolesListing,
  modulesListing,
  getApprover,
  isTokenExpired,
};
