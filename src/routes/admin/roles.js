import express from "express";
import role from "../../../src/controller/admin/roles.js";
import token from "../../middleware/jwt.js"
import functions from "../../helpers/functions.js";

const router = express.Router();
const moduleName = "Roles & Permissions";

router.post("/create", token.verifyTokenNew, functions.checkPermission(moduleName,"create"), role.createRole);
router.put("/update/:id" ,token.verifyTokenNew, functions.checkPermission(moduleName,"update"), role.updateRole);
router.delete("/delete/:id",  token.verifyTokenNew, functions.checkPermission(moduleName,"delete"), role.deleteRole);
router.post("/list", token.verifyTokenNew, functions.checkPermission(moduleName,"read"), role.listRoles);
router.get("/operation" , token.verifyTokenNew, role.getPermissions);
router.get("/list", token.verifyTokenNew, functions.checkPermission(moduleName,"read"), role.getRoles);

export default router;
