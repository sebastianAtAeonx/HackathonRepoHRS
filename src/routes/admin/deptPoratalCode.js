import express from "express";
import deptPortalCode from "../../../src/controller/admin/depPoratalCode.js";
import token from "../../middleware/jwt.js";
import functions from "../../helpers/functions.js";

const router = express.Router();

const moduleName = "Masters";

router.post("/list", token.verifyTokenNew, functions.checkPermission(moduleName,"read"), deptPortalCode.list);
router.post("/filter/:dept_id", token.verifyTokenNew, functions.checkPermission(moduleName,"read"), deptPortalCode.filter);

export default router;
