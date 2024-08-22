import Joi from "joi";
import functions from "../../helpers/functions.js";

const fieldsConfig = await functions.getFieldConfig("supplier_registration", 1);

const conditionalValidation = (object, condition) =>
  condition === true ? object.required() : object.optional().allow("");

const supplierSchema = (data) => {
  const supplierData = Joi.object({
    emailID: conditionalValidation(
      Joi.string().trim().email().messages({
        "string.email": "Invalid email format",
      }),
      fieldsConfig.companyDetails.emailID
    ),
    mobile: conditionalValidation(
      Joi.string().trim().length(10),
      fieldsConfig.companyDetails.mobile
    ).messages({
      "string.length": "Mobile Number should be 10 characters long",
    }),
    telephone: conditionalValidation(
      Joi.string().trim(),
      fieldsConfig.companyDetails.telephone
    ),
    designation: conditionalValidation(
      Joi.string().trim(),
      fieldsConfig.companyDetails.designation
    ),
    contactPersonName: conditionalValidation(
      Joi.string().trim(),
      fieldsConfig.companyDetails.contactPersonName
    ),
    cinNo: conditionalValidation(
      Joi.string().trim(),
      fieldsConfig.companyDetails.cinNo
    ),
    aadharNo: conditionalValidation(
      Joi.string().length(12),
      fieldsConfig.companyDetails.aadharNo
    ).messages({
      "string.length": "Aadhar Card Number should be 12 characters long",
    }),
    officeDetails: conditionalValidation(
      Joi.string().trim(),
      fieldsConfig.companyDetails.officeDetails
    ),
    paymentMethod: conditionalValidation(
      Joi.number(),
      fieldsConfig.companyDetails.paymentMethod
    ),
    website: conditionalValidation(
      Joi.string().trim(),
      fieldsConfig.companyDetails.website
    ),
    phoneNo: conditionalValidation(
      Joi.string().trim(),
      fieldsConfig.companyDetails.phoneNo
    ),
    pin: conditionalValidation(
      Joi.string().trim(),
      fieldsConfig.companyDetails.pin
    ),
    city: conditionalValidation(
      Joi.string().trim(),
      fieldsConfig.companyDetails.city
    ),
    country: conditionalValidation(
      Joi.string().optional().allow("", null),
      fieldsConfig.companyDetails.country
    ),
    address3: conditionalValidation(
      Joi.string().trim(),
      fieldsConfig.companyDetails.address3
    ),
    address2: conditionalValidation(
      Joi.string().trim(),
      fieldsConfig.companyDetails.address2
    ),
    address1: conditionalValidation(
      Joi.string().trim(),
      fieldsConfig.companyDetails.address1
    ),
    streetNo: conditionalValidation(
      Joi.string().trim(),
      fieldsConfig.companyDetails.streetNo
    ),
    source: conditionalValidation(
      Joi.string().optional().allow("", null),
      fieldsConfig.companyDetails.source
    ),
    supplier_name: conditionalValidation(
      Joi.string().trim(),
      fieldsConfig.companyDetails.supplier_name
    ),
    add: Joi.object({
      value: Joi.optional().default(""),
      data: Joi.optional().default(""),
      label: Joi.string().optional().default(""),
    }).optional(),
    state: conditionalValidation(
      Joi.string().optional().allow("", null),
      fieldsConfig.companyDetails.state
    ),
    department: conditionalValidation(
      Joi.string().optional().allow("", null),
      fieldsConfig.companyDetails.department
    ),
    gstNo: conditionalValidation(
      Joi.string()
        .length(15)
        .regex(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}[Z]{1}[0-9A-Z]{1}$/)
        .messages({
          "string.length": "GST Number should be 15 characters long",
          "string.pattern.base": "Invalid GST No format",
        }),
      fieldsConfig.companyDetails.gstNo
    ),
    panNo: conditionalValidation(
      Joi.string()
        .length(10)
        .regex(/^[A-Z]{5}[0-9]{4}[A-Z]$/)
        .messages({
          "string.length": "Pan Number should be 10 characters long",
          "string.pattern.base": "Invalid Pan No format",
        }),
      fieldsConfig.companyDetails.panNo
    ),
    sap_code: conditionalValidation(Joi.string().optional().allow("")),
  }).with("panNo", "gstNo");

  return supplierData.validate(data, { abortEarly: false });
};

const businessSchema = (data) => {
  const businessDetails = Joi.object({
    company_id: Joi.string().required(),
    detailsOfMajorLastYear: conditionalValidation(
      Joi.string().optional().allow("", null),
      fieldsConfig.businessDetails.detailsOfMajorLastYear
    ),
    listOfMajorCustomers: conditionalValidation(
      Joi.string().optional().allow("", null),
      fieldsConfig.businessDetails.listOfMajorCustomers
    ),
    nameOfOtherGroupCompanies: conditionalValidation(
      Joi.string().trim(),
      fieldsConfig.businessDetails.nameOfOtherGroupCompanies
    ),
    addressOfPlant: conditionalValidation(
      Joi.string().trim(),
      fieldsConfig.businessDetails.addressOfPlant
    ),
    msme_no: conditionalValidation(
      // Joi.string().trim().default(""),
      Joi.string()
        .regex(/^UDYAM-[A-Z]{2}-\d{2}-\d{7}$/)
        .messages({
          "string.pattern.base": "Invalid MSME No. format",
        })
        .default(""),
      fieldsConfig.businessDetails.msme_no
    ),
    businessType: conditionalValidation(
      Joi.string().optional().allow("", null),
      fieldsConfig.businessDetails.businessType
    ),
    msmeType: conditionalValidation(
      Joi.string().optional().allow("", null),
      fieldsConfig.businessDetails.msmeType
    ),
    nameOfBusiness: conditionalValidation(
      Joi.string().trim(),
      fieldsConfig.businessDetails.nameOfBusiness
    ),
    companyType: conditionalValidation(
      Joi.string().trim(),
      fieldsConfig.businessDetails.companyType
    ),
    promoterName: conditionalValidation(
      Joi.string().trim(),
      fieldsConfig.businessDetails.promoterName
    ),
    companyFoundYear: conditionalValidation(
      Joi.string().trim(),
      fieldsConfig.businessDetails.companyFoundYear
    ),
  });
  return businessDetails.validate(data, { abortEarly: false });
};

const financialSchema = (data) => {
  const financialDetails = Joi.object({
    company_id: Joi.string().required(),
    currency: conditionalValidation(
      Joi.string().trim(),
      fieldsConfig.businessDetails.currency
    ),
    turnover: conditionalValidation(
      Joi.string().trim(),
      fieldsConfig.financialDetails.Turnover
    ),
    turnover2: conditionalValidation(
      Joi.string().trim(),
      fieldsConfig.financialDetails.Turnover2
    ),
    turnover3: conditionalValidation(
      Joi.string().trim(),
      fieldsConfig.financialDetails.Turnover3
    ),
    first: conditionalValidation(
      Joi.string().trim(),
      fieldsConfig.financialDetails.first
    ),
    second: conditionalValidation(
      Joi.string().trim(),
      fieldsConfig.financialDetails.second
    ),
    third: conditionalValidation(
      Joi.string().trim(),
      fieldsConfig.financialDetails.third
    ),
    afterfirst: conditionalValidation(
      Joi.string().trim(),
      fieldsConfig.financialDetails.afterfirst
    ),
    aftersecond: conditionalValidation(
      Joi.string().trim(),
      fieldsConfig.financialDetails.aftersecond
    ),
    afterthird: conditionalValidation(
      Joi.string().trim(),
      fieldsConfig.financialDetails.afterthird
    ),
    presentorder: conditionalValidation(
      Joi.string().trim(),
      fieldsConfig.financialDetails.presentorder
    ),
    furtherorder: conditionalValidation(
      Joi.string().trim(),
      fieldsConfig.financialDetails.furtherorder
    ),
    market: conditionalValidation(
      Joi.string().trim(),
      fieldsConfig.financialDetails.market
    ),
    networth: conditionalValidation(
      Joi.string().trim(),
      fieldsConfig.financialDetails.networth
    ),
    p_bank_name: conditionalValidation(
      Joi.string().trim(),
      fieldsConfig.financialDetails.p_bank_name
    ),
    p_bank_account_number: conditionalValidation(
      Joi.string().trim(),
      fieldsConfig.financialDetails.p_bank_account_number
    ),
    p_bank_account_holder_name: conditionalValidation(
      Joi.string().trim(),
      fieldsConfig.financialDetails.p_bank_account_holder_name
    ),
    p_bank_state: conditionalValidation(
      Joi.string().trim(),
      fieldsConfig.financialDetails.p_bank_state
    ),
    p_bank_address: conditionalValidation(
      Joi.string().trim(),
      fieldsConfig.financialDetails.p_bank_address
    ),
    p_bank_branch: conditionalValidation(
      Joi.string().trim(),
      fieldsConfig.financialDetails.p_bank_branch
    ),
    p_ifsc_code: conditionalValidation(
      Joi.string().trim(),
      fieldsConfig.financialDetails.p_ifsc_code
    ).messages({
      "string.empty": "Primary IFSC Code is required",
    }),
    p_micr_code: conditionalValidation(
      Joi.string().trim(),
      fieldsConfig.financialDetails.p_micr_code
    ),
    p_bank_guarantee_limit: conditionalValidation(
      Joi.string().trim(),
      fieldsConfig.financialDetails.p_bank_guarantee_limit
    ),
    p_overdraft_cash_credit_limit: conditionalValidation(
      Joi.string().trim(),
      fieldsConfig.financialDetails.p_overdraft_cash_credit_limit
    ),
    s_bank_name: conditionalValidation(
      Joi.string().trim(),
      fieldsConfig.financialDetails.s_bank_name
    ),
    s_bank_account_number: conditionalValidation(
      Joi.string().trim(),
      fieldsConfig.financialDetails.s_bank_account_number
    ),
    s_bank_account_holder_name: conditionalValidation(
      Joi.string().trim(),
      fieldsConfig.financialDetails.s_bank_account_holder_name
    ),
    s_bank_state: conditionalValidation(
      Joi.string().trim(),
      fieldsConfig.financialDetails.s_bank_state
    ),
    s_bank_address: conditionalValidation(
      Joi.string().trim(),
      fieldsConfig.financialDetails.s_bank_address
    ),
    s_bank_branch: conditionalValidation(
      Joi.string().trim(),
      fieldsConfig.financialDetails.s_bank_branch
    ),
    s_ifsc_code: conditionalValidation(
      Joi.string().trim(),
      fieldsConfig.financialDetails.s_ifsc_code
    ),
    s_micr_code: conditionalValidation(
      Joi.string().trim(),
      fieldsConfig.financialDetails.s_micr_code
    ),
    s_bank_guarantee_limit: conditionalValidation(
      Joi.string().trim(),
      fieldsConfig.financialDetails.s_bank_guarantee_limit
    ),
    s_overdraft_cash_credit_limit: conditionalValidation(
      Joi.string().trim(),
      fieldsConfig.financialDetails.s_overdraft_cash_credit_limit
    ),
  });
  return financialDetails.validate(data, { abortEarly: false });
};

const taxSchema = (data) => {
  const taxDetails = Joi.object({
    company_id: Joi.string().required(),
    gstRegDate: conditionalValidation(
      Joi.string().trim(),
      fieldsConfig.taxDetails.gstRegDate
    ),
    msmeImage: conditionalValidation(
      Joi.string().trim().message("MSME image is required"),
      fieldsConfig.taxDetails.msmeImage
    ),
    gstImage: conditionalValidation(
      Joi.string().trim().message("GST image is required"),
      fieldsConfig.taxDetails.gstImage
    ),
    cancelledChequeImage: conditionalValidation(
      Joi.string().trim().messages({
        "string.empty": "cancelledChequeImage is required",
      }),
      fieldsConfig.taxDetails.cancelledChequeImage
    ),
    panCardImage: conditionalValidation(
      Joi.string().trim().messages({
        "string.empty": "panCardImage is required",
      }),
      fieldsConfig.taxDetails.panCardImage
    ),
    pfAttachment: conditionalValidation(
      Joi.string().trim().message("Pf attachment is Required"),
      fieldsConfig.taxDetails.pfAttachment
    ),

    otherAttachments: conditionalValidation(
      Joi.string().trim().message("Other attachments are Required"),
      fieldsConfig.taxDetails.otherAttachments
    ),
  });
  return taxDetails.validate(data, { abortEarly: false });
};

const additionalSchema = (data) => {
  const additionalDetails = Joi.object({
    supplier_id: Joi.string().required(),
    companies: Joi.string().required().messages({
      "string.required": "Company is required",
    }),
    business_partner_groups: Joi.number().required(),
    reconciliation_ac: Joi.number().optional(),
    vendor_class: Joi.number().required().messages({
      "any.required": "Vendor class is required",
    }),
    vendor_schema: Joi.number().required().messages({
      "any.required": "Vendor Schema is required",
      "any.empty": "Vendor Schema is required",
    }),
    payment_terms: Joi.number().required().messages({
      "any.required": "Payment Terms is required",
    }),
    purchase_group: Joi.number().required().messages({
      "any.required": "Purchase group is required",
    }),
    itWitholding: Joi.string().optional(),
  })
    .optional()
    .allow({});
  return additionalDetails.validate(data, { abortEarly: false });
};

const viewSupplier = (data) => {
  const schema = Joi.object({
    id: Joi.string().uuid().required(),
  });
  return schema.validate(data);
};
const sapToDb = (data) => {
  const schema = Joi.object({
    supplierDetails: Joi.object({
      supplierName: Joi.string().required(),
      emailID: Joi.string().required(),
      password: Joi.string().required().trim(),
      mobile: Joi.string().required(),
      telephone: Joi.string().allow(""),
      designation: Joi.string().required(),
      contactPersonName: Joi.string().required(),
      cinNo: Joi.string().required(),
      aadharNo: Joi.string().required(),
      officeDetails: Joi.string().allow(""),
      paymentMethod: Joi.string()
        .valid("Cash Payment", "Cheque", "Bank Transfer")
        .required(),
      website: Joi.string().required(),
      phoneNo: Joi.string().allow(""),
      streetNo: Joi.string().allow(""),
      address1: Joi.string().required(),
      address2: Joi.string().allow(""),
      address3: Joi.string().allow(""),
      city: Joi.string().required(),
      pin: Joi.string().required(),
      state: Joi.string().required(),
      country: Joi.string().required(),
      source: Joi.string().required(),
      add: Joi.number().default("0"),
      department: Joi.string().required(),
      sapCode: Joi.string().allow(""),
      status: Joi.number()
        .valid("approved", "verified", "pending", "rejected", "queried")
        .default("pending"),
      comment: Joi.string().allow(""),
      gstNo: Joi.string().allow(""),
      panNo: Joi.string().allow(""),
      subscriberId: Joi.string().allow(""),
      type: Joi.string().valid("goods", "services").required(),
    }),
    businessDetails: Joi.object({
      companyFoundYear: Joi.string().allow(""),
      msmeNo: Joi.string().allow(""),
      promoterName: Joi.string().allow(""),
      companyType: Joi.string().allow(""),
      nameOfBusiness: Joi.string().allow(""),
      businessType: Joi.string().allow(""),
      msmeType: Joi.string().allow(""),
      addressOfPlant: Joi.string().allow(""),
      nameOfOtherGroupCompanies: Joi.string().allow(""),
      listOfMajorCustomers: Joi.string().allow(""),
      detailsOfMajorLastYear: Joi.string().allow(""),
    }),
    financialDetails: Joi.object({
      currency: Joi.string().allow(""),
      turnover: Joi.string().allow(""),
      turnover2: Joi.string().allow(""),
      turnover3: Joi.string().allow(""),
      first: Joi.string().allow(""),
      second: Joi.string().allow(""),
      third: Joi.string().allow(""),
      afterfirst: Joi.string().allow(""),
      aftersecond: Joi.string().allow(""),
      afterthird: Joi.string().allow(""),
      presentorder: Joi.string().allow(""),
      furtherorder: Joi.string().allow(""),
      market: Joi.string().allow(""),
      networth: Joi.string().allow(""),
      primaryBankName: Joi.string().required(),
      primaryBankAccountNumber: Joi.string().required(),
      primaryBankAccountHolderName: Joi.string().required(),
      primaryBankState: Joi.string().required(),
      primaryBankAddress: Joi.string().required(),
      primaryBankBranch: Joi.string().required(),
      primaryIfscCode: Joi.string().required(),
      primaryMicrCode: Joi.string().required(),
      primaryBankGuaranteeLimit: Joi.string().required(),
      primaryOverDraftCashCreditLimit: Joi.string().required(),
      secondaryBankName: Joi.string().required(),
      secondaryBankAccountNumber: Joi.string().required(),
      secondaryBankAccountHolderName: Joi.string().required(),
      secondaryBankState: Joi.string().required(),
      secondaryBankAddress: Joi.string().required(),
      secondaryBankBranch: Joi.string().required(),
      secondaryIfscCode: Joi.string().required(),
      secondaryMicrCode: Joi.string().required(),
      secondaryBankGuaranteeLimit: Joi.string().required(),
      secondaryOverDraftCashCreditLimit: Joi.string().required(),
    }),
    taxDetails: {
      gstRegDate: Joi.string().allow(""),
      msmeImage: Joi.string().allow(""),
      gstImage: Joi.string().required(),
      cancelledChequeImage: Joi.string().required(),
      panCardImage: Joi.string().required(),
      pfAttachment: Joi.string().allow(""),
      otherAttachments: Joi.string().allow(""),
    },
    additionalDetails: {
      nameOfCompany: Joi.array().items(Joi.string()),
      businessPartnerGroup: Joi.string(),
      reconciliationAccount: Joi.string(),
      vendorClass: Joi.string(),
      vendorSchema: Joi.string(),
      paymentTerms: Joi.string(),
      purchaseGroup: Joi.string(),
    },
    itWitholding: Joi.array().items(
      Joi.object({
        taxType: Joi.string().required(),
        taxCode: Joi.string().required(),
        recipientType: Joi.string().required(),
        wtSubjct: Joi.string().required(),
      })
    ),
    approvalInfo: Joi.object({
      approverEmail: Joi.string().email().required(),
      approverRemarks: Joi.string().required(),
      approvalTime: Joi.string().isoDate().required(),
    }),
  });
  return schema.validate(data);
};

export default {
  supplierSchema,
  businessSchema,
  financialSchema,
  taxSchema,
  additionalSchema,
  viewSupplier,
  sapToDb,
};
