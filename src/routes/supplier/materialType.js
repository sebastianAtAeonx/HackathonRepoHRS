import express from "express";
import materialType from "../../controller/supplier/materialType.js";
import token from "../../middleware/jwt.js";
import functions from '../../helpers/functions.js'; 

const router = express.Router();
const moduleName = "Masters";

router.post(
  "/create",
  token.verifyTokenNew, functions.checkPermission(moduleName,"create"),
  materialType.createMaterialType
);
router.post("/list", token.verifyTokenNew, functions.checkPermission(moduleName,"read"), materialType.paginateMaterialType);
router.post("/view/:id", token.verifyTokenNew, functions.checkPermission(moduleName,"read"), materialType.viewMaterialType);
router.delete(
  "/delete/:id",
  token.verifyTokenNew, functions.checkPermission(moduleName,"delete"),
  materialType.deleteMaterialType
);
router.put(
  "/update",
  token.verifyTokenNew, functions.checkPermission(moduleName,"update"),
  materialType.updateMaterialType
);

router.post("/deleteall", token.verifyTokenNew, functions.checkPermission(moduleName,"delete"),materialType.delteMultipleRecords)


export default router;
