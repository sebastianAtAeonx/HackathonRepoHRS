import Joi from "joi";

const paginateWithSapCode = (data) => {
  const schema = Joi.object({
    offset: Joi.number().default(0),
    limit: Joi.number().default(50),
    sort: Joi.string().default("id"),
    order: Joi.string().valid("asc", "desc").default("desc"),
    status: Joi.string().valid("0", "1", "").default(""),
    search: Joi.string().allow("", null).default(null),
  });

  return schema.validate(data);
};

const paginate = (data) => {
  const schema = Joi.object({
    offset: Joi.number().default(0),
    limit: Joi.number().default(50),
    sort: Joi.string().default("id"),
    order: Joi.string().valid("asc", "desc").default("desc"),
    status: Joi.string().valid("0", "1", "").default(""),
    search: Joi.string().allow("", null).default(null),
  });
  return schema.validate(data);
};

const update = (data) => {
  const schema = Joi.object({
    supplierId: Joi.string().required(),
    supplierName: Joi.string().required(),
    emailId: Joi.string().required(),
    mobile: Joi.string().allow(""),
    telephone: Joi.string().allow(""),
    designation: Joi.string().allow(""),
    contactPersonName: Joi.string().allow(""),
    cinNo: Joi.string().allow(""),
    aadharNo: Joi.string().allow(""),
    officeDetails: Joi.string().allow(""),
    paymentMethod: Joi.string().allow(""),
    website: Joi.string().allow(""),
    phoneNo: Joi.string().allow(""),
    pin: Joi.string().allow(""),
    city: Joi.string().allow(""),
    countryCode: Joi.string().allow(""),
    address3: Joi.string().allow(""),
    address2: Joi.string().allow(""),
    address1: Joi.string().allow(""),
    streetNo: Joi.string().allow(""),
    source: Joi.string().allow(""),
    state: Joi.string().allow(""),
    departmentId: Joi.string().allow(""),
    department: Joi.string().allow(""),
    sapCode: Joi.string().allow("", null),
    comment: Joi.string().allow(""),
    gstNo: Joi.string().allow(""),
    panNo: Joi.string().allow(""),
    companyFoundYear: Joi.string().allow(""),
    msmeNo: Joi.string().allow(""),
    msmeType: Joi.string().allow("", null),
    promoterName: Joi.string().allow(""),
    companyType: Joi.string().allow(""),
    nameOfBusiness: Joi.string().allow(""),
    businessType: Joi.string().allow(""),
    addressOfPlant: Joi.string().allow(""),
    nameOfOtherGroupCompanies: Joi.string().allow(""),
    listOfMajorCustomers: Joi.string().allow(""),
    detailsOfMajorLastYear: Joi.string().allow(""),
    currency: Joi.string().allow(""),
    turnover: Joi.string().allow(""),
    turnover2: Joi.string().allow(""),
    turnover3: Joi.string().allow(""),
    first: Joi.string().allow(""),
    second: Joi.string().allow(""),
    third: Joi.string().allow(""),
    afterFirst: Joi.string().allow(""),
    afterSec: Joi.string().allow(""),
    afterThird: Joi.string().allow(""),
    presentOrder: Joi.string().allow(""),
    furtherOrder: Joi.string().allow(""),
    market: Joi.string().allow(""),
    networth: Joi.string().allow(""),
    pBankName: Joi.string().allow(""),
    pBankAccNumber: Joi.string().allow(""),
    pBankAccHolderName: Joi.string().allow(""),
    pBankState: Joi.string().allow(""),
    pBankAdd: Joi.string().allow(""),
    pBankBranch: Joi.string().allow(""),
    pIfscCode: Joi.string().allow(""),
    pMicrCode: Joi.string().allow(""),
    pBankGuaranteeLimit: Joi.string().allow(""),
    pOverdraftCashCreditLimit: Joi.string().allow(""),
    sBankName: Joi.string().allow(""),
    sBankAccNumber: Joi.string().allow(""),
    sBankAccHolderName: Joi.string().allow(""),
    sBankState: Joi.string().allow(""),
    sBankAdd: Joi.string().allow(""),
    sBankBranch: Joi.string().allow(""),
    sIfscCode: Joi.string().allow(""),
    sMicrCode: Joi.string().allow(""),
    sBankGuaranteeLimit: Joi.string().allow(""),
    sOverdraftCashCreditLimit: Joi.string().allow(""),
    msmeImage: Joi.string().allow(""),
    gstImage: Joi.string().allow(""),
    cancelledChequeImage: Joi.string().allow(""),
    panCardImage: Joi.string().allow(""),
    pfAttachment: Joi.string().allow(""),
    otherAttachment: Joi.string().allow(""),
  });
  return schema.validate(data);
};

const view = (data) => {
  const schema = Joi.object({
    id: Joi.string().required(),
  });
  return schema.validate(data);
};

export default {
  paginateWithSapCode,
  paginate,
  update,
  view,
};
