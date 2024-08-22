import express from "express";
import subscriber from "../../controller/admin/subscriber.js";
import token from "../../middleware/jwt.js";
import functions from "../../helpers/functions.js";

const router = express.Router();
const moduleName = "Masters";

router.post("/create", token.verifyTokenNew, functions.checkPermission(moduleName,"create"), subscriber.createSubscriber);
router.post("/list", token.verifyTokenNew, functions.checkPermission(moduleName,"read"), subscriber.paginateSubscriber);
router.post("/view/:id", token.verifyTokenNew, functions.checkPermission(moduleName,"read"), subscriber.viewSubscriber);
router.delete("/delete/:id", token.verifyTokenNew, functions.checkPermission(moduleName,"delete"), subscriber.deleteSubscriber);
router.put("/update", token.verifyTokenNew, functions.checkPermission(moduleName,"update"), subscriber.updateSubscriber);
router.post("/deleteall", token.verifyTokenNew, functions.checkPermission(moduleName,"delete"), subscriber.delteMultipleRecords)

export default router;
