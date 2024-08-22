import express from "express";
import sapcreds from "../../controller/admin/sapcreds.js";
import token from "../../middleware/jwt.js";
import functions from "../../helpers/functions.js";

const moduleName = "API Configuration";
const router = express.Router();

router.post("/create", token.verifyTokenNew, functions.checkPermission(moduleName,"create"), sapcreds.createCred);
router.post("/list", token.verifyTokenNew, functions.checkPermission(moduleName,"read"), sapcreds.paginateCred);
router.post("/view/:id", token.verifyTokenNew, functions.checkPermission(moduleName,"read"), sapcreds.viewCred);
router.put("/update", token.verifyTokenNew, functions.checkPermission(moduleName,"update"), sapcreds.updateCred);
router.delete("/delete/:id", token.verifyTokenNew, functions.checkPermission(moduleName,"delete"), sapcreds.deleteCred);
router.post("/deleteall",token.verifyTokenNew, functions.checkPermission(moduleName,"delete"), sapcreds.delteMultipleRecords)

export default router;
