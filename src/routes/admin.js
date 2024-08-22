import express from "express";
import admin from "../controller/admin.js";
import verifyToken from "../middleware/jwt.js";
import jwt from "jsonwebtoken";
//new imports from here
import companyType from "../../src/routes/admin/companyType.js";
import country from "../../src/routes/admin/country.js";
import currency from "../../src/routes/admin/currency.js";
import department from "../../src/routes/admin/department.js";
import languages from "../../src/routes/admin/languages.js";
import paymentTerms from "../../src/routes/admin/paymentTerms.js";
import paymentType from "../../src/routes/admin/paymentType.js";
import purchaseGroup from "../../src/routes/admin/purchaseGroup.js";
import reconciliation from "../../src/routes/admin/reconciliation.js";
import test from "../../src/routes/admin/test.js";
import textract from "../../src/routes/admin/textract.js";
import uom from "../../src/routes/admin/uom.js";
import vendorClass from "../../src/routes/admin/vendorClass.js";
import vendorSchema from "../../src/routes/admin/vendorSchema.js";
import tds from "../../src/routes/admin/tds.js";
import dashboard from "../../src/routes/admin/dashboard.js";
import bpg from "../../src/routes/admin/businessPartnerGroup.js";
import businessType from "../../src/routes/admin/businessType.js";
import company from "../../src/routes/admin/company.js";
import roles from "../../src/routes/userRolesAndPermissions/roles.js";
import supplierlist from "../../src/routes/admin/sap.js";
import apis from "../../src/routes/admin/api.js";
import sapcreds from "../../src/routes/admin/sapcreds.js";
import plans from "../../src/routes/admin/plans.js";
import plants from "../../src/routes/admin/plants.js";
import plansTenure from "../../src/routes/admin/plansTenures.js";
import subscriber from "../../src/routes/admin/subscriber.js";
import users from "../../src/routes/admin/users.js";
import deptPoratalCode from "../../src/routes/admin/departmentPortalCode.js";
import module from "../../src/routes/admin/module.js";
import permissions from "./admin/rolesAndPermissions.js";
import emailLogs from "../../src/routes/admin/emailLogs.js";
import msme from "../../src/routes/admin/msme.js";
import cronJob from "../../src/routes/admin/cronJob.js";
import approver from "../../src/routes/admin/approver.js";
import logs from "../../src/routes/admin/logs.js"
import role from "../../src/routes/admin/roles.js"
import modules from "../../src/routes/admin/modules.js";
import deptHr from "../../src/routes/admin/departmentHierarchy.js"


const router = express.Router();

router.post("/isTokenExpired", admin.isTokenExpired);

// router.use(verifyToken.jwtMiddleware);
//router.use(verifyToken.guard.check([['Admin'],['admin']]))

// Paths for Admins
router.post(
  "/adminUser/create",
  verifyToken.verifyToken,
  admin.createAdminUser
);
router.post("/adminUser/list", verifyToken.verifyToken, admin.paginateAdmin);
router.post("/adminUser/update", verifyToken.verifyToken, admin.updateAdmin);
router.post("/adminUser/delete", verifyToken.verifyToken, admin.deleteAdmin);
router.post("/roles/listing", verifyToken.verifyToken, admin.rolesListing);
router.post("/modules", verifyToken.verifyToken, admin.modulesListing);
router.post(
  "/user/getApprover/:id",
  verifyToken.verifyToken,
  admin.getApprover
);

//path for users
router.use("/users", users);
//new routes are following:

router.use("/dashboard", verifyToken.verifyToken, dashboard); //checked
router.use("/companyType", companyType); //checked
router.use("/country", country); //checked
router.use("/currency", currency); //checked
router.use("/department", department); //checked 90%
router.use("/languages", languages); //checked
router.use("/paymentTerms", paymentTerms); //checked
router.use("/paymentTypes", paymentType); //checked
router.use("/purchaseGroup", purchaseGroup); //checked
router.use("/reconciliation", reconciliation); //checked
router.use("/tds", tds); //checked
router.use("/test", test); //checked
router.use("/aws", textract); //checked
router.use("/uom", uom); //checked
router.use("/vendorClass", vendorClass); //checked
router.use("/vendorSchema", vendorSchema); //checked
router.use("/bpg", bpg); //checked - business partner group
router.use("/businessType", businessType);
router.use("/company", company); //checked
router.use("/roles", roles); //checked
router.use("/sap", supplierlist); //checked
router.use("/api", verifyToken.verifyToken, apis); //checked
router.use("/sapcreds", verifyToken.verifyToken, sapcreds);
router.use("/plans", plans); //checked
router.use("/plants", plants); //checked
router.use("/plansTenure", plansTenure); //checked
router.use("/subscriber", verifyToken.verifyToken, subscriber);
router.use("/departmentPortalCode", deptPoratalCode);
router.use("/module", module);
router.use("/rolesAndPermissions", verifyToken.verifyToken, permissions);
router.use("/emailLogs", verifyToken.verifyToken, emailLogs);
router.use("/msme", msme);
router.use("/emailLogs",verifyToken.verifyToken,emailLogs);
router.use("/cronJob",verifyToken.verifyToken,cronJob);
router.use("/approver", verifyToken.verifyToken, approver);
router.use("/logs",logs)
router.use("/role",role)
router.use("/modules",modules)
router.use("/departmentHierarchy", deptHr)


// router.use(function (err, req, res, next) {
//   if (err.code == "permission_denied") {
//     return res.json({
//       error: true,
//       message: "You don't have permission to this route.",
//     });
//   } else if (err.code == "invalid_token") {
//     return res.json({
//       error: true,
//       jwt: false,
//       message: "Jwt expired.",
//     });
//   } else if (err) {
//     return res.json({
//       error: true,
//       message: "Invalid token please login again.",
//     });
//   }
//   next();
// });

export default router;
