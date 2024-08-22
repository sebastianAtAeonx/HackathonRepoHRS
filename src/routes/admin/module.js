import express from "express";
import module from "../../../src/controller/admin/module.js"
import token from "../../middleware/jwt.js";
import functions from "../../helpers/functions.js";

const moduleName = "Masters"
const router=express.Router()

router.post('/create',token.verifyTokenNew, functions.checkPermission(moduleName,"create"), module.createModules)
router.put('/update',token.verifyTokenNew, functions.checkPermission(moduleName,"update"),module.updateModules)
router.post('/view/:id',token.verifyTokenNew,module.viewModules)
router.delete('/delete/:id',token.verifyTokenNew, functions.checkPermission(moduleName,"delete"),module.deleteModules)
router.post('/list',token.verifyTokenNew,module.paginateModules)
router.post("/deleteall",token.verifyTokenNew, functions.checkPermission(moduleName,"delete"),module.delteMultipleRecords)

export default router;