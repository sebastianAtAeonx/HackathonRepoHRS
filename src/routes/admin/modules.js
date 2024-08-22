import express from "express";
import modules from "../../../src/controller/admin/modules.js"
import token from "../../middleware/jwt.js";

const moduleName = "Masters"
const router=express.Router()

router.post('/list',token.verifyTokenNew,modules.paginateModules)
router.post('/create',token.verifyTokenNew,modules.createModule)
router.delete("/delete/:id",token.verifyTokenNew,modules.deleteModule)

export default router;