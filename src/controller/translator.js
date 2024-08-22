import textract from "../services/textract.js";
import constant from "../helpers/constants.js";
import Joi from "joi";
// import functions from "../../helpers/functions.js";
import { PDFDocument } from "pdf-lib";
import { v4 as uuidv4 } from "uuid";
import knex from "../config/mysql_db.js";
import moment from "moment";
import { response } from "express";
import AWS from "aws-sdk";

const translateAndtextract = async (req, res) => {
  const {language='gu'} = req.body
  // Configure AWS credentials and region
  AWS.config.update({
    region: constant.aws.region,
    accessKeyId: constant.aws.accessKey,
    secretAccessKey: constant.aws.secret,
  });

  // Create Textract and Translate clients
  const textract = new AWS.Textract();
  const translate = new AWS.Translate();
  const textExtracted = [];
  async function translatePDF(pdfBuffer) {
    // 1. Use Textract toLowerCase() extract text blocks from the PDF
    const textractParams = {
      Document: {
        Bytes: pdfBuffer,
      },
    };

    try {
      const textractResponse = await textract
        .detectDocumentText(textractParams)
        .promise();
      const blocks = textractResponse.Blocks;

      // 2. Loop through text blocks and identify the language
      const textToTranslate = [];
      for (const block of blocks) {
        if (block.BlockType === "LINE") {
          const text = block.Text;
          textExtracted.push(text);
          const identifiedLanguage =
            block.Confidence === 1.0 ? block.LanguageCode : "en"; // Use English as fallback
          //  /   console.log("this is language",identifiedLanguage)
          // 3. Translate the text block using Translate
          const translateParams = {
            SourceLanguageCode: identifiedLanguage,
            TargetLanguageCode: language, // Replace with target language code
            Text: text,
          };

          const translateResponse = await translate
            .translateText(translateParams)
            .promise();
          const translatedText = translateResponse.TranslatedText;

          textToTranslate.push(`${translatedText} `); // Add newline for each translated block
        }
      }

      // 4. Return the translated text as a string
      return textToTranslate.join("");
    } catch (error) {
      return res.json({
        error: true,
        message: "Something went wrong.",
        data: { error: JSON.stringify(error) },
      });
      console.error("Error during Textract or Translate:", error);
      throw error;
    }
  }

  // Example usage (replace with your actual PDF buffer)
  const pdfBuffer = req.files.file.data; // Replace with your PDF buffer

  translatePDF(pdfBuffer)
    .then((translatedText) => {
      return res.json({
        error: false,
        message: "Translated Text",
        textExtracted,
        data: translatedText,
      });
    })
    .catch((error) => {
      console.error("Error translating PDF:", error);
    });
};

export default {translateAndtextract}