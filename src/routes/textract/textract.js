import express from "express";
import textract from "../../controller/textract.js";
const router = express.Router();


router.post("/textract", textract.Textract);

export default router