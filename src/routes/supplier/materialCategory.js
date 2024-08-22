import express from "express";
import materialCategory from "../../controller/supplier/materialCategory.js";
import token from "../../middleware/jwt.js";
import functions from '../../helpers/functions.js';

const router = express.Router();
const moduleName = "Masters";
router.post(
  "/create",
  token.verifyTokenNew, functions.checkPermission(moduleName,"create"),
  materialCategory.createMaterialCategory
);
router.post("/list", token.verifyTokenNew, functions.checkPermission(moduleName,"read"), materialCategory.paginateMaterialCategory);
router.post("/view/:id", token.verifyTokenNew, functions.checkPermission(moduleName,"read"), materialCategory.viewMaterialCategory);
router.delete(
  "/delete/:id",
  token.verifyTokenNew, functions.checkPermission(moduleName,"delete"),
  materialCategory.deleteMaterialCategory
);
router.put(
  "/update",
  token.verifyTokenNew, functions.checkPermission(moduleName,"update"),
  materialCategory.updateMaterialCategory
);

router.post("/deleteall",token.verifyTokenNew, functions.checkPermission(moduleName,"delete"), materialCategory.delteMultipleRecords)


export default router;
