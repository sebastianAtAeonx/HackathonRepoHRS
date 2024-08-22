import express from "express";
import company from "../../../src/controller/admin/companyType.js";
import token from "../../middleware/jwt.js"
import functions from "../../helpers/functions.js";

const moduleName = "Masters";

const router = express.Router();

router.post("/type/create", token.verifyTokenNew, functions.checkPermission(moduleName,"create"), company.createCompanyType);
router.post("/type/get", token.verifyTokenNew, company.paginateCompanyType);
router.put("/type/update", token.verifyTokenNew, functions.checkPermission(moduleName,"update"), company.updateCompanyType);
router.delete("/type/delete/:id", token.verifyTokenNew, functions.checkPermission(moduleName,"delete"), company.deleteCompanyType);
router.post("/type/view/:id", token.verifyTokenNew, company.viewCompanyType);
router.post("/type/import-excel", token.verifyTokenNew, functions.checkPermission(moduleName,"create"),company.importExcel);
router.post("/create", token.verifyTokenNew, functions.checkPermission(moduleName,"create"), company.createCompany);
router.post("/get", token.verifyTokenNew, company.paginateCompany);
router.post("/update", token.verifyTokenNew, functions.checkPermission(moduleName,"update"), company.updateCompany);
router.delete("/delete/:id", token.verifyTokenNew, functions.checkPermission(moduleName,"delete"), company.deleteCompany);
router.post("/deleteall",token.verifyTokenNew, functions.checkPermission(moduleName,"delete"),company.delteMultipleRecords)

export default router;
