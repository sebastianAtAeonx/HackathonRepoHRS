import express from "express";
//import settings from "./v1/settings/index.js";

import admin from "./admin.js";
import supplier from "./supplier.js";
import workFlow from "./workFlow.js";
import services from "./services.js";
import report from "./report.js";
import config from "./configuration/config.js";
import envConfig from "./envConfig.js"
import exportXL from "./export.js";
import website from "../routes/website.js";
import notification from "../routes/notification.js";
import bulkUploads from "../routes/bulkUploads.js";
import sap from "../routes/forSap/sap.js";
import importXl from "../routes/importExcel.js";

const router = express.Router();

///new routes/
router.use("/admin", admin);
router.use("/supplier", supplier);
router.use("/website", website);
router.use("/workFlow", workFlow);
router.use("/services", services);
router.use("/configuration", config);
router.use("/report", report);
router.use("/envConfiguration", envConfig);
router.use("/export", exportXL);
router.use("/notification",notification)
router.use("/bulkUploads",bulkUploads)
router.use("/excel",importXl)
router.post("/supplier/create", (req, res) => {
  res.json({
    error: false,
    message: "Supplier Created successfully",
    data: req.body,
  });
});

router.post("/supplier/create/doc-list", (req, res) => {
  res.json({
    error: false,
    message: "File Fields created successfully",
    data: [
      {
        name: "MSME",
        key: "msme",
        required: true,
      },
      {
        name: "GST",
        key: "gst",
        required: true,
      },
      {
        name: "Cancelled cheque",
        key: "cancelled-cheque",
        required: false,
      },
      {
        name: "Pan Card",
        key: "pan-card",
        required: true,
      },
    ],
  });
});

router.use('/sap',sap)

export default router;
