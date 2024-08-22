import express from "express";
import permissions from "../../controller/admin/rolesAndPermissions.js";
import token from "../../middleware/jwt.js";
import functions from "../../helpers/functions.js";

const router = express.Router();
const moduleName = "Roles & Permissions";

router.post("/create", token.verifyTokenNew, functions.checkPermission(moduleName,"create"), permissions.createRolePermission);
router.delete("/delete/:id", token.verifyTokenNew, functions.checkPermission(moduleName,"delete"), permissions.deleteRolePermission);
router.get("/view/:role_id", token.verifyTokenNew, functions.checkPermission(moduleName,"read"), permissions.viewRolePermission);
router.post("/update",token.verifyTokenNew, functions.checkPermission(moduleName,"update"), permissions.updateRolePermission)
router.post("/deleteall",token.verifyTokenNew, functions.checkPermission(moduleName,"delete"), permissions.delteMultipleRecords)

export default router;
