import knex from "../../config/mysql_db.js";
import validation from "../../validation/supplier/oldSupplier.js";

const updateOldSupplier = async (req, res) => {
  //store old data of supplier first to table: supplier_old_details
  try {
    const { error, value } = validation.update(req.body);

    if (error) {
      return res.status(400).json({
        error: true,
        message: error.details[0].message,
      });
    }

    const {
      supplierId,
      supplierName,
      emailId,
      mobile,
      telephone,
      designation,
      contactPersonName,
      cinNo,
      aadharNo,
      officeDetails,
      paymentMethod,
      website,
      phoneNo,
      pin,
      city,
      countryCode,
      address3,
      address2,
      address1,
      streetNo,
      source,
      state,
      departmentId,
      department,
      sapCode,
      comment,
      gstNo,
      panNo,
      companyFoundYear,
      msmeNo,
      msmeType,
      promoterName,
      companyType,
      nameOfBusiness,
      businessType,
      addressOfPlant,
      nameOfOtherGroupCompanies,
      listOfMajorCustomers,
      detailsOfMajorLastYear,
      currency,
      turnover,
      turnover2,
      turnover3,
      first,
      second,
      third,
      afterFirst,
      afterSec,
      afterThird,
      presentOrder,
      furtherOrder,
      market,
      networth,
      pBankName,
      pBankAccNumber,
      pBankAccHolderName,
      pBankState,
      pBankAdd,
      pBankBranch,
      pIfscCode,
      pMicrCode,
      pBankGuaranteeLimit,
      pOverdraftCashCreditLimit,
      sBankName,
      sBankAccNumber,
      sBankAccHolderName,
      sBankState,
      sBankAdd,
      sBankBranch,
      sIfscCode,
      sMicrCode,
      sBankGuaranteeLimit,
      sOverdraftCashCreditLimit,
      msmeImage,
      gstImage,
      cancelledChequeImage,
      panCardImage,
      pfAttachment,
      otherAttachment,
    } = value;

    const supplier_details = await knex("supplier_details")
      .where({ id: supplierId })
      .whereNotNull("sap_code")
      .first();

    if (supplier_details == undefined) {
      return res.status(400).json({
        error: true,
        message: "Supplier does not exist or do not have sap code",
      });
    }

    const business_details = await knex("business_details")
      .where("company_id", supplierId)
      .first();

    const financial_details = await knex("financial_details")
      .where("company_id", supplierId)
      .first();

    const tax_details = await knex("tax_details")
      .where("company_id", supplierId)
      .first();

    const data = {
      supplierId: supplierId,
      supplierName: supplier_details.supplier_name,
      emailId: supplier_details.emailID,
      password: supplier_details.password,
      mobile: supplier_details.mobile,
      telephone: supplier_details.telephone,
      designation: supplier_details.designation,
      contactPersonName: supplier_details.contactPersonName,
      cinNo: supplier_details.cinNo,
      aadharNo: supplier_details.aadharNo,
      officeDetails: supplier_details.officeDetails,
      paymentMethod: supplier_details.paymentMethod,
      website: supplier_details.website,
      phoneNo: supplier_details.phoneNo,
      pin: supplier_details.pin,
      city: supplier_details.city,
      countryCode: supplier_details.country,
      address3: supplier_details.address3,
      address2: supplier_details.address2,
      address1: supplier_details.address1,
      streetNo: supplier_details.streetNo,
      source: supplier_details.source,
      state: supplier_details.state,
      departmentId: supplier_details.department_id,
      department: supplier_details.department,
      sapCode: supplier_details.sap_code,
      comment: supplier_details.comment,
      gstNo: supplier_details.gstNo,
      panNo: supplier_details.panNo,
      companyFoundYear: business_details.companyFoundYear,
      msmeNo: business_details.msme_no,
      msmeType: business_details.msmeType,
      promoterName: business_details.promoterName,
      companyType: business_details.companyType,
      nameOfBusiness: business_details.nameOfBusiness,
      businessType: business_details.businessType,
      addressOfPlant: business_details.addressOfPlant,
      nameOfOtherGroupCompanies: business_details.nameOfOtherGroupCompanies,
      listOfMajorCustomers: business_details.listOfMajorCustomers,
      detailsOfMajorLastYear: business_details.detailsOfMajorLastYear,
      currency: financial_details.currency,
      turnover: financial_details.turnover,
      turnover2: financial_details.turnover2,
      turnover3: financial_details.turnover3,
      first: financial_details.first,
      second: financial_details.second,
      third: financial_details.third,
      afterFirst: financial_details.afterfirst,
      afterSec: financial_details.aftersecond,
      afterThird: financial_details.afterthird,
      presentOrder: financial_details.presentorder,
      furtherOrder: financial_details.furtherorder,
      market: financial_details.market,
      networth: financial_details.networth,
      pBankName: financial_details.p_bank_name,
      pBankAccNumber: financial_details.p_bank_account_number,
      pBankAccHolderName: financial_details.p_bank_account_holder_name,
      pBankState: financial_details.p_bank_state,
      pBankAdd: financial_details.p_bank_address,
      pBankBranch: financial_details.p_bank_branch,
      pIfscCode: financial_details.p_ifsc_code,
      pMicrCode: financial_details.p_micr_code,
      pBankGuaranteeLimit: financial_details.p_bank_guarantee_limit,
      pOverdraftCashCreditLimit:
        financial_details.p_overdraft_cash_credit_limit,
      sBankName: financial_details.s_bank_name,
      sBankAccNumber: financial_details.s_bank_account_number,
      sBankAccHolderName: financial_details.s_bank_account_holder_name,
      sBankState: financial_details.s_bank_state,
      sBankAdd: financial_details.s_bank_address,
      sBankBranch: financial_details.s_bank_branch,
      sIfscCode: financial_details.s_ifsc_code,
      sMicrCode: financial_details.s_micr_code,
      sBankGuaranteeLimit: financial_details.s_bank_guarantee_limit,
      sOverdraftCashCreditLimit:
        financial_details.s_overdraft_cash_credit_limit,
      msmeImage: tax_details.msmeImage,
      gstImage: tax_details.gstImage,
      cancelledChequeImage: tax_details.cancelledChequeImage,
      panCardImage: tax_details.panCardImage,
      pfAttachment: tax_details.pfAttachment,
      otherAttachment: tax_details.otherAttachments,
      regDate: tax_details.created_at,
    };

    const insertOldData = await knex("supplier_old_details").insert(data); //keep record's logs

    console.log("insertOldData:=", insertOldData);

    //now do update process for supplier_details, business_details, financial_details, tax_details

    // const updateSupplierDetailsData = {
    //   supplier_name: supplierName,
    //   emailID: emailId,
    //   mobile: mobile,
    //   telephone: telephone,
    //   designation: designation,
    //   contactPersonName: contactPersonName,
    //   cinNo: cinNo,
    //   aadharNo: aadharNo,
    //   officeDetails: officeDetails,
    //   paymentMethod: paymentMethod,
    //   website: website,
    //   phoneNo: phoneNo,
    //   pin: pin,
    //   city: city,
    //   country: countryCode,
    //   address3: address3,
    //   address2: address2,
    //   address1: address1,
    //   streetNo: streetNo,
    //   source: source,
    //   state: state,
    //   department_id: departmentId,
    //   department: department,
    //   sap_code: sapCode,
    //   comment: comment,
    //   gstNo: gstNo,
    //   panNo: panNo,
    // };

    const updateSupplierDetailsData = {};

    if (supplierName) {
      updateSupplierDetailsData.supplier_name = supplierName;
    }
    if (emailId) {
      updateSupplierDetailsData.emailID = emailId;
    }
    if (mobile) {
      updateSupplierDetailsData.mobile = mobile;
    }
    if (telephone) {
      updateSupplierDetailsData.telephone = telephone;
    }
    if (designation) {
      updateSupplierDetailsData.designation = designation;
    }
    if (contactPersonName) {
      updateSupplierDetailsData.contactPersonName = contactPersonName;
    }
    if (cinNo) {
      updateSupplierDetailsData.cinNo = cinNo;
    }
    if (aadharNo) {
      updateSupplierDetailsData.aadharNo = aadharNo;
    }
    if (officeDetails) {
      updateSupplierDetailsData.officeDetails = officeDetails;
    }
    if (paymentMethod) {
      updateSupplierDetailsData.paymentMethod = paymentMethod;
    }
    if (website) {
      updateSupplierDetailsData.website = website;
    }
    if (phoneNo) {
      updateSupplierDetailsData.phoneNo = phoneNo;
    }
    if (pin) {
      updateSupplierDetailsData.pin = pin;
    }
    if (city) {
      updateSupplierDetailsData.city = city;
    }
    if (countryCode) {
      updateSupplierDetailsData.country = countryCode;
    }
    if (address3) {
      updateSupplierDetailsData.address3 = address3;
    }
    if (address2) {
      updateSupplierDetailsData.address2 = address2;
    }
    if (address1) {
      updateSupplierDetailsData.address1 = address1;
    }
    if (streetNo) {
      updateSupplierDetailsData.streetNo = streetNo;
    }
    if (source) {
      updateSupplierDetailsData.source = source;
    }
    if (state) {
      updateSupplierDetailsData.state = state;
    }
    if (departmentId) {
      updateSupplierDetailsData.department_id = departmentId;
    }
    if (department) {
      updateSupplierDetailsData.department = department;
    }
    if (sapCode) {
      updateSupplierDetailsData.sap_code = sapCode;
    }
    if (comment) {
      updateSupplierDetailsData.comment = comment;
    }
    if (gstNo) {
      updateSupplierDetailsData.gstNo = gstNo;
    }
    if (panNo) {
      updateSupplierDetailsData.panNo = panNo;
    }

    const updateSupplierDetails = await knex("supplier_details")
      .where({ id: supplierId })
      .update(updateSupplierDetailsData);

    console.log("updateSupplierDetails:=", updateSupplierDetails);

    if (supplierId) {
      const modifiedByTable4 = await functions.SetModifiedBy(
        req.headers["authorization"],
        "supplier_details",
        "id",
        supplierId
      );
      console.log("isUpdated:-", modifiedByTable4);
    }
    // const updateBusinessDetailsData = {
    //   companyFoundYear: companyFoundYear,
    //   msme_no: msmeNo,
    //   msmeType: msmeType,
    //   promoterName: promoterName,
    //   companyType: companyType,
    //   nameOfBusiness: nameOfBusiness,
    //   businessType: businessType,
    //   addressOfPlant: addressOfPlant,
    //   nameOfOtherGroupCompanies: nameOfOtherGroupCompanies,
    //   listOfMajorCustomers: listOfMajorCustomers,
    //   detailsOfMajorLastYear: detailsOfMajorLastYear,
    // };

    const updateBusinessDetailsData = {};
    if (msmeNo) {
      updateBusinessDetailsData.msme_no = msmeNo;
    }
    if (msmeType) {
      updateBusinessDetailsData.msmeType = msmeType;
    }
    if (promoterName) {
      updateBusinessDetailsData.promoterName = promoterName;
    }
    if (companyType) {
      updateBusinessDetailsData.companyType = companyType;
    }
    if (nameOfBusiness) {
      updateBusinessDetailsData.nameOfBusiness = nameOfBusiness;
    }
    if (businessType) {
      updateBusinessDetailsData.businessType = businessType;
    }
    if (addressOfPlant) {
      updateBusinessDetailsData.addressOfPlant = addressOfPlant;
    }
    if (nameOfOtherGroupCompanies) {
      updateBusinessDetailsData.nameOfOtherGroupCompanies =
        nameOfOtherGroupCompanies;
    }
    if (listOfMajorCustomers) {
      updateBusinessDetailsData.listOfMajorCustomers = listOfMajorCustomers;
    }
    if (detailsOfMajorLastYear) {
      updateBusinessDetailsData.detailsOfMajorLastYear = detailsOfMajorLastYear;
    }

    const updateBusinessDetails = await knex("business_details")
      .where("company_id", supplierId)
      .update(updateBusinessDetailsData);

    console.log("updateBusinessDetails:=", updateBusinessDetails);

    if (supplierId) {
      const modifiedByTable3 = await functions.SetModifiedBy(
        req.headers["authorization"],
        "business_details",
        "company_id",
        supplierId
      );
      console.log("isUpdated:-", modifiedByTable3);
    }
    // const updateFinancialDetailsData = {
    //   currency: currency,
    //   turnover: turnover,
    //   turnover2: turnover2,
    //   turnover3: turnover3,
    //   first: first,
    //   second: second,
    //   third: third,
    //   afterfirst: afterFirst,
    //   aftersecond: afterSec,
    //   afterthird: afterThird,
    //   presentorder: presentOrder,
    //   furtherorder: furtherOrder,
    //   market: market,
    //   networth: networth,
    //   p_bank_name: pBankName,
    //   p_bank_account_number: pBankAccNumber,
    //   p_bank_account_holder_name: pBankAccHolderName,
    //   p_bank_state: pBankState,
    //   p_bank_address: pBankAdd,
    //   p_bank_branch: pBankBranch,
    //   p_ifsc_code: pIfscCode,
    //   p_micr_code: pMicrCode,
    //   p_bank_guarantee_limit: pBankGuaranteeLimit,
    //   p_overdraft_cash_credit_limit: pOverdraftCashCreditLimit,
    //   s_bank_name: sBankName,
    //   s_bank_account_number: sBankAccNumber,
    //   s_bank_account_holder_name: sBankAccHolderName,
    //   s_bank_state: sBankState,
    //   s_bank_address: sBankAdd,
    //   s_bank_branch: sBankBranch,
    //   s_ifsc_code: sIfscCode,
    //   s_micr_code: sMicrCode,
    //   s_bank_guarantee_limit: sBankGuaranteeLimit,
    //   s_overdraft_cash_credit_limit: sOverdraftCashCreditLimit,
    // };

    const updateFinancialDetailsData = {};

    if (currency) {
      updateFinancialDetailsData.currency = currency;
    }
    if (turnover) {
      updateFinancialDetailsData.turnover = turnover;
    }
    if (turnover2) {
      updateFinancialDetailsData.turnover2 = turnover2;
    }
    if (turnover3) {
      updateFinancialDetailsData.turnover3 = turnover3;
    }
    if (first) {
      updateFinancialDetailsData.first = first;
    }
    if (second) {
      updateFinancialDetailsData.second = second;
    }
    if (third) {
      updateFinancialDetailsData.third = third;
    }
    if (afterFirst) {
      updateFinancialDetailsData.afterfirst = afterFirst;
    }
    if (afterSec) {
      updateFinancialDetailsData.aftersecond = afterSec;
    }
    if (afterThird) {
      updateFinancialDetailsData.afterthird = afterThird;
    }
    if (presentOrder) {
      updateFinancialDetailsData.presentorder = presentOrder;
    }
    if (furtherOrder) {
      updateFinancialDetailsData.furtherorder = furtherOrder;
    }
    if (market) {
      updateFinancialDetailsData.market = market;
    }
    if (networth) {
      updateFinancialDetailsData.networth = networth;
    }
    if (pBankName) {
      updateFinancialDetailsData.p_bank_name = pBankName;
    }
    if (pBankAccNumber) {
      updateFinancialDetailsData.p_bank_account_number = pBankAccNumber;
    }
    if (pBankAccHolderName) {
      updateFinancialDetailsData.p_bank_account_holder_name =
        pBankAccHolderName;
    }
    if (pBankState) {
      updateFinancialDetailsData.p_bank_state = pBankState;
    }
    if (pBankAdd) {
      updateFinancialDetailsData.p_bank_address = pBankAdd;
    }
    if (pBankBranch) {
      updateFinancialDetailsData.p_bank_branch = pBankBranch;
    }
    if (pIfscCode) {
      updateFinancialDetailsData.p_ifsc_code = pIfscCode;
    }
    if (pMicrCode) {
      updateFinancialDetailsData.p_micr_code = pMicrCode;
    }
    if (pBankGuaranteeLimit) {
      updateFinancialDetailsData.p_bank_guarantee_limit = pBankGuaranteeLimit;
    }
    if (pOverdraftCashCreditLimit) {
      updateFinancialDetailsData.p_overdraft_cash_credit_limit =
        pOverdraftCashCreditLimit;
    }
    if (sBankName) {
      updateFinancialDetailsData.s_bank_name = sBankName;
    }
    if (sBankAccNumber) {
      updateFinancialDetailsData.s_bank_account_number = sBankAccNumber;
    }
    if (sBankAccHolderName) {
      updateFinancialDetailsData.s_bank_account_holder_name =
        sBankAccHolderName;
    }
    if (sBankState) {
      updateFinancialDetailsData.s_bank_state = sBankState;
    }
    if (sBankAdd) {
      updateFinancialDetailsData.s_bank_address = sBankAdd;
    }
    if (sBankBranch) {
      updateFinancialDetailsData.s_bank_branch = sBankBranch;
    }
    if (sIfscCode) {
      updateFinancialDetailsData.s_ifsc_code = sIfscCode;
    }
    if (sMicrCode) {
      updateFinancialDetailsData.s_micr_code = sMicrCode;
    }
    if (sBankGuaranteeLimit) {
      updateFinancialDetailsData.s_bank_guarantee_limit = sBankGuaranteeLimit;
    }
    if (sOverdraftCashCreditLimit) {
      updateFinancialDetailsData.s_overdraft_cash_credit_limit =
        sOverdraftCashCreditLimit;
    }

    const updateFinancialDetails = await knex("financial_details")
      .where("company_id", supplierId)
      .update(updateFinancialDetailsData);

    console.log("updateFinancialDetails:-", updateFinancialDetails);

    if (supplierId) {
      const modifiedByTable2 = await functions.SetModifiedBy(
        req.headers["authorization"],
        "financial_details",
        "company_id",
        supplierId
      );
      console.log("isUpdated:-", modifiedByTable2);
    }
    // const updateTaxDetailsData = {
    //   msmeImage: msmeImage,
    //   gstImage: gstImage,
    //   cancelledChequeImage: cancelledChequeImage,
    //   panCardImage: panCardImage,
    //   pfAttachment: pfAttachment,
    //   otherAttachments: otherAttachment,
    // };

    //update tax details from here
    // const updateTaxDetailsData = {};

    // if (msmeImage) {
    //   updateTaxDetailsData.msmeImage = msmeImage;
    // }
    // if (gstImage) {
    //   updateTaxDetailsData.gstImage = gstImage;
    // }
    // if (cancelledChequeImage) {
    //   updateTaxDetailsData.cancelledChequeImage = cancelledChequeImage;
    // }
    // if (panCardImage) {
    //   updateTaxDetailsData.panCardImage = panCardImage;
    // }
    // if (pfAttachment) {
    //   updateTaxDetailsData.pfAttachment = pfAttachment;
    // }
    // if (otherAttachment) {
    //   updateTaxDetailsData.otherAttachments = otherAttachment;
    // }

    // const updateTaxDetails = await knex("tax_details")
    //   .where("company_id", supplierId)
    //   .update(updateTaxDetailsData);

    // console.log("updateTaxDetails:-", updateTaxDetails);

    //updateByAdmin set in supplier_details

    const updateByAdmin = await knex("supplier_details")
      .where({ id: supplierId })
      .update({ updateByAdmin: "Y" });

    console.log("updateByAdmin:-", updateByAdmin);

    if (supplierId) {
      const modifiedByTable1 = await functions.SetModifiedBy(
        req.headers["authorization"],
        "supplier_details",
        "id",
        supplierId
      );
      console.log("isUpdated:-", modifiedByTable1);
    }
    return res.status(200).json({
      error: false,
      message: "Old Supplier Details updated successfully by Admin",
      // data1: supplier_details,
      // data2: business_details,
      // data3: financial_details,
      // data4: tax_details,
      data: data,
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: "Could not update record.",
      data: JSON.stringify(error),
    });
  }
};

const tosap = async (req, res) => {
  try {
    const getUpdatedSupplierDetails = await knex("supplier_details").where(
      "updateByAdmin",
      "Y"
    );

    if (getUpdatedSupplierDetails.length <= 0) {
      return res.status(404).json({
        error: true,
        message: "No updated Supplier Details found",
      });
    }

    const allSupplierDetails = [];
    let i = 1;
    for (const supplier of getUpdatedSupplierDetails) {
      const getBusinessDetails = await knex("business_details").where(
        "company_id",
        supplier.id
      );

      const getFinancialDetails = await knex("financial_details").where(
        "company_id",
        supplier.id
      );

      const getTaxDetails = await knex("tax_details").where(
        "company_id",
        supplier.id
      );

      /////////////////////////// change name of field to camel case//////////
      delete supplier.password;
      supplier.supplierName = supplier.supplier_name;
      delete supplier.supplier_name;
      supplier.emailId = supplier.emailID;
      delete supplier.emailID;
      supplier.departmentId = supplier.department_id;
      delete supplier.department_id;
      supplier.sapCode = supplier.sap_code;
      delete supplier.sap_code;
      supplier.sapStatus = supplier.sap_status;
      delete supplier.sap_status;
      supplier.sapCodeTime = supplier.sap_code_time;
      delete supplier.sap_code_time;
      supplier.tdsType = supplier.tds_type;
      delete supplier.tds_type;
      supplier.tdsCode = supplier.tds_code;
      delete supplier.tds_code;
      supplier.tdsSubject = supplier.tds_subject;
      delete supplier.tds_subject;
      supplier.tdsReceipent = supplier.tds_receipent;
      delete supplier.tds_receipent;
      supplier.statusUpdateDate = supplier.status_update_date;
      delete supplier.status_update_date;
      supplier.subscriberId = supplier.subscriber_id;
      delete supplier.subscriber_id;
      supplier.createdAt = supplier.created_at;
      delete supplier.created_at;
      supplier.updatedAt = supplier.updated_at;
      delete supplier.updated_at;

      delete getBusinessDetails[0].id;
      getBusinessDetails[0].supplierId = getBusinessDetails[0].company_id;
      delete getBusinessDetails[0].company_id;
      getBusinessDetails[0].msmeNo = getBusinessDetails[0].msme_no;
      delete getBusinessDetails[0].msme_no;
      getBusinessDetails[0].createdAt = getBusinessDetails[0].created_at;
      delete getBusinessDetails[0].created_at;
      getBusinessDetails[0].updatedAt = getBusinessDetails[0].updated_at;
      delete getBusinessDetails[0].updated_at;

      delete getFinancialDetails[0].id;
      getFinancialDetails[0].supplierId = getFinancialDetails[0].company_id;
      delete getFinancialDetails[0].company_id;
      getFinancialDetails[0].pBankName = getFinancialDetails[0].p_bank_name;
      delete getFinancialDetails[0].p_bank_name;
      getFinancialDetails[0].pBankAccNumber =
        getFinancialDetails[0].p_bank_account_number;
      delete getFinancialDetails[0].p_bank_account_number;
      getFinancialDetails[0].pBankAccHolderName =
        getFinancialDetails[0].p_bank_account_holder_name;
      delete getFinancialDetails[0].p_bank_account_holder_name;
      getFinancialDetails[0].pBankState = getFinancialDetails[0].p_bank_state;
      delete getFinancialDetails[0].p_bank_state;
      getFinancialDetails[0].pBankAdd = getFinancialDetails[0].p_bank_address;
      delete getFinancialDetails[0].p_bank_address;
      getFinancialDetails[0].pBankBranch = getFinancialDetails[0].p_bank_branch;
      delete getFinancialDetails[0].p_bank_branch;
      getFinancialDetails[0].pIfscCode = getFinancialDetails[0].p_ifsc_code;
      delete getFinancialDetails[0].p_ifsc_code;
      getFinancialDetails[0].pMicrCode = getFinancialDetails[0].p_micr_code;
      delete getFinancialDetails[0].p_micr_code;
      getFinancialDetails[0].pBankGuaranteeLimit =
        getFinancialDetails[0].p_bank_guarantee_limit;
      delete getFinancialDetails[0].p_bank_guarantee_limit;
      getFinancialDetails[0].pOverdraftCashCreditLimit =
        getFinancialDetails[0].p_overdraft_cash_credit_limit;
      delete getFinancialDetails[0].p_overdraft_cash_credit_limit;
      getFinancialDetails[0].sBankName = getFinancialDetails[0].s_bank_name;
      delete getFinancialDetails[0].s_bank_name;
      getFinancialDetails[0].sBankAccNumber =
        getFinancialDetails[0].s_bank_account_number;
      delete getFinancialDetails[0].s_bank_account_number;
      getFinancialDetails[0].sBankAccHolderName =
        getFinancialDetails[0].s_bank_account_holder_name;
      delete getFinancialDetails[0].s_bank_account_holder_name;
      getFinancialDetails[0].sBankState = getFinancialDetails[0].s_bank_state;
      delete getFinancialDetails[0].s_bank_state;
      getFinancialDetails[0].sBankAdd = getFinancialDetails[0].s_bank_address;
      delete getFinancialDetails[0].s_bank_address;
      getFinancialDetails[0].sBankBranch = getFinancialDetails[0].s_bank_branch;
      delete getFinancialDetails[0].s_bank_branch;
      getFinancialDetails[0].sIfscCode = getFinancialDetails[0].s_ifsc_code;
      delete getFinancialDetails[0].s_ifsc_code;
      getFinancialDetails[0].sMicrCode = getFinancialDetails[0].s_micr_code;
      delete getFinancialDetails[0].s_micr_code;
      getFinancialDetails[0].sBankGuaranteeLimit =
        getFinancialDetails[0].s_bank_guarantee_limit;
      delete getFinancialDetails[0].s_bank_guarantee_limit;
      getFinancialDetails[0].sOverdraftCashCreditLimit =
        getFinancialDetails[0].s_overdraft_cash_credit_limit;
      delete getFinancialDetails[0].s_overdraft_cash_credit_limit;
      getFinancialDetails[0].createdAt = getFinancialDetails[0].created_at;
      delete getFinancialDetails[0].created_at;
      getFinancialDetails[0].updatedAt = getFinancialDetails[0].updated_at;
      delete getFinancialDetails[0].updated_at;

      delete getTaxDetails[0].id;
      getTaxDetails[0].supplierId = getTaxDetails[0].company_id;
      delete getTaxDetails[0].company_id;
      getTaxDetails[0].createdAt = getTaxDetails[0].created_at;
      delete getTaxDetails[0].created_at;
      getTaxDetails[0].updatedAt = getTaxDetails[0].updated_at;
      delete getTaxDetails[0].updated_at;

      /////////////////////////// change name of field to camel case over/////
      allSupplierDetails.push({
        srNo: i++,
        supplierDetails: supplier,
        businessDetails: getBusinessDetails,
        financialDetails: getFinancialDetails,
        taxDetails: getTaxDetails,
      });
    }

    return res.status(200).json({
      error: false,
      message: "Supplier Details",
      data: allSupplierDetails,
      total: allSupplierDetails.length,
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: "Could not send record.",
      data: error.message,
    });
  }
};

const paginateOldRecords = async (req, res) => {
  try {
    const tableName = "supplier_old_details";
    const searchFrom = ["name"];
    const { error, value } = validation.paginate(req.body);
    if (error) {
      return res.status(400).json({
        error: true,
        message: error.details[0].message,
        data: error,
      });
    }

    let { offset, limit, order, sort, search, status } = value;
    let total = 0;
    let results = knex(tableName);

    results = results.where(function () {
      if (search != undefined && search != "") {
        searchFrom.forEach((element) => {
          this.orWhereILike(element, `%${search}%`);
        });
      }
    });

    if (status != "") {
      results = results.where({ status });
    }

    total = await results.count("id as total").first();

    let rows = knex(tableName);

    if (status != "") {
      rows = rows.where({ status });
    }

    rows = rows.where(function () {
      if (search != undefined && search != "") {
        searchFrom.forEach((element) => {
          this.orWhereILike(element, `%${search}%`);
        });
      }
    });
    rows = await rows.orderBy(sort, order).limit(limit).offset(offset);
    let data_rows = [];
    if (order === "desc") {
      let sr = offset + 1;
      await rows.forEach((row) => {
        row.sr = sr;
        //delete row.password;
        data_rows.push(row);
        sr++;
      });
    } else {
      let sr = total.total - limit * offset;
      await rows.forEach((row) => {
        row.sr = sr;
        //delete row.password;
        data_rows.push(row);
        sr--;
      });
    }
    return res.status(200).json({
      error: false,
      message: "Api data is retrieved successfully.",
      data: {
        rows: data_rows,
        total: total.total,
      },
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: "Could not load record.",
      data: JSON.stringify(error),
    });
  }
};

const paginateWithSapCode = async (req, res) => {
  try {
    const tableName = "supplier_details";
    const searchFrom = ["name"];

    const { error, value } = validation.paginateWithSapCode(req.body);
    if (error) {
      return res.status(400).json({
        error: true,
        message: error.details[0].message,
        data: error,
      });
    }

    let { offset, limit, order, sort, search, status } = value;
    let total = 0;
    let results = knex(tableName).whereNotNull("sap_code");

    results = results.where(function () {
      if (search != undefined && search != "") {
        searchFrom.forEach((element) => {
          this.orWhereILike(element, `%${search}%`);
        });
      }
    });

    if (status != "") {
      results = results.where({ status });
    }

    total = await results.count("id as total").first();

    let rows = knex(tableName).whereNotNull("sap_code");

    if (status != "") {
      rows = rows.where({ status });
    }

    rows = rows.where(function () {
      if (search != undefined && search != "") {
        searchFrom.forEach((element) => {
          this.orWhereILike(element, `%${search}%`);
        });
      }
    });
    rows = await rows.orderBy(sort, order).limit(limit).offset(offset);
    let data_rows = [];
    if (order === "desc") {
      let sr = offset + 1;
      await rows.forEach((row) => {
        row.sr = sr;
        //delete row.password;
        data_rows.push(row);
        sr++;
      });
    } else {
      let sr = total.total - limit * offset;
      await rows.forEach((row) => {
        row.sr = sr;
        //delete row.password;
        data_rows.push(row);
        sr--;
      });
    }
    return res.status(200).json({
      error: false,
      message: "Api data is retrieved successfully.",
      data: {
        rows: data_rows,
        total: total.total,
      },
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: "Could not load record.",
      data: JSON.stringify(error),
    });
  }
};
const viewSupplier = async (req, res) => {
  try {
    const { error, value } = validation.view(req.params);

    if (error) {
      return res.status(400).json({
        error: true,
        message: error.details[0].message,
      });
    }

    const { id } = value;
    const getSupplierDetails = await knex("supplier_details")
      .select()
      .where({ id })
      .first();
    if (getSupplierDetails == undefined) {
      return res.status(404).json({
        error: true,
        message: "Supplier not found",
      });
    }

    const getBusinessDetails = await knex("business_details")
      .select()
      .where({ company_id: id })
      .first();
    const getFinancialDetails = await knex("financial_details")
      .select()
      .where({ company_id: id })
      .first();
    const getTaxDetails = await knex("tax_details")
      .select()
      .where({ company_id: id })
      .first();

    const wholeRecord = {};

    wholeRecord.supplierId = getSupplierDetails.id;
    wholeRecord.supplierName = getSupplierDetails.supplier_name;
    wholeRecord.emailId = getSupplierDetails.emailID;
    wholeRecord.mobile = getSupplierDetails.mobile;
    wholeRecord.telephone = getSupplierDetails.telephone;
    wholeRecord.designation = getSupplierDetails.designation;
    wholeRecord.contactPersonName = getSupplierDetails.contactPersonName;
    wholeRecord.cinNo = getSupplierDetails.cinNo;
    wholeRecord.aadharNo = getSupplierDetails.aadharNo;

    wholeRecord.officeDetails = getSupplierDetails.officeDetails;
    wholeRecord.paymentMethod = getSupplierDetails.paymentMethod;
    wholeRecord.website = getSupplierDetails.website;
    wholeRecord.phoneNo = getSupplierDetails.phoneNo;
    wholeRecord.pin = getSupplierDetails.pin;
    wholeRecord.city = getSupplierDetails.city;
    wholeRecord.countryCode = getSupplierDetails.country;
    wholeRecord.address1 = getSupplierDetails.address1;
    wholeRecord.address2 = getSupplierDetails.address2;
    wholeRecord.address3 = getSupplierDetails.address3;
    wholeRecord.streetNo = getSupplierDetails.streetNo;
    wholeRecord.source = getSupplierDetails.source;
    wholeRecord.state = getSupplierDetails.state;
    wholeRecord.departmentId = getSupplierDetails.department_id;
    wholeRecord.department = getSupplierDetails.department;
    wholeRecord.sapCode = getSupplierDetails.sap_code;
    wholeRecord.comment = getSupplierDetails.comment;
    wholeRecord.gstNo = getSupplierDetails.gstNo;
    wholeRecord.panNo = getSupplierDetails.panNo;

    wholeRecord.companyFoundYear = getBusinessDetails.companyFoundYear;
    wholeRecord.msmeNo = getBusinessDetails.msme_no;
    wholeRecord.promoterName = getBusinessDetails.promoterName;
    wholeRecord.companyType = getBusinessDetails.companyType;
    wholeRecord.nameOfBusiness = getBusinessDetails.nameOfBusiness;
    wholeRecord.businessType = getBusinessDetails.businessType;
    wholeRecord.msmeType = getBusinessDetails.msmeType;
    wholeRecord.addressOfPlant = getBusinessDetails.addressOfPlant;
    wholeRecord.nameOfOtherGroupCompanies =
      getBusinessDetails.nameOfOtherGroupCompanies;
    wholeRecord.listOfMajorCustomers = getBusinessDetails.listOfMajorCustomers;
    wholeRecord.detailsOfMajorLastYear =
      getBusinessDetails.detailsOfMajorLastYear;

    wholeRecord.currency = getFinancialDetails.currency;
    wholeRecord.turnover = getFinancialDetails.turnover;
    wholeRecord.turnover2 = getFinancialDetails.turnover2;
    wholeRecord.turnover3 = getFinancialDetails.turnover3;
    wholeRecord.first = getFinancialDetails.first;
    wholeRecord.second = getFinancialDetails.second;
    wholeRecord.third = getFinancialDetails.third;
    wholeRecord.afterFirst = getFinancialDetails.afterfirst;
    wholeRecord.afterSec = getFinancialDetails.aftersecond;
    wholeRecord.afterThird = getFinancialDetails.afterthird;
    wholeRecord.presentOrder = getFinancialDetails.presentorder;
    wholeRecord.furtherOrder = getFinancialDetails.furtherorder;
    wholeRecord.market = getFinancialDetails.market;
    wholeRecord.networth = getFinancialDetails.networth;
    wholeRecord.pBankName = getFinancialDetails.p_bank_name;
    wholeRecord.pBankAccNumber = getFinancialDetails.p_bank_account_number;
    wholeRecord.pBankAccHolderName =
      getFinancialDetails.p_bank_account_holder_name;
    wholeRecord.pBankState = getFinancialDetails.p_bank_state;
    wholeRecord.pBankAdd = getFinancialDetails.p_bank_address;
    wholeRecord.pBankBranch = getFinancialDetails.p_bank_branch;
    wholeRecord.pIfscCode = getFinancialDetails.p_ifsc_code;
    wholeRecord.pMicrCode = getFinancialDetails.p_micr_code;
    wholeRecord.pBankGuaranteeLimit =
      getFinancialDetails.p_bank_guarantee_limit;
    wholeRecord.pOverdraftCashCreditLimit =
      getFinancialDetails.p_overdraft_cash_credit_limit;
    wholeRecord.sBankName = getFinancialDetails.s_bank_name;
    wholeRecord.sBankAccNumber = getFinancialDetails.s_bank_account_number;
    wholeRecord.sBankAccHolderName =
      getFinancialDetails.s_bank_account_holder_name;
    wholeRecord.sBankState = getFinancialDetails.s_bank_state;
    wholeRecord.sBankAdd = getFinancialDetails.s_bank_address;
    wholeRecord.sBankBranch = getFinancialDetails.s_bank_branch;
    wholeRecord.sIfscCode = getFinancialDetails.s_ifsc_code;
    wholeRecord.sMicrCode = getFinancialDetails.s_micr_code;
    wholeRecord.sBankGuaranteeLimit =
      getFinancialDetails.s_bank_guarantee_limit;
    wholeRecord.sOverdraftCashCreditLimit =
      getFinancialDetails.s_overdraft_cash_credit_limit;

    wholeRecord.msmeImage = getTaxDetails.msmeImage;
    wholeRecord.gstImage = getTaxDetails.gstImage;
    wholeRecord.cancelledChequeImage = getTaxDetails.cancelledChequeImage;
    wholeRecord.panCardImage = getTaxDetails.panCardImage;
    wholeRecord.pfAttachment = getTaxDetails.pfAttachment;
    wholeRecord.otherAttachment = getTaxDetails.otherAttachments;

    return res.status(200).json({
      error: false,
      message: "Supplier found successfully",
      //data1: getSupplierDetails,
      data: wholeRecord,
      //data3: Object.keys(wholeRecord).length,
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: "Could not fetch record.",
      data: JSON.stringify(error),
    });
  }
};

export default {
  updateOldSupplier,
  tosap,
  paginateOldRecords,
  paginateWithSapCode,
  viewSupplier,
};
