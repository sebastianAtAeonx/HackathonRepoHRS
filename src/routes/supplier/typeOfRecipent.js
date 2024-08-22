import express from "express";
import TypeOfRecipent from "../../controller/supplier/typeOfRecipent.js";
import token from "../../middleware/jwt.js";
import functions from '../../helpers/functions.js';

const moduleName = "Masters";
const router = express.Router();

router.post("/create", token.verifyTokenNew, functions.checkPermission(moduleName,"create"), TypeOfRecipent.createTypeOfRecipent);
router.post("/view/:id", token.verifyTokenNew, TypeOfRecipent.viewTypeOfRecipent);
router.post("/list", token.verifyTokenNew, TypeOfRecipent.paginateTypeOfRecipent);
router.put("/update", token.verifyTokenNew, functions.checkPermission(moduleName,"update"), TypeOfRecipent.updateTypeOfRecipent);
router.delete("/delete/:id", token.verifyTokenNew, functions.checkPermission(moduleName,"delete"), TypeOfRecipent.deleteTypeOfRecipent);
router.post("/deleteall",token.verifyTokenNew, functions.checkPermission(moduleName,"delete"), TypeOfRecipent.delteMultipleRecords)


export default router;
