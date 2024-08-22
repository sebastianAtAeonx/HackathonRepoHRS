import express from "express";
import verifyToken from "../../../middleware/jwt.js";
import formFields from "../../../controller/configuration/formFields.js";
import token from "../../../middleware/jwt.js";
import functions from "../../../helpers/functions.js";

const moduleName = "Form Field";
const router = express.Router();
router.post("/create", token.verifyTokenNew, functions.checkPermission(moduleName,"create"),formFields.create);
router.put("/update", token.verifyTokenNew, functions.checkPermission(moduleName,"update"), formFields.update);
router.post("/list", token.verifyTokenNew, functions.checkPermission(moduleName,"read"), formFields.list);
router.post("/view", token.verifyTokenNew, functions.checkPermission(moduleName,"read"), formFields.view);
router.delete("/delete", token.verifyTokenNew, functions.checkPermission(moduleName,"delete"), formFields.remove);
router.post("/deleteall",token.verifyTokenNew, functions.checkPermission(moduleName,"delete"), formFields.delteMultipleRecords)
export default router;
