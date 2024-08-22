import express from 'express'
import items from "../../controller/supplier/items.js";
import token from "../../middleware/jwt.js";
import functions from '../../helpers/functions.js';

const router = express.Router()
const moduleName = "Masters"

router.post('/create', token.verifyTokenNew, functions.checkPermission(moduleName,"create"), items.createItem)
router.post('/list',token.verifyTokenNew, functions.checkPermission(moduleName,"read"), items.PaginationItems)
router.post('/view/:id',token.verifyTokenNew, functions.checkPermission(moduleName,"read"), items.viewItem)
router.put('/update',token.verifyTokenNew, functions.checkPermission(moduleName,"update"), items.updateItem)
router.delete('/delete/:id', token.verifyTokenNew, functions.checkPermission(moduleName,"delete"), items.deleteItem)
router.post("/deleteall",token.verifyTokenNew, functions.checkPermission(moduleName,"delete"), items.delteMultipleRecords)



export default router