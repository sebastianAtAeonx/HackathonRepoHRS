import express from "express";

import lang from "../../../src/controller/admin/languages.js";
import token from "../../middleware/jwt.js";
import functions from "../../helpers/functions.js";

const moduleName = "Masters";
const router = express.Router();

router.post("/create", token.verifyTokenNew, functions.checkPermission(moduleName,"create"),lang.createLang);
router.delete("/delete/:id", token.verifyTokenNew, functions.checkPermission(moduleName,"delete"),lang.deleteLang);
router.put("/update", token.verifyTokenNew, functions.checkPermission(moduleName,"update"),lang.updateLang);
router.post("/view/:id", token.verifyTokenNew,lang.viewLang);
router.post("/list", token.verifyTokenNew,lang.paginateLang);

export default router;
