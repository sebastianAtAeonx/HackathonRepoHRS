import express from "express";
import cronJob from "../../../src/controller/admin/cronJob.js"
import token from "../../middleware/jwt.js";
import functions from "../../helpers/functions.js";

const moduleName = "API Configuration";
const router = express.Router();

router.post("/create", token.verifyTokenNew, functions.checkPermission(moduleName,"create"), cronJob.createCronJob);
router.post("/list", token.verifyTokenNew, functions.checkPermission(moduleName,"read"), cronJob.listCronJob);

export default router;


