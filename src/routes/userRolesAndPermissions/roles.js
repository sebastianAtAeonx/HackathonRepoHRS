import express from "express";
import roles from "../../controller/userRolesAndPermissions/roles.js";
import token from "../../middleware/jwt.js";

const router = express.Router();

router.post("/create", token.adminauthenticateToken, roles.createRoles);
router.post("/view/:id", roles.viewRoles);
router.post("/list", roles.paginateRoles);
router.post("/rolelist", roles.roleList);
router.post("/roles_are", roles.rolesAre);
router.delete("/delete/:id", token.adminauthenticateToken, roles.deleteRoles);
router.put("/update", token.adminauthenticateToken, roles.updateRoles);
router.post("/deleteall", token.adminauthenticateToken, roles.delteMultipleRecords);


export default router;
