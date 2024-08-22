import express from "express";
import token from "../../middleware/jwt.js"
import company from "../../controller/admin/company.js";
import functions from "../../helpers/functions.js";

const router = express.Router();

const moduleName = "Masters";
router.post("/create", token.verifyTokenNew, functions.checkPermission(moduleName,"create"), company.createCompany);
router.post("/list", token.verifyTokenNew,company.paginateCompany);
router.post("/update", token.verifyTokenNew, functions.checkPermission(moduleName,"update"), company.updateCompany);
router.post("/view/:id", token.verifyTokenNew,company.viewCompany);
router.delete("/delete/:id",token.verifyTokenNew, functions.checkPermission(moduleName,"delete"),company.deleteCompany);
router.post("/deleteallCompany", token.verifyTokenNew, functions.checkPermission(moduleName,"delete"), company.delteMultipleRecords1)
router.post("/deleteallCompanyType", token.verifyTokenNew, functions.checkPermission(moduleName,"delete"), company.delteMultipleRecords2)
router.post("/import-excel", token.verifyTokenNew, functions.checkPermission(moduleName,"create"),company.importExcel);


export default router;
