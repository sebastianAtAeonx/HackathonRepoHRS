import express from "express";
import plant from "../../controller/admin/plants.js";
import token from "../../middleware/jwt.js";
import functions from "../../helpers/functions.js";

const router = express.Router();
const moduleName = "Masters";

router.post("/create", token.verifyTokenNew, functions.checkPermission(moduleName,"create"), plant.createPlant);
router.post("/list", token.verifyTokenNew, plant.paginatePlant);
router.post("/view/:id", token.verifyTokenNew, plant.viewPlant);
router.delete("/delete/:id", token.verifyTokenNew, functions.checkPermission(moduleName,"delete"), plant.deletePlant);
router.put("/update", token.verifyTokenNew, functions.checkPermission(moduleName,"update"), plant.updatePlant);
router.post("/deleteall", token.verifyTokenNew, functions.checkPermission(moduleName,"delete"), plant.delteMultipleRecords)
router.post("/import-excel", token.verifyTokenNew, functions.checkPermission(moduleName,"create"), plant.importExcel)

export default router;
