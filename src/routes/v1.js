import express from "express";
import textract from '../routes/textract/textract.js'
import translator from '../routes/textract/translator.js'
const router = express.Router();

router.use("/aws", textract);
router.use("/translator", translator);

export default router
