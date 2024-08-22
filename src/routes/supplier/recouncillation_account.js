import express from "express";
import recAcc from "../../controller/supplier/recouncillation_account.js";
import token from "../../middleware/jwt.js";
import functions from '../../helpers/functions.js';
const router = express.Router();
const moduleName="Masters"

router.post("/create",token.verifyTokenNew, functions.checkPermission(moduleName,"create"), recAcc.createReconciliation);
router.post("/list",token.verifyTokenNew, functions.checkPermission(moduleName,"read"), recAcc.paginateReconciliation);

export default router;
