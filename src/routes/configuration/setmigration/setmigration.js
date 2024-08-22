import express from "express";
import verifyToken from "../../../middleware/jwt.js";
import setmigration from "../../../controller/setmigration.js";
import token from "../../../middleware/jwt.js";
import functions from "../../../helpers/functions.js";

const moduleName = "Migration";

const router = express.Router();
router.post("/createandrun", token.verifyTokenNew, functions.checkPermission(moduleName,"create"),setmigration.createandrun);
export default router;
