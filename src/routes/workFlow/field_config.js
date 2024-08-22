import express from "express";
import field_config from "../../controller/workflow/field_config.js";
import token from "../../middleware/jwt.js";

const router = express.Router();

router.post("/create", token.adminauthenticateToken, field_config.createField);
router.put("/update", token.adminauthenticateToken, field_config.updateField);
router.put("/updateInternational",token.adminauthenticateToken, field_config.updateFieldInternational);
router.post("/list", field_config.listField);
router.post("/getClassifiedFieldList", field_config.getClassifiedFieldList);
router.post("/getfields", field_config.getfields);
router.post("/getfieldsInternational", field_config.getfieldnamesInternational);
router.post("/addfield", field_config.additionalFieldCreate);
router.delete(
  "/deletefield/:id",
  token.adminauthenticateToken,
  field_config.additionalFieldDelete
);
router.post(
  "/createdynamo",
  token.adminauthenticateToken,
  field_config.createAdditionalFieldDy
);
router.post("/getdynamo", field_config.listAdditionalFieldValueDy);
router.delete(
  "/deletedynamo",
  token.adminauthenticateToken,
  field_config.deleteAdditionalFieldValueDy
);
router.post("/viewdynamo", field_config.viewAdditionalFieldValueDy);
router.post("/getmodulenames", field_config.getmodulenames);
router.post("/getgroupnames", field_config.getgroupnames);
router.post("/getfieldnames", field_config.getfieldnames);
router.post(
  "/createAdditionalField",
  token.adminauthenticateToken,
  field_config.createAdditionalField
); //Testing
router.post("/displayAdditionalField/:id", field_config.displayAdditionalField); //Testing
router.post(
  "/listAdditionalField/:subscriber_id",
  field_config.listAdditionalField
); //Testing
router.put(
  "/updateAdditionalField",
  token.adminauthenticateToken,
  field_config.updateAdditionalField
); //Testing
router.delete(
  "/deleteAdditionalField/:id",
  token.adminauthenticateToken,
  field_config.deleteAdditionalField
); //Testing


export default router;
