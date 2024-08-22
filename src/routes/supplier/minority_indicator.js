import express from "express";
import minority_indicator from "../../controller/supplier/minority_indicator.js";
import token from "../../middleware/jwt.js";
import functions from '../../helpers/functions.js';

const moduleName = "Masters";
const router = express.Router();

router.post("/list", minority_indicator.paginateMinorityReport)

export default router;