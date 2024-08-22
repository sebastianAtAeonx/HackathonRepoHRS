import express from "express";
import approvalHierarchy from "../../src/routes/workFlow/approval_hierarchy.js";
import fieldConfig from "../../src/routes/workFlow/field_config.js";
import verifyToken from "../middleware/jwt.js";

const router = express.Router();

router.use("/approvalHierarchy", verifyToken.verifyToken, approvalHierarchy); //checked
router.use("/fieldConfig", fieldConfig); //cheked


export default router;
