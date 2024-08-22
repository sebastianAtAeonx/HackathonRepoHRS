import express from "express";
import approver from "../../controller/admin/approver.js";
import token from "../../middleware/jwt.js"
import functions from "../../helpers/functions.js";

const router = express.Router();
const moduleName = "Roles & Permissions";

router.post("/create",token.verifyTokenNew, functions.checkPermission(moduleName, "create"), approver.createApprover);
router.post("/list", token.verifyTokenNew, functions.checkPermission(moduleName, "read"), approver.getApprovers);
router.post("/update", token.verifyTokenNew, functions.checkPermission(moduleName, "update"), approver.updateApprover);
router.post("/delete/:department_id",token.verifyTokenNew, functions.checkPermission(moduleName, "delete"), approver.deleteApprover);
router.post("/deleteall",token.verifyTokenNew, functions.checkPermission(moduleName, "delete"), approver.delteMultipleRecords)
router.post("/approverList",approver.listForAssignApprover)


export default router;
