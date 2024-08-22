import express from "express";
import department from "../../../src/controller/admin/department.js";
import token from "../../middleware/jwt.js"
import functions from "../../helpers/functions.js";

const moduleName = "Masters";
const router = express.Router();

router.post("/create",token.verifyTokenNew, functions.checkPermission(moduleName,"create"), department.createDepartment);
router.delete("/delete/:id",token.verifyTokenNew, functions.checkPermission(moduleName,"delete"), department.deleteDepartment);
router.put("/update",token.verifyTokenNew, functions.checkPermission(moduleName,"update"), department.updateDepartment);
router.post("/view/:id", token.verifyTokenNew, department.viewDepartment);
router.post("/list", token.verifyTokenNew, department.paginateDepartment);
router.post("/deleteall",token.verifyTokenNew, functions.checkPermission(moduleName,"delete"), department.delteMultipleRecords)
router.post("/import-excel", token.verifyTokenNew, functions.checkPermission(moduleName,"create"), department.importExcel)



export default router;
