import Joi from "joi";
import functions from "../../helpers/functions.js";

const fieldsConfig = await functions.getFieldConfig("supplier_registration", 1);

const conditionalValidation = (object, condition) =>
  condition === true ? object.required() : object.optional().allow("");

const registerSupplier = (data) => {
  const schema = Joi.object({
    companyDetails: Joi.object({
      emailID: conditionalValidation(
        Joi.string().trim(),
        fieldsConfig.companyDetails.emailID
      ),
      mobile: conditionalValidation(
        Joi.string().trim(),
        fieldsConfig.companyDetails.mobile
      ),
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
      ),
      officeDetails: conditionalValidation(
        Joi.string().trim(),
        fieldsConfig.companyDetails.officeDetails
      ),
      paymentMethod: conditionalValidation(
        Joi.any().allow("", {
          value: Joi.string(),
          label: Joi.string(),
        })
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
        Joi.object({
          value: Joi.string().optional().allow("", null).allow("", null),
          label: Joi.string().optional().allow("", null).allow("", null),
        }),
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
        Joi.object({
          value: Joi.string().optional().allow("", null).allow("", null),
          label: Joi.string().optional().allow("", null).allow("", null),
        }),
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
        Joi.object({
          value: Joi.string().optional().allow("", null).allow("", null),
          label: Joi.string().optional().allow("", null).allow("", null),
        }),
        fieldsConfig.companyDetails.state
      ),
      department: conditionalValidation(
        Joi.object({
          value: Joi.string().optional().allow("", null).allow("", null),
          label: Joi.string().optional().allow("", null).allow("", null),
        })
      ),
      gstNo: conditionalValidation(Joi.string().length(15)),
      panNo: conditionalValidation(Joi.string().length(10)),
    }),
    businessDetails: Joi.object({
      detailsOfMajorLastYear: conditionalValidation(
        Joi.object({
          value: Joi.string().optional().allow("", null).allow("", null),
          label: Joi.string().optional().allow("", null).allow("", null),
        }),
        fieldsConfig.businessDetails.detailsOfMajorLastYear
      ),
      listOfMajorCustomers: conditionalValidation(
        Joi.object({
          value: Joi.string().optional().allow("", null).allow("", null),
          label: Joi.string().optional().allow("", null).allow("", null),
        }),
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
        Joi.string().trim().default(""),
        fieldsConfig.businessDetails.msme_no
      ),
      businessType: conditionalValidation(
        Joi.object({
          value: Joi.string().optional().allow("", null).allow("", null),
          label: Joi.string().optional().allow("", null).allow("", null),
        }),
        fieldsConfig.businessDetails.businessType
      ),
      // msmeType: conditionalValidation(
      //   Joi.object({
      //     value: Joi.string().optional().allow("", null),
      //     label: Joi.string().optional().allow("", null),
      //   }),
      //   fieldsConfig.businessDetails.msmeType
      // ),
      msmeType: Joi.object({
        value: Joi.string().optional().allow("", null),
        label: Joi.string().optional().allow("", null),
      }),

      nameOfBusiness: conditionalValidation(
        Joi.string().trim(),
        fieldsConfig.businessDetails.nameOfBusiness
      ),
      companyType: conditionalValidation(
        Joi.object({
          value: Joi.string().optional().allow("", null).allow("", null),
          label: Joi.string().optional().allow("", null).allow("", null),
        }),
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
    }),
    financialDetails: Joi.object({
      currency: conditionalValidation(
        Joi.object({
          value: Joi.string().optional().allow("", null).allow("", null),
          label: Joi.string().optional().allow("", null).allow("", null),
        }),
        fieldsConfig.businessDetails.currency
      ),
      Turnover: conditionalValidation(
        Joi.string().trim(),
        fieldsConfig.financialDetails.Turnover
      ),
      Turnover2: conditionalValidation(
        Joi.string().trim(),
        fieldsConfig.financialDetails.Turnover2
      ),
      Turnover3: conditionalValidation(
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
      ),
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
    }),
    taxDetails: Joi.object({
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
        Joi.string().trim().message("Cancelled Cheque Image is Required"),
        fieldsConfig.taxDetails.cancelledChequeImage
      ),
      panCardImage: conditionalValidation(
        Joi.string().trim().message("Pan image is Required"),
        fieldsConfig.taxDetails.panCardImage
      ),
      pfAttachment: conditionalValidation(
        Joi.string().trim().message("PF attachment is Required"),
        fieldsConfig.taxDetails.pfAttachment
      ),
      otherAttachments: conditionalValidation(
        Joi.string().trim().message("Other attachments are Required"),
        fieldsConfig.taxDetails.otherAttachments
      ),
    }),
    additionalDetails: Joi.optional().allow("", {}),
  });
  return schema.validate(data);
};

const checkEmailExists = (data) => {
  const schema = Joi.object({
    email: Joi.string().email({ tlds: { allow: false } }),
  });

  return schema.validate(data);
};

const update = (data) => {
  const schema = Joi.object({
    id: Joi.string().required(),
    companyDetails: Joi.object({
      emailID: conditionalValidation(
        Joi.string().trim(),
        fieldsConfig.companyDetails.emailID
      ),
      mobile: conditionalValidation(
        Joi.string().trim(),
        fieldsConfig.companyDetails.mobile
      ),
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
      ),
      officeDetails: conditionalValidation(
        Joi.string().trim(),
        fieldsConfig.companyDetails.officeDetails
      ),
      paymentMethod: conditionalValidation(
        Joi.any().allow("", {
          value: Joi.string(),
          label: Joi.string(),
        })
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
        Joi.object({
          value: Joi.string().optional().allow("", null).allow("", null),
          label: Joi.string().optional().allow("", null).allow("", null),
        }),
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
        Joi.object({
          value: Joi.string().optional().allow("", null).allow("", null),
          label: Joi.string().optional().allow("", null).allow("", null),
        }),
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
        Joi.object({
          value: Joi.string().optional().allow("", null).allow("", null),
          label: Joi.string().optional().allow("", null).allow("", null),
        }),
        fieldsConfig.companyDetails.state
      ),
      department: conditionalValidation(
        Joi.object({
          value: Joi.string().optional().allow("", null).allow("", null),
          label: Joi.string().optional().allow("", null).allow("", null),
        })
      ),
      gstNo: conditionalValidation(Joi.string().length(15)),
      panNo: conditionalValidation(Joi.string().length(10)),
    }),
    businessDetails: Joi.object({
      detailsOfMajorLastYear: conditionalValidation(
        Joi.object({
          value: Joi.string().optional().allow("", null).allow("", null),
          label: Joi.string().optional().allow("", null).allow("", null),
        }),
        fieldsConfig.businessDetails.detailsOfMajorLastYear
      ),
      listOfMajorCustomers: conditionalValidation(
        Joi.object({
          value: Joi.string().optional().allow("", null).allow("", null),
          label: Joi.string().optional().allow("", null).allow("", null),
        }),
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
        Joi.string().trim().default(""),
        fieldsConfig.businessDetails.msme_no
      ),
      businessType: conditionalValidation(
        Joi.object({
          value: Joi.string().optional().allow("", null).allow("", null),
          label: Joi.string().optional().allow("", null).allow("", null),
        }),
        fieldsConfig.businessDetails.businessType
      ),
      msmeType: conditionalValidation(
        Joi.object({
          value: Joi.string().optional().allow("", null).allow("", null),
          label: Joi.string().optional().allow("", null).allow("", null),
        }),
        fieldsConfig.businessDetails.msmeType
      ),
      nameOfBusiness: conditionalValidation(
        Joi.string().trim(),
        fieldsConfig.businessDetails.nameOfBusiness
      ),
      companyType: conditionalValidation(
        Joi.object({
          value: Joi.string().optional().allow("", null).allow("", null),
          label: Joi.string().optional().allow("", null).allow("", null),
        }),
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
    }),
    financialDetails: Joi.object({
      currency: conditionalValidation(
        Joi.object({
          value: Joi.string().optional().allow("", null).allow("", null),
          label: Joi.string().optional().allow("", null).allow("", null),
        }),
        fieldsConfig.businessDetails.currency
      ),
      Turnover: conditionalValidation(
        Joi.string().trim(),
        fieldsConfig.financialDetails.Turnover
      ),
      Turnover2: conditionalValidation(
        Joi.string().trim(),
        fieldsConfig.financialDetails.Turnover2
      ),
      Turnover3: conditionalValidation(
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
      ),
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
    }),
    taxDetails: Joi.object({
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
        Joi.string().trim().message("Cancelled Cheque Image is Required"),
        fieldsConfig.taxDetails.cancelledChequeImage
      ),
      panCardImage: conditionalValidation(
        Joi.string().trim().message("Pan image is Required"),
        fieldsConfig.taxDetails.panCardImage
      ),
      pfAttachment: conditionalValidation(
        Joi.string().trim().message("PF attachment is Required"),
        fieldsConfig.taxDetails.pfAttachment
      ),
      otherAttachments: conditionalValidation(
        Joi.string().trim().message("Other attachments are Required"),
        fieldsConfig.taxDetails.otherAttachments
      ),
    }),
    additionalDetails: Joi.optional().allow("", {}),
  });

  return schema.validate(data);
};

const sendOtp = (data) => {
  const schema = Joi.object({
    email: Joi.string()
      .email({ tlds: { allow: false } })
      .required(),
  });
  return schema.validate(data);
};

const allListSupplier = (data) => {
  const schema = Joi.object({
    offset: Joi.number().default(0),
    limit: Joi.number().default(50),
    sort: Joi.string().default("id"),
    order: Joi.string().valid("asc", "desc").default("desc"),
    status: Joi.string()
      .valid("pending", "approved", "verified", "rejected", "queried", "")
      .default(""),
    search: Joi.string().allow("", null).default(""),
    id: Joi.string().allow("", null).default(""),
  });
  return schema.validate(data);
};

const listSupplier = (data) => {
  const schema = Joi.object({
    offset: Joi.number().default(0),
    limit: Joi.number().default(50),
    sort: Joi.string().default("id"),
    order: Joi.string().valid("asc", "desc").default("desc"),
    status: Joi.string()
      .valid("pending", "rejected", "queried", "approved", "")
      .default(""),
    search: Joi.string().allow("", null).default(null),
  });
  return schema.validate(data);
};

const syncFromSap = (data) => {
  const schema = Joi.object({
    WA_GENERAL_DATA: Joi.object({
      DOC_NUMBER: Joi.string().required(),
      PARTN_GRP: Joi.string().required(),
      TITLE_KEY: Joi.string(),
      NAME1: Joi.string().required(),
      NAME2: Joi.string().required(),
      NAME3: Joi.string(),
      NAME4: Joi.string(),
      SEARCHTERM1: Joi.string().required(),
      HOUSE_NO: Joi.string().required(),
      STREET: Joi.string().required(),
      STR_SUPPL1: Joi.string().required(),
      STR_SUPPL2: Joi.string().required(),
      STR_SUPPL3: Joi.string().required(),
      CITY: Joi.string().required(),
      DISTRICT: Joi.string().required(),
      POSTL_COD1: Joi.string().required(),
      REGION: Joi.string().required(),
      COUNTRY: Joi.string().required(),
      VEN_CLASS: Joi.string(),
      J_1IPANNO: Joi.string().required(),
      TIME_STAMP: Joi.string(),
    }),
    IT_TELEPHONE: Joi.array().items(
      Joi.object({
        R_3_USER: Joi.string(),
        COUNTRY: Joi.string().required(),
        TELEPHONE: Joi.string().required(),
        EXTENSION: Joi.string(),
      })
    ),
    IT_EMAIL: Joi.array().items(
      Joi.object({
        E_MAIL: Joi.string()
          .email({ tlds: { allow: false } })
          .required(),
      })
    ),
    IT_IDENTIFICATION: Joi.array().items(
      Joi.object({
        ID_CATEGORY: Joi.string().required(),
        ID_NUMBER: Joi.string().required(),
        ID_INSTITUTE: Joi.string().required(),
        ID_VALID_FROM_DATE: Joi.string().required(),
        ID_VALID_TO_DATE: Joi.string().required(),
        ID_COUNTRY: Joi.string().required(),
        ID_REGION: Joi.string().required(),
      })
    ),
    IT_TAX_NUMBER: Joi.array().items(
      Joi.object({
        TAXTYPE: Joi.string().required(),
        TAXNUMBER: Joi.string().required(),
      })
    ),
    IT_BANK: Joi.array().items(
      Joi.object({
        BANK_COUNTRY: Joi.string().required(),
        BANK_KEY: Joi.string().required(),
        BANK_ACCOUNT_NUMBER: Joi.string().required(),
        REFERENCE_DETAILS: Joi.string(),
        BANK_DETAILS_EXTERNAL: Joi.string(),
        ACCOUNT_HOLDER_NAME: Joi.string().required(),
        BANK_ACCOUNT_NAME: Joi.string().required(),
        BANK_NAME: Joi.string().required(),
        REGION: Joi.string().required(),
        STREET: Joi.string().required(),
        CITY: Joi.string().required(),
        SWIFT_CODE: Joi.string(),
        BANK_BRANCH: Joi.string().required(),
      })
    ),
    IT_COCODE_DATA: Joi.array().items(
      Joi.object({
        COMPANY_CODE: Joi.string().required(),
        RECON_ACCOUNT: Joi.string().required(),
        HEAD_OFFICE: Joi.string(),
        PLANNING_GROUP: Joi.string(),
        PAYMENT_TERMS: Joi.string().required(),
        CHECK_DOUBLE_INVOICE: Joi.string(),
        PAYMENT_METHODS: Joi.string().required(),
        IT_WITHHOLDING: Joi.array().items(
          Joi.object({
            TAX_TYPE: Joi.string().required(),
            TAX_CODE: Joi.string(),
            WT_SUBJCT: Joi.string(),
            RECIPIENT_TYPE: Joi.string().required(),
          })
        ),
      })
    ),
    IT_PURC_DATA: Joi.array().items(
      Joi.object({
        PURCHASING_ORGANIZATION: Joi.string().required(),
        CURRENCY: Joi.string().required(),
        PAYMENT_TERMS: Joi.string().required(),
        INCOTERMS_P1: Joi.string(),
        INCOTERMS_LOC1: Joi.string(),
        INCOTERMS_LOC2: Joi.string(),
        GR_BASEDIV: Joi.string().required(),
        SERV_BASEDIV: Joi.string().required(),
        SCHEMA_GRP: Joi.string().required(),
        PURCHASING_GROUP: Joi.string().required(),
      })
    ),
  });
  return schema.validate(data);
};

const changeStatus = (data) => {
  const schema = Joi.object({
    supplier_id: Joi.string().uuid().required().trim(),
    user_id: Joi.number().required(),
    user_role: Joi.number().required(),
    approver_level: Joi.number().required().min(1), // Ensure approver_level is not zero
    approver_hr_level: Joi.number().required(),
    status: Joi.string()
      .valid("pending", "approved", "verified", "rejected", "queried")
      .default("pending"),
    comment: Joi.string().required(),
    subscriber_id: Joi.number().required(),
  });
  return schema.validate(data);
};

const queriedSupplier = (data) => {
  const schema = Joi.object({
    username: Joi.string().required().trim(),
    department: Joi.string().required().trim(),
    id: Joi.string().required().trim(),
    comment: Joi.string().allow(null, ""),
  });
  return schema.validate(data);
};

const approvedSupplier = (data) => {
  const schema = Joi.object({
    username: Joi.string().required().trim(),
    department: Joi.string().required().trim(),
    id: Joi.string().allow(null, ""),
    comment: Joi.string().allow(null, "").trim(),
  });
  return schema.validate(data);
};

const rejectedSupplier = (data) => {
  const schema = Joi.object({
    username: Joi.string().required().trim(),
    department: Joi.string().required().trim(),
    id: Joi.string().allow(null, ""),
  });
  return schema.validate(data);
};

const verifySupplier = (data) => {
  const schema = Joi.object({
    username: Joi.string().required().trim(),
    department: Joi.string().required().trim(),
    id: Joi.string().allow(null, ""),
  });

  return schema.validate(data);
};

const changeStatusWithEmail = (data) => {
  const schema = Joi.object({
    current_user_id: Joi.number().required(),
    supplier_id: Joi.string().required(),
    module_id: Joi.number().required(),
    comment: Joi.string().trim(),
    status: Joi.valid(
      "pending",
      "approved",
      "rejected",
      "verified",
      "queried"
    ).default("pending"),
  });
  return schema.validate(data);
};

const deleteSupplier = (data) => {
  const schema = Joi.object({
    id: Joi.string().required(),
  });
  return schema.validate(data);
};
const supplierListForWorkflow = (data) => {
  const schema = Joi.object({
    user_id: Joi.number().required(),
    supplier_id: Joi.string().required(),
  });
  return schema.validate(data);
};

const supplierChangeStatusList = (data) => {
  const schema = Joi.object({
    supplier_id: Joi.string().required(),
  });
  return schema.validate(data);
};

const supplierFilteredList = (data) => {
  const schema = Joi.object({
    user_id: Joi.number().required(),
    status: Joi.string()
      .required()
      .allow("pending", "queried", "verified", "approved", "rejected", "all")
      .trim(),
    offset: Joi.number().default(0),
    limit: Joi.number().default(50),
    sort: Joi.string().default("id"),
    order: Joi.string().valid("asc", "desc").default("desc"),
    search: Joi.string().allow("", null).default(""),
  });
  return schema.validate(data);
};

const view = (data) => {
  const schema = Joi.object({
    id: Joi.string().required(),
  });
  return schema.validate(data);
};

const createMajorCustomer = (data) => {
  const schema = Joi.object({
    name: Joi.string().trim().required(),
  });
  return schema.validate(data);
};

const createDetailsOfMajorOrder = (data) => {
  const schema = Joi.object({
    name: Joi.string().required(),
  });
  return schema.validate(data);
};

const supplierValidation = (data) => {
  const schema = Joi.object({
    gst_no: Joi.string().allow("").trim(),
    pan_no: Joi.string().trim().required(),
  });
  return schema.validate(data);
};

const levelVerifeidList = (data) => {
  const schema = Joi.object({
    user_id: Joi.number(),
    offset: Joi.number().default(0),
    limit: Joi.number().default(50),
    sort: Joi.string().default("id"),
    order: Joi.string().valid("asc", "desc").default("desc"),
    status: Joi.string()
      .valid("pending", "quried", "rejected", "verified", "approved", "all")
      .default("pending"),
    search: Joi.string().allow("").default(""),
  });
  return schema.validate(data);
};

const updateTds = (data) => {
  const schema = Joi.object({
    id: Joi.string().guid().required(),
    itWitholding: Joi.array()
      .items(
        Joi.object({
          taxType: Joi.string().required(),
          wtSubjct: Joi.string().required(),
          taxCode: Joi.string().required(),
          recipientType: Joi.string().required(),
        })
      )
      .min(1), // Ensure at least one item in the array
  });

  return schema.validate(data);
};

export default {
  registerSupplier,
  checkEmailExists,
  update,
  sendOtp,
  allListSupplier,
  listSupplier,
  syncFromSap,
  changeStatus,
  queriedSupplier,
  approvedSupplier,
  rejectedSupplier,
  verifySupplier,
  changeStatusWithEmail,
  deleteSupplier,
  supplierListForWorkflow,
  supplierChangeStatusList,
  supplierFilteredList,
  view,
  createMajorCustomer,
  createDetailsOfMajorOrder,
  supplierValidation,
  levelVerifeidList,
  updateTds,
};
