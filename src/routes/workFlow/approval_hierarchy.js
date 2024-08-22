import express from "express";
import approval_hierarchy from "../../controller/workflow/approval_hierarchy.js";
import token from "../../middleware/jwt.js";

const router = express.Router();

router.post("/create",token.adminauthenticateToken,approval_hierarchy.createApprovalHierarchy);
router.post("/dropdown", approval_hierarchy.listApprovalHierarchy);
router.post("/list", approval_hierarchy.paginateApprovalHierarchy);
router.post("/update",token.adminauthenticateToken,approval_hierarchy.updateApprovalHierarchy);
router.delete("/delete/:id",token.adminauthenticateToken,approval_hierarchy.deleteApprovalHierarchy);
router.post("/deleteall",token.adminauthenticateToken,approval_hierarchy.delteMultipleRecords);


export default router;
