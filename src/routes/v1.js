import express from "express";
import textract from '../routes/textract/textract.js'

const router = express.Router();

router.put("/aws", textract);

export default router
