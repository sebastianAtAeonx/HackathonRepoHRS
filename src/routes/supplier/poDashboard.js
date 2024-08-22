import express from "express";
import dashboard from "../../controller/supplier/poDashboard.js";
import token from "../../middleware/jwt.js";
import functions from '../../helpers/functions.js'; 

const moduleName = "Dashboard";
const router = express.Router();

router.post("/po-service", token.verifyTokenNew, functions.checkPermission(moduleName,"read"), dashboard.poServiceCount);

export default router;
