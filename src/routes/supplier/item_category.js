import express from 'express'
import item_category from "../../controller/supplier/item_category.js";
import token from "../../middleware/jwt.js";
import functions from '../../helpers/functions.js';

const router = express.Router()
const moduleName = "Masters"

router.post('/create',token.verifyTokenNew, functions.checkPermission(moduleName,"create"), item_category.createItemCategory)
router.post('/list',token.verifyTokenNew, functions.checkPermission(moduleName,"read"), item_category.PaginateItemCategory)
router.post('/view/:id',token.verifyTokenNew, functions.checkPermission(moduleName,"read"), item_category.viewItemCategory)
router.put('/update',token.verifyTokenNew, functions.checkPermission(moduleName,"update"), item_category.updateItemCategory)
router.delete('/delete/:id',token.verifyTokenNew, functions.checkPermission(moduleName,"delete"), item_category.deleteItemCategory)
router.post("/deleteall",token.verifyTokenNew, functions.checkPermission(moduleName,"delete"), item_category.delteMultipleRecords)


export default router