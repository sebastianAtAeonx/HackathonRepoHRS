import constants from "../helpers/constants.js";
import jwt from "jsonwebtoken";
import knex from "../config/mysql_db.js";
import expjwtpermission from "express-jwt-permissions";
import { expressjwt } from "express-jwt";

function adminauthenticateToken(req, res, next) {
  const token = req.headers["authorization"];

  if (token) {
    try {
      const { jwtConfig } = constants;
      const testtoken = token.split(" ")[1];

      jwt.verify(testtoken, jwtConfig.secret, (err, decoded) => {
        if (err) {
          if (err) {
            // Token is invalid or has expired
            return (
              res
                // .status(503)
                .json({
                  error: "true",
                  message: "Session Expired. Please Login Again",
                })
            );
          }

          // Check if the token has expired
          const currentTimestamp = Math.floor(Date.now() / 1000);
          if (decoded.exp < currentTimestamp) {
            return (
              res
                // .status(503)
                .json({ error: "true", message: "Token expired" })
            );
          }

          // Token is valid, continue with the next middleware or route
          next();
        }
        req.userId = decoded.id; // Add the decoded user ID to the request object
        req.emailis = decoded.email;
        console.log("userid:", req.userId);
        req.role = decoded.role; // Add the decoded role to the request object
        if (req.role != 7) {
          //7 is the id of role Admin
          return res
            .json({ error: true, message: "User is not authorized" })
            .end();
        }
        next();
      });
    } catch (error) {
      console.error("Error authenticating token:", error);
      return res
        .status(500)
        .json({ error: true, message: "Server Error" })
        .end();
    }
  } else {
    return res
      .json({
        error: true,
        message: "Token not found",
      })
      .end();
  }
}

function approverAdminToken(req, res, next) {
  console.log("here-approver");
  const token = req.headers["authorization"];
  if (token) {
    try {
      const { jwtConfig } = constants;
      const testtoken = token.split(" ")[1];

      jwt.verify(testtoken, jwtConfig.secret, (err, decoded) => {
        if (err) {
          if (err.expiredAt) {
            console.log("expire time", err.expiredAt);
            return res
              .status(403)
              .json({ error: true, message: "Token is expired" })
              .end();
            // Perform actions if the token has expired
          }
          return res
            .status(403)
            .json({ error: true, message: "Token is not valid" })
            .end();
        }

        req.userId = decoded.userId; // Add the decoded user ID to the request object
        req.role = decoded.role; // Add the decoded role to the request object

        if (req.role != 3 && req.role != 7) {
          //7 is the id of role Admin
          return res
            .json({ error: true, message: "User is not authorized" })
            .end();
        }

        next();
      });
    } catch (error) {
      console.error("Error authenticating token:", error);
      return res.status(500).json({ message: "Server Error" }).end();
    }
  } else {
    return res
      .json({
        error: true,
        message: "Token not found",
      })
      .end();
  }
}

const verifyToken = async (req, res, next) => {
  // req.validate = (module_key, permission) => {
  //   try {
  //     if (req.body.login_user.permissions[module_key]) {
  //       if (!req.body.login_user.permissions[module_key][permission]) {
  //         res.json({
  //           error: true,
  //           message: "You do not have the Permission. Please contact admin.",
  //           data: {},
  //         });
  //         res.end();
  //         return false;
  //       }
  //       return true;
  //     } else {
  //       res.json({
  //         error: true,
  //         message: "You do not have the Permission. Please contact admin.",
  //         data: {},
  //       });
  //       res.end();
  //       return false;
  //     }
  //   } catch (err) {
  //     console.log(JSON.stringify(err));
  //     return false;
  //   }
  // };

  const { jwtConfig } = constants;
  const authHeader = req.headers["authorization"];

  let token = authHeader && authHeader.split(" ")[1];
  if (token == null) {
    res.status(401).send({ error: true, message: "Token not found" }); 
    return res.end();
  }

  jwt.verify(token, jwtConfig.secret, async (err, user) => {
    if (err) {
      if (err instanceof jwt.TokenExpiredError) {
        return res.status(401).send({ error: true, message: "Token has expired" });
      } else {
        return res.status(401).send({ error: true, message: "Authorization failed!" });
      }
    }

    // if (user != undefined) {
    //   req.body.login_user = user;
    //   req.params.login_user = user;
    //   let data = await knex("users_roles as ar")
    //     .leftJoin("users_roles_permissions as rp", "ar.id", "rp.role_id")
    //     .leftJoin("modules as m", "m.id", "rp.module_id")
    //     .where("ar.id", "=", req.body.login_user.role)
    //     .select(
    //       "m.module_key",
    //       "rp.createP as create",
    //       "rp.updateP as update",
    //       "rp.deleteP as delete",
    //       "rp.readP as read"
    //     );

    //   let arr = data.map((val) => {
    //     Object.keys(val).map((data) => {
    //       if (data != "module_key") {
    //         if (val[data] == "1") {
    //           val[data] = true;
    //         } else {
    //           val[data] = false;
    //         }
    //       }
    //     });
    //     return val;
    //   });
    //   req.body.login_user.permissions = {};
    //   arr.forEach((row) => {
    //     req.body.login_user.permissions[row.module_key] = row;
    //     delete req.body.login_user.permissions[row.module_key].module_key;
    //   });
    // }
    return next();
  });
};

const guard = expjwtpermission({
  requestProperty: "auth",
  permissionsProperty: "permissions",
});

const jwtMiddleware = expressjwt({
  secret: constants.jwtConfig.secret,
  algorithms: ["HS256"],
  credentialsRequired: false,
  getToken: function fromHeaderOrQuerystring(req) {
    if (
      req.headers.authorization &&
      req.headers.authorization.split(" ")[0] === "Bearer"
    ) {
      return req.headers.authorization.split(" ")[1];
    } else if (req.query && req.query.token) {
      return req.query.token;
    }
    return null;
  },
});

///for roles and permissions
// const checkRoleAndPermissions = (requiredRole, requiredPermissions) => {
//   return (req, res, next) => {
//     const { roles, permissions } = req.user;

//     if (roles.includes(requiredRole) && permissions.some(permission => requiredPermissions.includes(permission))) {
//       next();
//     } else {
//       return res.status(403).json({ error: true, message: 'Insufficient role or permissions' });
//     }
//   };
// };



//hp
const checkPermissionMiddleware = async (req, res, next) => {
  // try {
  const table = "roles_permissions";

  const token = req.headers["authorization"];
  if (token) {
    try {
      const { jwtConfig } = constants;
      const testtoken = token.split(" ")[1];

      jwt.verify(testtoken, jwtConfig.secret, (err, decoded) => {
        if (err) {
          if (err.expiredAt) {
            console.log("expire time", err.expiredAt);
            return res
              .status(403)
              .json({ error: true, message: "Token is expired" })
              .end();
            // Perform actions if the token has expired
          }
          return res
            .status(403)
            .json({ error: true, message: "Token is not valid" })
            .end();
        }

        req.userId = decoded.userId; // Add the decoded user ID to the request object
        req.role = decoded.role; // Add the decoded role to the request object
      });
    } catch (error) {
      console.error("Error authenticating token:", error);
      return res.status(500).json({ message: "Server Error" }).end();
    }
  } else {
    return res
      .json({
        error: true,
        message: "Token not found",
      })
      .end();
  }

  const userId = req.userId;
  console.log("this is user id", userId);

  const userRoleId = req.role;

  const check = await knex(table).where({ role_id: userRoleId });

  if (check.length === 0) {
    return res.status(403).json({
      error: true,
      message: "User does not have the required permissions.",
    });
  }
  const userPermissions = JSON.parse(
    check[0].module_permission
  ).module_permissions;

 
  const { requiredModule, requiredPermissions } = req.body;

  if (!requiredModule || !requiredPermissions) {
    return res.status(400).json({
      error: true,
      message:
        "Missing requiredModule or requiredPermissions in the request body.",
    });
  }

  const modulePermission = userPermissions.find(
    (module) => module.name === requiredModule
  );

  if (!modulePermission) {
    return res.status(403).json({
      error: true,
      message: `User does not have permissions for module: ${requiredModule}.`,
    });
  }

  const hasRequiredPermissions = requiredPermissions.every(
    (permission, index) => modulePermission.permissions[index] === permission
  );

  if (!hasRequiredPermissions) {
    return res.status(403).json({
      error: true,
      message: "User does not have the required permissions for the module.",
    });
  }

  
  req.userPermissions = modulePermission;

  // Continue to the next middleware or route handler
  next();
  // } catch (error) {
  //   return res.status(500).json({
  //     error: true,
  //     message: "Something went wrong while checking permissions.",
  //     data: error,
  //   });
  // }
};

//hp
const verifyTokenNew = (req, res, next) => {
  const token =
    req.headers.authorization && req.headers.authorization.split(" ")[1];
  const { jwtConfig } = constants;

  if (!token) {
    return res.status(401).json({ error: true, message: "Unauthorized" });
  }

  jwt.verify(token, jwtConfig.secret, (err, decoded) => {
    if (err) {
      return res.status(401).json({ error: true, message: "Invalid token" });
    }

    req.user = decoded;
    next();
  });
};



export default {
  verifyToken,
  adminauthenticateToken,
  approverAdminToken,
  guard,
  jwtMiddleware,
  checkPermissionMiddleware,
  verifyTokenNew,
};
