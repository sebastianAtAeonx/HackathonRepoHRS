import express from "express";
import users from "../../controller/users.js";
import token from "../../middleware/jwt.js";
import functions from "../../helpers/functions.js";

const moduleName = "Roles & Permissions";
const newModuleName = "Account Settings";
const router = express.Router();

router.post(
  "/create",
  token.verifyTokenNew,
  functions.checkPermission(moduleName, "create"),
  users.createUsers
);
router.post(
  "/list",
  token.verifyTokenNew,
  functions.checkPermission(moduleName, "read"),
  users.paginateUsers
);
router.put(
  "/update",
  token.verifyTokenNew,
  functions.checkPermission(moduleName, "update"),
  users.updateUsers
);
router.put(
  "/update_profile",
  token.verifyTokenNew,
  functions.checkPermission(moduleName, "update"),
  users.updateProfile
);
router.delete(
  "/delete/:id",
  token.verifyTokenNew,
  functions.checkPermission(moduleName, "delete"),
  users.deleteUsers
);
router.post("/view/:id", token.verifyTokenNew, users.viewUsers);
router.post(
  "/change_password",
  token.verifyTokenNew,
  functions.checkPermission(newModuleName, "update"),
  users.changePassword
);
router.get("/userActivity/:id", users.userActivity);
router.post("/getAllUserActivities", users.allUserActivity);
router.post("/newuseractivity", users.newAllUserActivity);
router.post("/individualactivity/:id", users.newIndividualUserActivity);
router.post(
  "/deleteall",
  token.verifyTokenNew,
  functions.checkPermission(moduleName, "delete"),
  users.delteMultipleRecords
);

export default router;
