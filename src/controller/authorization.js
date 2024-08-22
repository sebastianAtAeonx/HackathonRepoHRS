import jwt from "jsonwebtoken";
import md5 from "md5";
import knex from "../config/mysql_db.js";
import constants from "../helpers/constants.js";
import fun from "../helpers/functions.js";
import functions from "../helpers/functions.js";
import model from "../model/admin.js";
import ses from "../../src/helpers/ses.js";
import supplierdetails from "../../src/helpers/functions.js";
// import winston from "winston";
import logUserActivity from "../logs/logs.js";
import { response } from "express";
import crypto, { verify } from "crypto";
import emailTemplate from "../emails/passwordEmail.js";
import SupplierLogs from "../logs/logs.js";
import { get } from "http";
import { time } from "console";
import validation from "../validation/authorization.js";

// const loginLogger = winston.createLogger({
//   transports: [
//     new winston.transports.Console(),
//     new winston.transports.File({ filename: "login_activity.log" }),
//   ],
//   format: winston.format.combine(
//     winston.format.timestamp(),
//     winston.format.simple(),
//     winston.format.printf(
//       (info) => `${info.timestamp} [${info.level}]: ${info.message}`
//     )
//   ),
// });
// const loginLogger = winston.createLogger({
//   transports: [
//     new winston.transports.Console(),
//     new winston.transports.File({ filename: "login_activity.log" }),
//   ],
//   format: winston.format.combine(
//     winston.format.timestamp(),
//     winston.format.simple(),
//     winston.format.printf(
//       (info) => `${info.timestamp} [${info.level}]: ${info.message}`
//     )
//   ),
// });

const login = async (req, res) => {
  // try {
  const { error, value } = validation.login(req.body);
  if (error) {
    return res.json({
      error: true,
      message: error.details[0].message,
    });
  }

  let { email, password } = req.body;
  let creds = {
    email: email,
    password: md5(password),
    status: "1",
  };

  if (fun.validateEmail(email)) {
    // console.log("Email is valid");
  } else {
    return res.json({ error: true, message: "Email is invalid" }).end();
  }

  let userData = await model.getAdminDetails(creds);
  if (userData.length) {
    const { status } = userData[0];

    let data = await knex("users_roles as ar")
      .leftJoin("users_roles_permissions as rp", "ar.id", "rp.role_id")
      .leftJoin("modules as m", "m.id", "rp.module_id")
      .where("ar.id", "=", userData[0].role)
      .select(
        /*"ar.role_name",*/ "m.module_key",
        "rp.createP as create",
        "rp.updateP as update",
        "rp.deleteP as delete",
        "rp.readP as read"
      );

    userData[0].permissions = data.map((val) => {
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

    delete userData[0].password;
    const nav = await fun.getPagesByPanel(1);
    if (status === "1") {
      // try {

      console.log("userData", userData);

      const get_user_role_name = await knex("role").where({
        id: userData[0].role_id,
      });
      userData[0].role_name = get_user_role_name[0].name;

      const getApproverLevel = await knex("approverTest")
        .where({ userId: userData[0].id })
        .select("level")
        .first();
      console.log("level", getApproverLevel);
      if (getApproverLevel) {
        userData[0].approverLevel = getApproverLevel.level;
      }

      // if ((userData[0].level != null) | "") {
      //   //hr level
      //   const get_hierarchy_level = await knex("approval_hierarchy").where({
      //     subscriber_id: userData[0].subscriber_id,
      //   });
      //   userData[0].hierarchy_level =
      //     get_hierarchy_level[0].approval_hierarchy_level;

      //   const getApproverLevel = await knex("approval_hierarchy")
      //     .where({ subscriber_id: userData[0].subscriber_id })
      //     .select("approval_level_name");

      //   let approverLevelName = getApproverLevel[0].approval_level_name;

      //   let parsedData = JSON.parse(approverLevelName);
      //   let parsedApprover = parsedData.length;
      //   userData[0].approver_level_name = parsedApprover;
      // }

      //getting the level name
      // if ((userData[0].level != null) | "") {
      //   let get_hk_no;

      //   switch (userData[0].level) {
      //     case 1:
      //       get_hk_no = await knex("approvers").where(
      //         "level_1_user_id",
      //         "[" + userData[0].id + "]"
      //       );
      //       break;
      //     case 2:
      //       get_hk_no = await knex("approvers").where(
      //         "level_2_user_id",
      //         "[" + userData[0].id + "]"
      //       );
      //       break;
      //     case 3:
      //       get_hk_no = await knex("approvers").where(
      //         "level_3_user_id",
      //         "[" + userData[0].id + "]"
      //       );
      //       break;
      //     case 4:
      //       get_hk_no = await knex("approvers").where(
      //         "level_4_user_id",
      //         "[" + userData[0].id + "]"
      //       );
      //       break;
      //   }
      //   console.log("hk no", get_hk_no);

      //   const getJsonData = await knex("approval_hierarchy")
      //     .where("id", get_hk_no[0].approval_hierarchy_id)
      //     .select("approval_level_name");

      //   const getLevelName = JSON.parse(getJsonData[0].approval_level_name);

      //   let levelName;
      //   for (const iterator of getLevelName) {
      //     if (iterator.level == userData[0].level) {
      //       userData[0].levelName = iterator.name;
      //     }
      //   }

      //   return res.json({
      //     error: false,
      //     message: "User Logged In successfully",
      //     data: {
      //       accessToken,
      //       refreshToken,
      //       userData: userData[0],
      //       nav,
      //     },
      //   });
      // }

      const user_id = userData[0].id;
      const level = userData[0].level;

      // if(userData[0].role=="3" && (level==null |level==0)){
      //  return  res.status(200).json({
      //     error: false,
      //     message: "User Logged In successfully",
      //     data: {
      //       accessToken,
      //       refreshToken,
      //       userData: userData[0],
      //       nav,
      //     },
      //   })
      // }

      // if (userData[0].role=="3" ) {
      //   userData[0].supplierDetails =
      //     await supplierdetails.supplierDetailsForLogin(user_id);
      // }

      // if(userData[0].role !="3" && level){
      //   return  res.status(200).json({
      //     error: false,
      //     message: "User Logged In successfully",
      //     data: {
      //       accessToken,
      //       refreshToken,
      //       userData: userData[0],
      //       nav,
      //     },
      //   })

      // }

      //get supplierid
      // console.log("this is supplierId",userData[0])
      const getSupplierId = await knex("supplier_details")
        .where({ emailID: userData[0].email })
        .orWhere({ emailID: userData[0].username })
        .select("id", "sap_code", "status");
      // console.log("supplierId", getSupplierId);
      if (getSupplierId.length > 0) {
        userData[0].supplierId = getSupplierId[0].id;
        userData[0].sapCode = getSupplierId[0].sap_code + "";
        userData[0].status = getSupplierId[0].status;
      }

      // logUserActivity(
      //   userData[0].id,
      //   userData[0].email,
      //   "login",
      //   "User logged in successfully",
      //   "url"
      // );
      // loginLogger.info(
      //   `Successful login attempt for user: ${userData[0].email}`
      // );

      const { jwtConfig } = constants;
      // console.log(userData[0].role_name, "this is role name");
      let data = await fun.getPermissions(
        userData[0].role,
        userData[0].role_name
      );
      let permissions = [];
      if (data.error == true) {
        permissions.push(userData[0].role_name);
      } else {
        permissions.push(data.data);
      }

      const accessToken = jwt.sign(
        {
          id: userData[0].id,
          role: userData[0].role,
          email: userData[0].email,
          first_login: userData[0].first_login,
          permissions: permissions[0],
          role_id: userData[0].role_id,
        },
        jwtConfig.secret,
        {
          expiresIn: jwtConfig.expireTime,
        }
      );

      const refreshToken = jwt.sign(
        {
          id: userData[0].id,
          role: userData[0].role,
          email: userData[0].email,
          first_login: userData[0].first_login,
          permissions: permissions[0],
          role_id: userData[0].role_id,
        },
        jwtConfig.refreshTokenSecret,
        {
          expiresIn: jwtConfig.refreshTokenExpireTime,
        }
      );

      // supplier logs entry ...........

      if (userData[0].role == "6") {
        const getSupplierDetails = await knex("supplier_details")
          .where("emailID", userData[0].email)
          .first();
        const timestamp = knex.fn.now();
        if (
          getSupplierDetails != undefined &&
          getSupplierDetails != null &&
          getSupplierDetails != ""
        ) {
          const logs = await SupplierLogs.logFunction(
            getSupplierDetails.id,
            getSupplierDetails.gstNo,
            getSupplierDetails.panNo,
            getSupplierDetails.supplier_name,
            getSupplierDetails.emailID,
            "Logged in",
            timestamp,
            getSupplierDetails.supplier_name,
            "Logged in Successfully"
          );
        }
      }

      //supplier logs entry over .........

      return res.status(200).json({
        error: false,
        message: "User Logged In successfully",
        data: {
          accessToken,
          refreshToken,
          userData: userData[0],
          permissions,
          nav,
        },
      });
    } else {
      return res.status(200).json({
        error: true,
        message: "Account is blocked or not exist.",
        data: [],
      });
    }
  } else {
    // logUserActivity(
    //   "unknown",
    //   "loginFailed",
    //   "Invalid Username and Password."
    // );
    // loginLogger.warn(`Failed login attempt for email: ${email}`);
    return res.status(200).json({
      error: true,
      message: "Invalid Email and Password.",
      data: [],
    });
  }
  // } catch (error) {
  //   // Log an error if an exception occurs
  //   // logger.error(`Error during login: ${error.message}`);
  //   // throw error;
  //   return res.status(500).json({
  //     error: true,
  //     message: error.message,
  //     data: [],
  //   });
  // }
};

const getUserDetail = async (req, res) => {
  try {
    const { error, value } = validation.getUser(req.body);
    if (error) {
      return res.json({
        error: true,
        message: error.details[0].message,
      });
    }

    const { id } = req.body;
    const data = await model.getUserDetail({
      id,
    });
    if (data.length) {
      return res.json({
        error: false,
        message: "success. user details receive",
        data: data,
      });
    } else {
      return res.json({
        error: false,
        message: "sorry. no record found",
        data: [],
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

const changePassword = async (req, res) => {
  try {
    const { error, value } = validation.changePassword(req.body);
    if (error) {
      return res.json({
        error: true,
        message: error.details[0].message,
      });
    }

    const { id, old_password, new_password, confirm_password } = req.body;

    const cred = {
      id: id,
      password: md5(old_password),
    };

    const userData = await model.getAdminDetails(cred);

    if (userData == "") {
      return res.json({
        message: "old password is wrong",
      });
    }

    const checkRoleName = await knex("users_roles").where({
      id: userData[0].role,
    });

    if (
      (userData.length > 0) &
      (checkRoleName[0].role_name === "subscriber" ||
        checkRoleName[0].role_name === "Supplier")
    ) {
      if (new_password === confirm_password) {
        if (old_password === new_password) {
          return res.json({
            error: true,
            message: "New password must be different from the old password",
          });
        }

        const updationDataIs = await functions.takeSnapShot("users", id);

        const changePassword = await knex("users")
          .update("password", md5(new_password))
          .where("id", id);
        if (changePassword > 0) {
          if (changePassword) {
            if (id) {
              const modifiedByTable1 = await functions.SetModifiedBy(
                req.headers["authorization"],
                "users",
                "id",
                id
              );
            }

            const body = `<b> Hi ${userData[0].firstname} ${userData[0].lastname}, </b><br>
                            Your password has been changed successfully!<br><br>
        
                            If this is not done by you, contact administration for more inquiry`;
            const emailTemplate =
              `<table style='width:100%;border:1px solid orange'> <tr> <td style='width:20%'></td><td><br><br>` +
              body +
              // `<br><br><center>278, Jeevan Udyog Building, DN Road, Fort,<br>Mumbai, India-400001, Maharashtra, India` +
              // `<br><img src='https://ashapura.supplierx.aeonx.digital/mailTruck.png'><br>Powered by aeonx.digital<br>Note: Do not reply this email. This is auto-generated email.</center></td><td style='width:20%'></td> </tr>  </table>`;

              "<br><br>Kind regards,<br><b>" +
              constants.admindetails.companyFullName +
              "</b><br><br><br><center><br>" +
              constants.admindetails.address1 +
              ", <br> " +
              constants.admindetails.address2 +
              ", " +
              constants.admindetails.city +
              ", " +
              constants.admindetails.state +
              ", " +
              constants.admindetails.country +
              `<br><br><img style='max-width:80px;' src='${constants.admindetails.companyLogo}'><br> Powered by ${constants.admindetails.companyShortName}<br> Note: Do not reply this email. This is auto-generated email.</center>` +
              "</td><td style='width:20%'></td></tr></table>";
            const sended = await ses.sendEmail(
              constants.sesCredentials.fromEmails.emailOtp,
              userData[0].email,
              "Password changed successfully",
              emailTemplate
            );

            if (!sended) {
              return res.json({
                error: true,
                message: "Erro",
                data: sended.error.data,
              });
            }

            return res.json({
              error: false,
              message: "Your Password Changed successfully",
            });
          }
          return res.json({
            error: false,
            message: "Password change succcessfully!!",
          });
        }
        return res.json({
          error: true,
          message: "Can not change password",
        });
      } else {
        return res.json({
          error: true,
          message: "New password and confirm password do not match",
        });
      }
    }

    return res.json({
      error: true,
      message: "Sorry. You are not authorized to change password",
    });
  } catch (error) {
    // const userDetails = await model.getAdminDetails({ id: user_id })
    // if ((md5(old_password) != userDetails[0].password) && (userDetails[0])) {
    //     if (new_password === confirm_password) {
    //         const update = await model.updateAdmin({ id: user_id }, { password: md5(new_password) })
    //         if (update) {
    //             const body = `<b> Hi ${userDetails[0].firstname} ${userDetails[0].lastname}, </b><br>
    //             Your password has been changed successfully!<br><br>

    //             If this is not done by you, contact administration for more inquiry`

    //             const sended = await fun.sendEmail("Password Changed", userDetails[0].email, '', body)
    //             if (sended.error) {
    //                 return res.json({
    //                     error: true,
    //                     message: sended.message,
    //                     data: sended.error.data
    //                 })
    //             }
    //             return res.json({
    //                 error: false,
    //                 message: "Your Password Changed successfully"
    //             })
    //         }
    //         return res.json({
    //             error: true,
    //             message: "Sorry. Password is not updated",
    //         })
    //     }
    //     return res.json({
    //         error: true,
    //         massage: "confirm password is not match",
    //         data: []
    //     })
    // }
    // return res.json({
    //     error: true,
    //     massage: "password not match",
    //     data: []
    // })

    return res.json({
      error: true,
      message: "Something went wrong.",
      data: {
        error: JSON.stringify(error),
      },
    });
  }
};

//old
// const refreshToken = async (req, res) => {
//   // try {
//     const parseJwt = (token) => {
//       if (!token) {
//         throw new Error("Token is missing or invalid");
//         }
//         // console.log("Received token:", token);
//       var base64Url = token.split(".")[1];
//       var base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
//       var jsonPayload = decodeURIComponent(
//         atob(base64)
//           .split("")
//           .map(function (c) {
//             return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
//           })
//           .join("")
//       );

//       return JSON.parse(jsonPayload);
//     };

//     const oldrefreshToken = req.body.refreshToken;
//     // console.log("refreesh token",oldrefreshToken)
//     const { jwtConfig } = constants;
//     jwt.verify(oldrefreshToken, jwtConfig.refreshTokenSecret, (err, user) => {
//       if (err) {
//         return res.status(200).send({
//           error: true,
//           message: "Authorization failed!",
//         });
//       }
//       const authHeader = req.headers["authorization"];
//       const token = authHeader && authHeader.split(" ")[1];

//       const payload = parseJwt(token);
//       const data = {
//         id: payload.id,
//         role: payload.role,
//         email: payload.email,
//         permissions: payload.permissions[0],
//       };
//       const accessToken = jwt.sign(data, jwtConfig.secret, {
//         expiresIn: jwtConfig.expireTime,
//       });
//       const refreshToken = jwt.sign(data, jwtConfig.refreshTokenSecret, {
//         expiresIn: jwtConfig.refreshTokenExpireTime,
//       });
//       return res.status(200).json({
//         error: false,
//         message: "Token Renewed.",
//         accessToken,
//         refreshToken,
//       });
//     });
//   // } catch (error) {
//   //   fun.sendErrorLog(req, error);
//   //   return res.json({
//   //     error: true,
//   //     message: "Something went wrong.",
//   //     data: { error: JSON.stringify(error) },
//   //   });
//   // }
// };

//hp
const refreshToken = async (req, res) => {
  const { refreshToken } = req.body;
  const { jwtConfig } = constants;

  try {
    const decoded = jwt.verify(refreshToken, jwtConfig.refreshTokenSecret);
    const { id, role, email, permissions, role_id } = decoded;
    const accessToken = jwt.sign(
      { id, role, email, permissions, role_id },
      jwtConfig.secret,
      {
        expiresIn: jwtConfig.expireTime,
      }
    );
    const newRefreshToken = jwt.sign(
      { id, role, email, permissions, role_id },
      jwtConfig.refreshTokenSecret,
      {
        expiresIn: jwtConfig.refreshTokenExpireTime,
      }
    );

    res.status(200).json({
      error: false,
      message: "Token Renewed.",
      accessToken,
      refreshToken: newRefreshToken,
    });
  } catch (error) {
    console.error("Error refreshing token:", error);
    res.status(401).json({
      error: true,
      message: "Invalid or expired refresh token.",
    });
  }
};
const logout = async (req, res) => {
  try {

    const { error, value } = validation.logout(req.body);

    if (error) {
      return res
        .json({
          error: true,
          message: error.details[0].message,
        })
        .end();
    }

    const { email } = value;

    const getSupplier = await knex("supplier_details")
      .where("emailID", email)
      .first();
    if (getSupplier) {
      const timestamp = knex.fn.now();
      const logs = await SupplierLogs.logFunction(
        getSupplier.id,
        getSupplier.gstNo,
        getSupplier.panNo,
        getSupplier.supplier_name,
        getSupplier.emailID,
        "Logged out",
        timestamp,
        getSupplier.supplier_name,
        "Logged out successfully"
      );
      // console.log(logs);
    }

    return res
      .json({
        error: false,
        message: "Logged out successfully",
      })
      .end();
  } catch (error) {
    return res
      .json({
        error: true,
        message: "Something went wrong",
      })
      .end();
  }
};

const forgotPassword = async (req, res) => {
  try {
    const { error, value } = validation.forgotPassword(req.body);
    if (error) {
      return res.json({
        error: true,
        message: error.details[0].message,
      });
    }

  const user = await knex("users").where({ email: value.email }).first();
  if (!user) {
    return res.json({
      error: true,
      message: "User not found",
    });
  }
  const role = await knex("role").where({ id: user.role }).first();

  if (role.name === "Admin") {
    return res.json({
      error: true,
      message: "You can't forgot password please contact super admin",
    });
  }
  // Generate reset token
  const resetToken = generateResetToken();
  console.log("token", resetToken);

  const updationDataIs = await functions.takeSnapShot("users", user.id);

  await knex("users")
    .where({ id: user.id })
    .update({
      token: md5(resetToken),
      token_expiry: new Date(Date.now() + 5 * 60 * 1000),
    });

  // console.log("token",resetToken)
  // if(user.id){
  //   const modifiedByTable1 = await functions.SetModifiedBy(
  //     req.headers["authorization"],
  //     "users",
  //     "id",
  //     user.id
  //   );
  // }

  const emailBodyPromise = emailTemplate.forgotPasswordEmail(
    user.firstname,
    resetToken
  );
  const emailBody = await emailBodyPromise;
  const sender = await constants.getEnv("OTP_EMAIL");

  // Send email
  try {
    ses.sendEmail(
      sender,
      // process.env.OTP_EMAIL,
      value.email,
      "Reset Password",
      emailBody
    );
  } catch (error) {
    console.log(error);
  }
  // Respond to the client
  return res.json({
    success: true,
    message: "Reset link sent to your email. please check your inbox.",
  });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      error: true,
      message: "Something went wrong",
      data: error,
    });
  }
};
function generateResetToken(length = 20) {
  return crypto.randomBytes(length).toString("hex");
}

const changeForgotPassword = async (req, res) => {
  try {
    const { error, value } = validation.changeForgotPass(req.body);
    if (error) {
      return res.json({
        error: true,
        message: error.details[0].message,
      });
    }

    const user = await knex("users")
      .where({ token: md5(value.token) })
      .first();
    if (!user) {
      return res.json({
        error: true,
        message: "Token expired!",
      });
    }

    // Check token expiry
    if (user.token_expiry && new Date(user.token_expiry) < new Date()) {
      return res.json({
        error: true,
        message: "Reset link has expired. Please request a new one.",
      });
    }

    if (value.password !== value.confirm_password) {
      return res.json({
        error: true,
        message: "Password and Confirm Password does not match",
      });
    }

    if (value.password < 8) {
      return res.json({
        error: true,
        message: "Password atleast 8 characters long",
      });
    }

    const regex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

    if (!regex.test(value.password)) {
      return res.status(400).json({
        error: true,
        message:
          "Password should be at least one uppercase letter, one lowercase letter, one number, and one special character",
      });
    }

    if (value.password > 15) {
      return res.json({
        error: true,
        message: "Password length should be less than 15",
      });
    }

    if (md5(value.password) === user.password) {
      return res.json({
        error: true,
        message: "New Password cannot be same as old password",
      });
    }

    const getUser = await knex("users")
      .where({ token: md5(value.token) })
      .first();

    const role = await knex("users_roles").where({ id: user.role }).first();
    if (role.role_name === "Supplier") {
      await knex("supplier_details")
        .update({ password: md5(value.password) })
        .where({ emailID: user.email });
    }

    await knex("users")
      .update({
        token: null,
        token_expiry: null,
        password: md5(value.password),
      })
      .where({ token: md5(value.token) });

    //supplierLogs entry....
    let getSupplierDetails;
    if (getUser) {
      getSupplierDetails = await knex("supplier_details")
        .where("emailID", getUser.email)
        .first();
    }
    // console.log("getSupplierDetails:",getSupplierDetails);
    const timestamp = knex.fn.now();
    if (getSupplierDetails) {
      const logs = await SupplierLogs.logFunction(
        getSupplierDetails.id,
        getSupplierDetails.gstNo,
        getSupplierDetails.panNo,
        getSupplierDetails.supplier_name,
        getSupplierDetails.emailID,
        "Password Changed",
        timestamp,
        getSupplierDetails.supplier_name,
        "Password Changed"
      );
    }
    //supplierLogs entry over ....

    return res.json({
      error: false,
      message: "Password changed successfully",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      error: true,
      message: "Something went wrong",
      data: error,
    });
  }
};

const checkLinkExpiry = async (req, res) => {
  try {
    const { error, value } = validation.checkLinkExpiry(req.body);
    if (error) {
      return res.json({
        error: true,
        message: error.details[0].message,
      });
    }
    const user = await knex("users")
      .where({ token: md5(value.token) })
      .first();
    if (!user) {
      return res.json({
        error: true,
        message: "User not found",
      });
    }
    if (user.token_expiry && new Date(user.token_expiry) < new Date()) {
      return res.status(400).json({
        error: true,
        message: "Reset link has expired. Please request a new one.",
      });
    }
    return res.status(200).json({
      error: false,
      message: "Link is valid",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      error: true,
      message: "Something went wrong",
      data: error,
    });
  }
};

const changePasswordOnFirstLogin = async (req, res) => {
  try {
    const token = req.headers["authorization"];
    if (!token) {
      return res.json({
        error: true,
        message: "Token is required.",
      });
    }

    const { jwtConfig } = constants;
    const payload = jwt.decode(token.split(" ")[1], jwtConfig.secret);
    const userRole = payload.permissions[0]
      ? payload.permissions[0]
      : payload.permissions;
    const userId = payload.id;
    const role = payload.role;
    const userEmail = payload.email;

    const checkUser = await knex("users").where("email", userEmail);
    if (checkUser.length <= 0) {
      return res.json({
        error: true,
        message: "User not found",
      });
    }

    if (checkUser[0].first_login == "0") {
      return res.json({
        error: true,
        message: "Can not change password",
      });
    }

    const { error, value } = validation.changePasswordOnFirstLogin(req.body);
    if (error) {
      return res.json({
        error: true,
        message: error.details[0].message,
      });
    }

    const { newEmail, newPassword, confirmPassword } = value;

    if (checkUser[0].password == md5(newPassword)) {
      return res.json({
        error: true,
        message: "New password cannot be same as old password",
      });
    }

    if (newPassword != confirmPassword) {
      return res.json({
        error: true,
        message: "Password and Confirm Password does not match",
      });
    }

    if (userRole == "Admin" || userRole == "admin") {
      const updatePassword = await knex("users")
        .update({
          email: newEmail,
          password: md5(newPassword),
          first_login: "0",
        })
        .where("email", userEmail)
        .andWhere("first_login", "1");

      if (!updatePassword) {
        return res.json({
          error: true,
          message: "Failed to Update Password",
        });
      }
      return res.json({
        error: false,
        message: "Email and Password Updated Successfully",
      });
    }

    const updatePassword = await knex("users")
      .update({
        // email:newEmail,
        password: md5(newPassword),
        first_login: "0",
      })
      .where("email", userEmail)
      .andWhere("first_login", "1");

    if (!updatePassword) {
      return res.json({
        error: true,
        message: "Failed to Update Password",
      });
    }

    if (userRole == "Supplier" || userRole == "supplier") {
      // const updatePassword = await knex("users")
      //   .update({
      //     // email:newEmail,
      //     password: md5(newPassword),
      //     first_login: "0",
      //   })
      //   .where("email", userEmail)
      //   .andWhere("first_login", "1");

      // if (!updatePassword) {
      //   return res.json({
      //     error: true,
      //     message: "Failed to Update Password",
      //   });
      // }
      const updatePassword2 = await knex("supplier_details")
        .update({
          // emailID:newEmail,
          password: md5(newPassword),
          // first_login:'0'
        })
        .where("emailID", userEmail);

      if (!updatePassword2) {
        return res.json({
          error: true,
          message: "Failed to Update Password",
        });
      }
    }

    return res.json({
      error: false,
      message: "Password Updated Successfully",
    });
  } catch (error) {
    return res.json({
      error: true,
      message: "Failed to change password",
    });
  }
};

async function generateOTP(length = 6) {
  const digits = "0123456789";
  let otp = "";
  for (let i = 0; i < length; i++) {
    otp += digits[Math.floor(Math.random() * 10)];
  }
  return otp;
}

const sendAdminOTP = async (req, res) => {
  try {
    const { error, value } = validation.sendAdminOTP(req.body);
    if (error) {
      return res.json({
        error: true,
        message: error.details[0].message,
      });
    }

    const { email } = value;

    //send otp process
    let otp;

    try {
      otp = await generateOTP();
      // console.log("Generated OTP:", otp);
    } catch (error) {
      console.error("Error generating OTP:", error);
      return res.json({ error: true, message: "Error ocured generating OTP" });
    }
    // console.log("otp:-", otp);
    //store otp to table.
    const getOtp = await knex("otps")
      .where({ process_name: "admin_password_change", identifier: email })
      .first();

    if (getOtp) {
      const updateOtp = await knex("otps")
        .update({ otp, time: Date.now() })
        .where({ process_name: "admin_password_change", identifier: email });
    } else {
      const insertOtp = await knex("otps").insert({
        process_name: "admin_password_change",
        identifier: email,
        otp,
        time: Date.now(),
      });
    }

    //send otp over email

    const emailBody = `<table style="border:1px solid orange; width:100%;">
    <tr style="padding:15px;">
        <td style="width:20%;"></td>
        <td style="width:60%">
            <p>Hello,</p>
            <p>Welcome to supplierX. We have generated an OTP to change or update your password on our portal.</p> <p>Your OTP is: <b>${otp}</b> </p>
            <p>Regards,</p>
            <p><b>${constants.admindetails.companyShortName}</b></p>
            <center><p>
                ${constants.admindetails.address1}, ${constants.admindetails.address2}, ${constants.admindetails.state}, ${constants.admindetails.country}</p>
                <p><img style="max-width:80px" src="${constants.admindetails.homePageUrl}mailTruck.png" /></p>
                <p> Powered By ${constants.admindetails.companyShortName}
                <br>Note: Do not reply this email. This is auto-generated email.</p>
            </p></center>
        </td>
        <td style="width:20%"></td>
    </tr>
</table>`;

    ses.sendEmail(
      "noreply@supplierx.aeonx.digital",
      email,
      "OTP to change password",
      emailBody
    );

    return res.status(200).json({
      error: false,
      message: "OTP sent successfully",
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: "Failed to send OTP",
      data: error.message,
    });
  }
};

const verifyAdminOTP = async (req, res) => {
  try {
    const { error, value } = validation.verifyAdminOTP(req.body);
    if (error) {
      return res.status(400).json({
        error: true,
        message: error.details[0].message,
      });
    }

    const { email, otp } = value;

    const getOtpfromDB = await knex("otps")
      .where({ process_name: "admin_password_change", identifier: email })
      .first();

    if (!getOtpfromDB)
      return res
        .status(404)
        .json({ error: true, message: "Email not found or OTP expired" });

    //check time - weather 5 minutes happened or not

    const timeCompareResult = await compareTime(getOtpfromDB.time);
    if (timeCompareResult) {
      return res.status(404).json({
        error: true,
        message: "OTP expired",
      });
    }

    if (getOtpfromDB.otp == otp) {
      //delete otp raw from DB when otp matches successfully.
      const deleteOtp = await knex("otps")
        .where({ process_name: "admin_password_change", identifier: email })
        .del();
      return res.status(200).json({
        error: false,
        message: "OTP is verified successfully",
      });
    }

    return res.status(404).json({
      error: true,
      message: "Invalid OTP",
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: "Failed to verify OTP",
      data: error.message,
    });
  }
};

async function compareTime(mytime) {
  const currentTime = new Date();
  const otpTime = new Date(mytime);
  // Calculate the difference in milliseconds
  const timeDifference = Math.abs(currentTime - otpTime);
  // Convert the difference to minutes
  const minutesDifference = Math.floor(timeDifference / (1000 * 60));
  // Check if the difference is more than 5 minutes
  if (minutesDifference > 5) {
    return true;
  } else {
    return false;
  }
}

export default {
  login,
  getUserDetail,
  changePassword,
  refreshToken,
  logout,
  forgotPassword,
  changeForgotPassword,
  checkLinkExpiry,
  changePasswordOnFirstLogin,
  sendAdminOTP,
  verifyAdminOTP,
};
