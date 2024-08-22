import express from "express";
import country from "../../../src/controller/admin/country.js";
import token from "../../middleware/jwt.js"
import functions from "../../helpers/functions.js";

const moduleName = "Masters";
const router = express.Router();

router.post("/view/:id", token.verifyTokenNew, country.viewCountry);
router.post("/list", token.verifyTokenNew,country.paginateCountry);
router.post("/deleteall",token.verifyTokenNew, functions.checkPermission(moduleName,"delete"), country.delteMultipleRecords)
router.post("/import-excel", token.verifyTokenNew, functions.checkPermission(moduleName,"create"),country.importExcel)

export default router;
