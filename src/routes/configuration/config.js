import express from "express";
import verifyToken from "../../middleware/jwt.js";
import formFields from "./formfields/form_fields.js";
import setmigration from "./setmigration/setmigration.js";
const router = express.Router();
router.use("/form_fields", formFields);
router.use("/setmigration", setmigration);
export default router;
