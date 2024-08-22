import express from "express";
import Approvers from "../../controller/supplier/approver.js";
// import token from "../../middleware/jwt.js";
import token from "../../middleware/jwt.js";
import functions from "../../helpers/functions.js";

const moduleName = "Masters";
const router = express.Router();

router.post("/create", token.verifyTokenNew, functions.checkPermission(moduleName, "create"), Approvers.createApprovers);
router.delete(
  "/delete/:id",
  token.verifyTokenNew, functions.checkPermission(moduleName, "delete"),
  Approvers.deleteApprovers
);
router.put("/update", token.verifyTokenNew, functions.checkPermission(moduleName, "update"), Approvers.updateApprovers);
router.post("/view/:id", token.verifyTokenNew, Approvers.viewApprovers);
router.post("/list", token.verifyTokenNew, Approvers.paginateApprovers);
router.post(
  "/getApproverName/:id",
  token.verifyTokenNew, functions.checkPermission(moduleName, "read"),
  Approvers.getApproverName
);
router.post("/approvaltimeline", token.verifyTokenNew, Approvers.approverTimeline);
router.post("/deleteall",token.verifyTokenNew, functions.checkPermission(moduleName, "delete"), Approvers.delteMultipleRecords)


export default router;
