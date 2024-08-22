import express from "express";
import materials from "../../controller/supplier/materials.js";
import token from "../../middleware/jwt.js";
import functions from '../../helpers/functions.js';

const router = express.Router();
const moduleName = "Masters";

router.post("/create", token.verifyTokenNew, functions.checkPermission(moduleName,"create"), materials.createMaterial);
router.post("/view/:id", token.verifyTokenNew, functions.checkPermission(moduleName,"read"), materials.viewMaterial);
router.post("/list", token.verifyTokenNew, functions.checkPermission(moduleName,"read"), materials.paginateMaterial);

router.delete("/delete/:id",token.verifyTokenNew, functions.checkPermission(moduleName,"delete"),materials.deleteMaterial);
router.put("/update", token.verifyTokenNew, functions.checkPermission(moduleName,"update"), materials.updateMaterial);
router.post("/deleteall",token.verifyTokenNew, functions.checkPermission(moduleName,"delete"),materials.delteMultipleRecords)
router.post("/import-excel", token.verifyTokenNew, functions.checkPermission(moduleName,"delete"), materials.importExcel);


export default router;
