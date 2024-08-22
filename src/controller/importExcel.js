// import for excel function call
import vendorClass from "./admin/vendorClass.js";
import vendorSchemas from "./admin/vendorSchema.js";
import purchaseGroups from "./admin/purchaseGroup.js";
import reconciliation from "./admin/reconciliation.js";
import businessPartnerGroups from "./admin/businessPartnerGroup.js";
import businessTypes from "./admin/businessType.js";
import companyTypes from "./admin/companyType.js";
import currencies from "./admin/currency.js";
import department from "./admin/department.js";
import paymentTypes from "./admin/paymentType.js";
import paymentTerms from "./admin/paymentTerms.js";
import units from "./admin/uom.js";
import companies from "./admin/company.js";
import plants from "./admin/plants.js";
import storageLocation from "./supplier/storageLocation.js";
import materials from "./supplier/materials.js";
import materialGroup from "./supplier/materialGroup.js";
import supplierDetails from "./forSAP/supplierlist.js";

const importFunctions = {
  vendor_class: vendorClass.importExcel,
  vendor_schemas: vendorSchemas.importExcel,
  purchase_groups: purchaseGroups.importExcel,
  reconciliation_ac: reconciliation.importExcel,
  business_partner_groups: businessPartnerGroups.importExcel,
  business_types: businessTypes.importExcel,
  company_types: companyTypes.importExcel,
  currencies: currencies.importExcel,
  department: department.importExcel,
  payment_types: paymentTypes.importExcel,
  payment_terms: paymentTerms,
  units: units.importExcel,
  companies: companies.importExcel,
  plants: plants.importExcel,
  storage_location: storageLocation.importExcel,
  materials: materials.importExcel,
  material_group: materialGroup.importExcel,
  supplier_details: supplierDetails.importExcel,
};

const importExcel = async (req, res) => {
  try {
    const { table_name } = req.body;
    if (!table_name || !importFunctions[table_name]) {
      return res.status(400).json({ error: "Invalid or missing table name" });
    }
    await importFunctions[table_name](req, res);
  } catch (error) {
    // console.log(error);
    return res.status(500).json({ errors: true, message: error.message });
  }
};

export default {
  importExcel,
};
