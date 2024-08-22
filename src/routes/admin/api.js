import express from "express";
import api from "../../controller/admin/api.js";
import token from "../../middleware/jwt.js"
import functions from "../../helpers/functions.js";

const router = express.Router();

const moduleName = "API Configuration";
const thirdPartyModule = "Third Party Counts";

router.post("/list", token.verifyTokenNew, functions.checkPermission(moduleName,"read"), api.paginateAPI);
router.put("/update", token.verifyTokenNew, functions.checkPermission(moduleName,"update"), api.updateAPI);
router.delete("/delete/:id", token.verifyTokenNew, functions.checkPermission(moduleName,"delete"), api.deleteAPI);
router.post("/create", token.verifyTokenNew, functions.checkPermission(moduleName,"create"), api.createAPI);
router.post("/view/:id", token.verifyTokenNew, functions.checkPermission(moduleName,"read"), api.viewAPI);
router.post("/countapicalls",token.verifyTokenNew, functions.checkPermission(thirdPartyModule,"read"), api.countApiCalls)
router.post("/deleteall",token.verifyTokenNew, functions.checkPermission(moduleName,"delete"), api.delteMultipleRecords)

export default router;
