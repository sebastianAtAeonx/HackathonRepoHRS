import express from "express";
import textract from "../../controller/textract.js";
const router = express.Router();


router.post("/textract", textract.Textract);
// router.post('/translate',textract.uploadAndTranslate)

export default router