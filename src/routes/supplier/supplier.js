import express from "express";
import supplier from "../../../src/controller/supplier/supplier.js";
// import token from "../../middleware/jwt.js";
import verifyToken from "../../middleware/jwt.js";
import token from "../../middleware/jwt.js";
import functions from "../../helpers/functions.js";

const router = express.Router();

const moduleName = "Supplier Details";
const moduleMaster = "Masters";
const supplierListModule = "Suppliers List";
// router.use(verifyToken.jwtMiddleware);

//slug routes
router.post("/sendSlugLink", token.verifyTokenNew, supplier.sendSlugLink);
router.post("/slugToDepartment/:slug", supplier.slugToDepartment);

router.delete(
  "/deleteMultiple",
  token.verifyTokenNew,
  functions.checkPermission(moduleName, "delete"),
  supplier.deleteMultiple
);
router.post(
  "/makeActive",
  token.verifyTokenNew,
  functions.checkPermission(moduleName, "update"),
  supplier.makeActive
);
router.post(
  "/supplierLogs",
  verifyToken.verifyToken,
  supplier.paginateSupplierLogs
);
router.post("/register", supplier.registerSupplier);
router.post("/send-otp", supplier.sendOtp);
router.post("/verify-otp", supplier.verifyOtp);
router.post("/listsupplier",token.verifyTokenNew, supplier.listSupplier);
router.post("/excelExport",token.verifyTokenNew, functions.checkPermission(moduleName,"read"), supplier.exportToExcel);
router.post("/changestatus",token.verifyTokenNew, functions.checkPermission(supplierListModule,"update"), supplier.changestatus);
router.post("/dynamicStatusChange",supplier.dynamicStatusChange)
router.post("/approverTimeline", supplier.dynamicApproverTimeline)
router.post("/workFlowSupplierList",supplier.supplierListForApproverWorkFlow)

//for approverTimeline
// router.post("/supplier-approve",verifyToken.verifyToken, supplier.dynamicStatusChange);
// router.post("/timeline",supplier.dynamicApproverTimeline)
////////////////////

router.post("/test/:id", verifyToken.verifyToken, supplier.viewFieldsForSap);

router.delete(
  "/delete/:id",
  token.verifyTokenNew,
  functions.checkPermission(moduleName, "delete"),
  supplier.deleteSupplier
);
router.post(
  "/bulkdelete",
  token.verifyTokenNew,
  functions.checkPermission(moduleName, "delete"),
  supplier.bulkDeleteSuppliers
);

router.post("/query", verifyToken.verifyToken, supplier.queriedSupplier);
router.post("/approve", verifyToken.verifyToken, supplier.approvedSupplier);
router.post("/reject", verifyToken.verifyToken, supplier.rejectedSupplier);
router.post("/verify", verifyToken.verifyToken, supplier.verifySupplier);
router.post(
  "/deactive/:id",
  token.verifyTokenNew,
  functions.checkPermission(moduleName, "update"),
  supplier.deactiveSupplier
);
router.post(
  "/statusemail",
  verifyToken.verifyToken,
  supplier.changeStatusWithEmail
);

router.post(
  "/supplierListForWorkflow",
  verifyToken.verifyToken,
  supplier.supplierListForWorkflow
);
router.post(
  "/supplierChangeStatusList",
  token.verifyTokenNew,
  functions.checkPermission(moduleName, "read"),
  supplier.supplierChangeStatusList
);
router.post("/filter", verifyToken.verifyToken, supplier.supplierFilteredList);
router.post("/view/:id", token.verifyTokenNew, functions.checkPermission(moduleName,"read"), supplier.view);
router.post("/approver-view/:id", token.verifyTokenNew, functions.checkPermission(supplierListModule,"read"), supplier.view);
router.post("/createMajorCustomer", supplier.createMajorCustomer);
router.post("/major_customer_list", supplier.majorCustomerList);
router.post(
  "/create_details_of_major_order",
  supplier.createDetailsOfMajorOrder
);
router.post("/details_of_major_order_list", supplier.detailsOfMajorOrderList);
router.post("/supplier_validation", supplier.supplierValidation);
router.post("/checkmail", supplier.checkIfEmailExist);
router.post(
  "/createdsupplierlist",
  verifyToken.verifyToken,
  supplier.createdSupplierList
);
router.post(
  "/pendingsupplierlist",
  verifyToken.verifyToken,
  supplier.pendingSupplierList
);
router.post(
  "/level1filterlist",
  verifyToken.verifyToken,
  supplier.levelVerifeidList
);
router.post(
  "/update_tds",
  token.verifyTokenNew,
  functions.checkPermission(moduleMaster, "update"),
  verifyToken.verifyToken,
  supplier.updateTds
);
router.put("/update_supplier", supplier.updateSupplier);

router.put(
  "/update_supplier_by_admin",
  token.verifyTokenNew,
  functions.checkPermission(supplierListModule, "update"),
  supplier.updateSupplierByAdmin
);

router.put(
  "/update_tax_details",
  token.verifyTokenNew,
  functions.checkPermission(moduleName, "update"),
  supplier.updateTaxDetails
);

router.post(
  "/getIdFromGstNo/:gstNo",
  token.verifyTokenNew,
  functions.checkPermission(moduleName, "read"),
  supplier.getIdFromGstNo
);
router.post(
  "/getIdFromPanNo/:panNo",
  token.verifyTokenNew,
  functions.checkPermission(moduleName, "read"),
  supplier.getIdFromPanNo
);
// router.use(function (err, req, res, next) {
//   if (err.code == "permission_denied") {
//     return res.status(403).json({
//       error: true,
//       message: "You don't have permission to this route.",
//     });
//   } else if (err.code == "invalid_token") {
//     return res.status(403).json({
//       error: true,
//       jwt: false,
//       message: "Jwt expired.",
//     });
//   } else if (err) {
//     return res.status(403).json({
//       error: true,
//       message: "Invalid token please login again.",
//     });
//   }
//   next();
// });

export default router;
