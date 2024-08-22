import express from "express";
import subscriberDetails from "../../../controller/admin/subscriberDetails.js";
import token from "../../middleware/jwt.js";
import functions from "../../helpers/functions.js";

const router = express.Router();
const moduleName = "Masters";

router.post("/create", token.verifyTokenNew, functions.checkPermission(moduleName,"create"), subscriberDetails.createSubscriberDetails);
router.delete("/delete", token.verifyTokenNew, functions.checkPermission(moduleName,"delete"), subscriberDetails.deleteSubscriberDetails);
router.put("/update", token.verifyTokenNew, functions.checkPermission(moduleName,"update"), subscriberDetails.updateSubscriberDetails);
router.post("/view/:id", token.verifyTokenNew, functions.checkPermission(moduleName,"read"), subscriberDetails.viewSubscriberDetails);
router.post("/list", token.verifyTokenNew, functions.checkPermission(moduleName,"read"), subscriberDetails.paginateSubscriberDetails);
router.post("/password", token.verifyTokenNew, functions.checkPermission(moduleName,"update"), subscriberDetails.updateProfilePass);

export default router;
