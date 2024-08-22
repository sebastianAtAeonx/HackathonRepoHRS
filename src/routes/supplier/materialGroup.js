import express from "express";
import mg from "../../controller/supplier/materialGroup.js";
import token from "../../middleware/jwt.js";
import functions from '../../helpers/functions.js';

const moduleName = "Masters";
const router = express.Router();

router.post("/create", token.verifyTokenNew, functions.checkPermission(moduleName,"create"), mg.createMaterial_group);
router.post("/list", token.verifyTokenNew, functions.checkPermission(moduleName,"read"), mg.paginateMaterialGroup);
router.post("/view/:id", token.verifyTokenNew, functions.checkPermission(moduleName,"read"), mg.viewMaterialGroup);
router.delete("/delete/:id",token.verifyTokenNew, functions.checkPermission(moduleName,"delete"),token.adminauthenticateToken,mg.deleteMaterialGroup);
router.put("/update", token.verifyTokenNew, functions.checkPermission(moduleName,"update"), token.adminauthenticateToken, mg.updateMaterial_group);
router.post("/deleteall",token.verifyTokenNew, functions.checkPermission(moduleName,"delete"), mg.delteMultipleRecords)
router.post("/import-excel", token.verifyTokenNew, functions.checkPermission(moduleName,"create"), mg.importExcel);


export default router;
