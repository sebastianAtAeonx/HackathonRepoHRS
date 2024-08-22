import express from "express";
import approver from "../../controller/admin/approver.js";
import token from "../../middleware/jwt.js"
import functions from "../../helpers/functions.js";

const router = express.Router();
const moduleName = "Roles & Permissions";


router.post("/create",token.verifyToken,functions.checkPermission(moduleName, "create"), approver.createApprover);
router.post("/list", token.verifyToken,functions.checkPermission(moduleName, "read"), approver.getApprovers);
router.post("/update", token.verifyToken,functions.checkPermission(moduleName, "update"), approver.updateApprover);
router.post("/delete/:department_id",token.verifyToken,functions.checkPermission(moduleName, "delete"), approver.deleteApprover);

export default router;
