import express from "express";
import tds from "../../../src/controller/admin/tds.js";
import token from "../../middleware/jwt.js";
import functions from "../../helpers/functions.js";

const moduleName = "Masters";
const router = express.Router();

router.post("/create", token.verifyTokenNew, functions.checkPermission(moduleName,"create"), tds.createTds);
router.put("/update", token.verifyTokenNew, functions.checkPermission(moduleName,"update"), tds.updateTds);
router.delete("/delete/:id", token.verifyTokenNew, functions.checkPermission(moduleName,"delete"), tds.deleteTds);
router.post("/view/:id", token.verifyTokenNew, tds.viewTds);
router.post("/list", token.verifyTokenNew, tds.listTds);
router.post("/filtered_list", token.verifyTokenNew, tds.filteredList);
router.post("/tax_types", token.verifyTokenNew, tds.taxTypes);
router.post("/import-excel", token.verifyTokenNew, functions.checkPermission(moduleName,"create"), tds.importExcel);
router.post("/deleteall",token.verifyTokenNew, functions.checkPermission(moduleName,"delete"), tds.delteMultipleRecords)

export default router;
