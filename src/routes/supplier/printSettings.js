import express from "express";
import pSettings from "../../controller/supplier/printSettings.js";
import token from "../../middleware/jwt.js";
import functions from '../../helpers/functions.js';

const router = express.Router();
const moduleName="ASN Config";

router.post("/get", token.verifyTokenNew, functions.checkPermission(moduleName,"read"), pSettings.getSettings);
router.post("/set", token.verifyTokenNew, functions.checkPermission(moduleName,"create"), pSettings.setSettings);
export default router;
