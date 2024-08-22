import express from "express";
import textract from '../routes/textract/textract.js'

const router = express.Router();

router.use("/aws", textract);

export default router
