import Joi from "joi";

const sendOtp = (data) => {
  const schema = Joi.object({
    username: Joi.string().required().trim(),
    gstno: Joi.string().required().trim(),
  });
  return schema.validate(data);
};

const verifyOtp = (data) => {
  const schema = Joi.object({
    username: Joi.string().required().trim(),
    otp: Joi.string().required().trim(),
    gstno: Joi.string().required().trim(),
  });
  return schema.validate(data);
};

const generateIRN = (data) => {
  const schema = Joi.object({
    Version: Joi.string(),
    TranDtls: Joi.object({
      TaxSch: Joi.string().required(),
      SupTyp: Joi.string()
        .required()
        .valid("B2B", "SEZWP", "SEZWOP", "EXPWP", "EXPWOP", "DEXP"),
      RegRev: Joi.string().valid("Y", "N").allow(null),
      EcmGstin: Joi.string().allow(null),
      IgstOnIntra: Joi.string().valid("Y", "N").allow(null),
    }).required(),
    DocDtls: Joi.object({
      Typ: Joi.string().required(),
      No: Joi.string().required(),
      Dt: Joi.string().required(),
    }).required(),
    SellerDtls: Joi.object({
      Gstin: Joi.string().required(),
      LglNm: Joi.string().required(),
      TrdNm: Joi.string().required(),
      Addr1: Joi.string().required(),
      Addr2: Joi.string().allow(null),
      Loc: Joi.string().required(),
      Pin: Joi.number().required().positive(),
      Stcd: Joi.string().required(),
      Ph: Joi.string().allow(null),
      Em: Joi.string().email(),
    }).required(),
    BuyerDtls: Joi.object({
      Gstin: Joi.string().required(),
      LglNm: Joi.string().required(),
      TrdNm: Joi.string().allow(null),
      Pos: Joi.string().required(),
      Addr1: Joi.string().required(),
      Addr2: Joi.string().allow(null),
      Loc: Joi.string().required(),
      Pin: Joi.number().required(),
      Stcd: Joi.string().required(),
      Ph: Joi.string().allow(null),
      Em: Joi.string().email(),
    }).required(),
    // DispDtls: Joi.object({
    //   Nm: Joi.string().required(),
    //   Addr1: Joi.string().required(),
    //   Addr2: Joi.string().required(),
    //   Loc: Joi.string().required(),
    //   Pin: Joi.number().required(),
    //   Stcd: Joi.string().required(),
    // }).required(),
    // ShipDtls: Joi.object({
    //   Gstin: Joi.string().required(),
    //   LglNm: Joi.string().required(),
    //   TrdNm: Joi.string().required(),
    //   Addr1: Joi.string().required(),
    //   Addr2: Joi.string().required(),
    //   Loc: Joi.string().required(),
    //   Pin: Joi.number().required(),
    //   Stcd: Joi.string().required(),
    // }).required(),
    ItemList: Joi.array()
      .items(
        Joi.object({
          SlNo: Joi.string().required(),
          PrdDesc: Joi.string().allow(null),
          IsServc: Joi.string().required().valid("Y", "N"),
          HsnCd: Joi.string().required(),
          Barcde: Joi.string().allow(null),
          Qty: Joi.number().required(),
          FreeQty: Joi.number().allow(null),
          Unit: Joi.string().allow(null),
          UnitPrice: Joi.number().required(),
          TotAmt: Joi.number().required(),
          Discount: Joi.number().allow(null),
          PreTaxVal: Joi.number().allow(null),
          AssAmt: Joi.number().required(),
          GstRt: Joi.number().required(),
          IgstAmt: Joi.number().allow(null),
          CgstAmt: Joi.number().allow(null),
          SgstAmt: Joi.number().allow(null),
          CesRt: Joi.number().allow(null),
          CesAmt: Joi.number().allow(null),
          CesNonAdvlAmt: Joi.number().allow(null),
          StateCesRt: Joi.number().allow(null),
          StateCesAmt: Joi.number().allow(null),
          StateCesNonAdvlAmt: Joi.number().allow(null),
          OthChrg: Joi.number().allow(null),
          TotItemVal: Joi.number().required(),
          OrdLineRef: Joi.string().allow(null),
          OrgCntry: Joi.string().allow(null),
          PrdSlNo: Joi.string().allow(null),
          BchDtls: Joi.object({
            Nm: Joi.string().required(),
            ExpDt: Joi.string().allow(null),
            WrDt: Joi.string().allow(null),
          }).required(),
          AttribDtls: Joi.array()
            .items(
              Joi.object({
                Nm: Joi.string().allow(null),
                Val: Joi.string().allow(null),
              })
            )
            .required(),
        })
      )
      .required(),
    ValDtls: Joi.object({
      AssVal: Joi.number().required(),
      CgstVal: Joi.number().allow(null),
      SgstVal: Joi.number().allow(null),
      IgstVal: Joi.number().allow(null),
      CesVal: Joi.number().allow(null),
      StCesVal: Joi.number().allow(null),
      Discount: Joi.number().allow(null),
      OthChrg: Joi.number().allow(null),
      RndOffAmt: Joi.number().allow(null),
      TotInvVal: Joi.number().required(),
      TotInvValFc: Joi.number().allow(null),
    }).required(),
    PayDtls: Joi.object({
      Nm: Joi.string().required(),
      AccDet: Joi.string().required(),
      Mode: Joi.string().required(),
      FinInsBr: Joi.string().required(),
      PayTerm: Joi.string().required(),
      PayInstr: Joi.string().required(),
      CrTrn: Joi.string().required(),
      DirDr: Joi.string().required(),
      CrDay: Joi.number().required(),
      PaidAmt: Joi.number().required(),
      PaymtDue: Joi.number().required(),
    }).required(),
    RefDtls: Joi.object({
      InvRm: Joi.string().required(),
      DocPerdDtls: Joi.object({
        InvStDt: Joi.string().required(),
        InvEndDt: Joi.string().required(),
      }).required(),
      PrecDocDtls: Joi.array()
        .items(
          Joi.object({
            InvNo: Joi.string().required(),
            InvDt: Joi.string().required(),
            OthRefNo: Joi.string().required(),
          })
        )
        .required(),
      ContrDtls: Joi.array()
        .items(
          Joi.object({
            RecAdvRefr: Joi.string().required(),
            RecAdvDt: Joi.string().required(),
            TendRefr: Joi.string().required(),
            ContrRefr: Joi.string().required(),
            ExtRefr: Joi.string().required(),
            ProjRefr: Joi.string().required(),
            PORefr: Joi.string().required(),
            PORefDt: Joi.string().required(),
          })
        )
        .required(),
    }).required(),
    AddlDocDtls: Joi.array()
      .items(
        Joi.object({
          Url: Joi.string().required(),
          Docs: Joi.string().required(),
          Info: Joi.string().required(),
        })
      )
      .required(),
    ExpDtls: Joi.object({
      ShipBNo: Joi.string().required(),
      ShipBDt: Joi.string().required(),
      Port: Joi.string().required(),
      RefClm: Joi.string().required(),
      ForCur: Joi.string().required(),
      CntCode: Joi.string().required(),
      ExpDuty: Joi.string().allow(null),
    }).required(),
    EwbDtls: Joi.object({
      TransId: Joi.string().required(),
      TransName: Joi.string().required(),
      Distance: Joi.number().required(),
      TransDocNo: Joi.string().required(),
      TransDocDt: Joi.string().required(),
      VehNo: Joi.string().required(),
      VehType: Joi.string().required(),
      TransMode: Joi.string().required(),
    }).required(),
  });
  return schema.validate(data);
};

const ewayBill = (data) => {
  const itemSchema = Joi.object({
    productName: Joi.string().required(),
    productDesc: Joi.string().required(),
    hsnCode: Joi.number().required(),
    quantity: Joi.number().required(),
    qtyUnit: Joi.string().required(),
    cgstRate: Joi.number().required(),
    sgstRate: Joi.number().required(),
    igstRate: Joi.number().required(),
    cessRate: Joi.number().required(),
    cessNonadvol: Joi.number().required(),
    taxableAmount: Joi.number().required(),
  });
  const schema = Joi.object({
    supplyType: Joi.string().required(),
    subSupplyType: Joi.string().required(),
    subSupplyDesc: Joi.string().allow(""),
    docType: Joi.string().required(),
    docNo: Joi.string().required(),
    docDate: Joi.string().required(),
    fromGstin: Joi.string().required(),
    fromTrdName: Joi.string().required(),
    fromAddr1: Joi.string().required(),
    fromAddr2: Joi.string().required(),
    fromPlace: Joi.string().required(),
    fromPincode: Joi.number().required(),
    actFromStateCode: Joi.number().required(),
    fromStateCode: Joi.number().required(),
    toGstin: Joi.string().required(),
    toTrdName: Joi.string().required(),
    toAddr1: Joi.string().required(),
    toAddr2: Joi.string().required(),
    toPlace: Joi.string().required(),
    toPincode: Joi.number().required(),
    actToStateCode: Joi.number().required(),
    toStateCode: Joi.number().required(),
    transactionType: Joi.number().required(),
    otherValue: Joi.string().required(),
    totalValue: Joi.number().required(),
    cgstValue: Joi.number().required(),
    sgstValue: Joi.number().required(),
    igstValue: Joi.number().required(),
    cessValue: Joi.number().required(),
    cessNonAdvolValue: Joi.number().required(),
    totInvValue: Joi.number().required(),
    transporterId: Joi.string().allow(""),
    transporterName: Joi.string().allow(""),
    transDocNo: Joi.string().allow(""),
    transMode: Joi.string().required(),
    transDistance: Joi.string().required(),
    transDocDate: Joi.string().allow(""),
    vehicleNo: Joi.string().required(),
    vehicleType: Joi.string().required(),
    itemList: Joi.array().items(itemSchema).required(),
  });
  return schema.validate(data);
};

const expShipDtlsSchema = Joi.object({
  Addr1: Joi.string().required(),
  Addr2: Joi.string().allow(""),
  Loc: Joi.string().required(),
  Pin: Joi.number().required(),
  Stcd: Joi.string().required(),
});

const dispDtlsSchema = Joi.object({
  Nm: Joi.string().required(),
  Addr1: Joi.string().required(),
  Addr2: Joi.string().allow(""),
  Loc: Joi.string().required(),
  Pin: Joi.number().required(),
  Stcd: Joi.string().required(),
});

const makeEwayBill = (data) => {
  const schema = Joi.object({
    Irn: Joi.string().required(),
    Distance: Joi.number().required(),
    TransMode: Joi.string().required(),
    TransId: Joi.string().required(),
    TransName: Joi.string().required(),
    TransDocDt: Joi.string().required(),
    TransDocNo: Joi.string().required(),
    VehNo: Joi.string().required(),
    VehType: Joi.string().required(),
    ExpShipDtls: expShipDtlsSchema.required(),
    DispDtls: dispDtlsSchema.required(),
  });
  return schema.validate(data);
};

const refreshToken = (data) => {
  const schema = Joi.object({
    gstno: Joi.string().required(),
  });
  return schema.validate(data);
};

const panValidate = (data) => {
  const schema = Joi.object({
    pan: Joi.string().required(),
  });
  return schema.validate(data);
};

const verifyBankAc = (data) => {
    const schema = Joi.object({
        bankAcNo: Joi.string().required(),
        ifsc: Joi.string().required(),
      });
  return schema.validate(data);
};

const verifyGst = (data) => {
    const schema = Joi.object({
        gstno: Joi.string().required(),
      });
  return schema.validate(data);
};

const verifyMsme = (data) => {
    const schema = Joi.object({
        msmeNo: Joi.string().required(),
      });
  return schema.validate(data);
};

const verifyBankAcc = (data) => {
    const schema = Joi.object({
        acc: Joi.string().required(),
        ifsc: Joi.string().required(),
      });
  
  return schema.validate(data);
};

export default {
  sendOtp,
  verifyOtp,
  generateIRN,
  ewayBill,
  makeEwayBill,
  refreshToken,
  panValidate,
  verifyBankAc,
  verifyGst,
  verifyMsme,
  verifyBankAcc,
};
