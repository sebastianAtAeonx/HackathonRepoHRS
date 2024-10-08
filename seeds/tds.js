/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function seed(knex) {
  // Deletes ALL existing entries
  await knex.raw("SET FOREIGN_KEY_CHECKS = 0");
  await knex("tds").del();
  await knex("tds").insert([
    {
      id: 18,
      type: "4P",
      code: "4P",
      description: "194Q:TDS on purchase of Goods Inv No PAN",
      status: "1",
      modifiedBy: null,
    },
    {
      id: 19,
      type: "4Q",
      code: "4Q",
      description: "194Q :TDS on purchase of Goods Inv",
      status: "1",
      modifiedBy: null,
    },
    {
      id: 20,
      type: "4R",
      code: "4R",
      description: "Section 194R :TDS on Benefits",
      status: "1",
      modifiedBy: null,
    },
    {
      id: 21,
      type: "51",
      code: "51",
      description: "TDS u/s 195 on Royalty - Inv",
      status: "1",
      modifiedBy: null,
    },
    {
      id: 22,
      type: "5A",
      code: "5A",
      description: "TDS u/s 195 on Royalty - Pay",
      status: "1",
      modifiedBy: null,
    },
    {
      id: 23,
      type: "5P",
      code: "5P",
      description: "194Q:TDS on purchase of Goods Pay No PAN",
      status: "1",
      modifiedBy: null,
    },
    {
      id: 24,
      type: "5Q",
      code: "5Q",
      description: "194Q:TDS on purchase of Goods Pay",
      status: "1",
      modifiedBy: null,
    },
    {
      id: 25,
      type: "A1",
      code: "A!",
      description: "194A-TDS on Interest-Invoice",
      status: "1",
      modifiedBy: null,
    },
    {
      id: 26,
      type: "A1",
      code: "PA",
      description: "194A-TDS on Interest-Invoice-No PAN 20%",
      status: "1",
      modifiedBy: null,
    },
    {
      id: 27,
      type: "AC",
      code: "AC",
      description: "194A-TDS on Interest-Payment",
      status: "1",
      modifiedBy: null,
    },
    {
      id: 28,
      type: "C1",
      code: "C1",
      description: "194C-TDS on Contractor (Firm/Co)-Invoice",
      status: "1",
      modifiedBy: null,
    },
    {
      id: 29,
      type: "C1",
      code: "P1",
      description: "194C-TDS on Contr (Firm/Co)-Inv-No PAN",
      status: "1",
      modifiedBy: null,
    },
    {
      id: 30,
      type: "C2",
      code: "C2",
      description: "194C-TDS on Contractor (Ind/HUF)-Invoice",
      status: "1",
      modifiedBy: null,
    },
    {
      id: 31,
      type: "C2",
      code: "P1",
      description: "194C-TDS on Contr (Ind/HUF)-Inv-No PAN",
      status: "1",
      modifiedBy: null,
    },
    {
      id: 32,
      type: "C3",
      code: "C3",
      description: "194C-TDS on Contractor (Firm/Co)-Invoice",
      status: "1",
      modifiedBy: null,
    },
    {
      id: 33,
      type: "C4",
      code: "C4",
      description: "194C-TDS on Contractor (Ind/HUF)-Invoice",
      status: "1",
      modifiedBy: null,
    },
    {
      id: 34,
      type: "C5",
      code: "C5",
      description: "194C-TDS on Contractor (Ind/HUF)-Invoice",
      status: "1",
      modifiedBy: null,
    },
    {
      id: 35,
      type: "CA",
      code: "CA",
      description: "194C-TDS on Contractor (Firm/Co)-Pymt",
      status: "1",
      modifiedBy: null,
    },
    {
      id: 36,
      type: "CA",
      code: "PA",
      description: "194C-TDS on Contr (Ind/HUF)-Pymt-No PAN",
      status: "1",
      modifiedBy: null,
    },
    {
      id: 37,
      type: "CB",
      code: "CB",
      description: "194C-TDS on Contractor (Ind/HUF)-Pymt",
      status: "1",
      modifiedBy: null,
    },
    {
      id: 38,
      type: "CB",
      code: "PA",
      description: "Payment u/s 194C - Inv - No PAN 20%",
      status: "1",
      modifiedBy: null,
    },
    {
      id: 39,
      type: "CC",
      code: "CC",
      description: "194C-TDS on Contractor (Firm/Co)-Pymt",
      status: "1",
      modifiedBy: null,
    },
    {
      id: 40,
      type: "CD",
      code: "CD",
      description: "194C-TDS on Contractor (Ind/HUF)-Pymt",
      status: "1",
      modifiedBy: null,
    },
    {
      id: 41,
      type: "CE",
      code: "CE",
      description: "194C-TDS on Contractor (Ind/HUF)-Pymt",
      status: "1",
      modifiedBy: null,
    },
    {
      id: 42,
      type: "CG",
      code: "CG",
      description: "Central GST Tax code",
      status: "1",
      modifiedBy: null,
    },
    {
      id: 43,
      type: "D3",
      code: "D3",
      description: "Sec 195 Customer interest",
      status: "1",
      modifiedBy: null,
    },
    {
      id: 44,
      type: "F1",
      code: "F1",
      description: "TDS on Service Fee- Inv",
      status: "1",
      modifiedBy: null,
    },
    {
      id: 45,
      type: "F2",
      code: "F2",
      description: "TDS on Freight W/O Surchrge-Grossup-Inv",
      status: "1",
      modifiedBy: null,
    },
    {
      id: 46,
      type: "F3",
      code: "F3",
      description: "TDS on Frt W/O Surchge-NET-195(Inv)",
      status: "1",
      modifiedBy: null,
    },
    {
      id: 47,
      type: "F4",
      code: "F4",
      description: "TDS-Technical W/O Surch-Grossup-195(Inv)",
      status: "1",
      modifiedBy: null,
    },
    {
      id: 48,
      type: "F5",
      code: "F5",
      description: "TDS-Technical W/O Surchge-NET-195(Inv)",
      status: "1",
      modifiedBy: null,
    },
    {
      id: 49,
      type: "F6",
      code: "F6",
      description: "TDS-Professional-Non Resident-195 (Inv)",
      status: "1",
      modifiedBy: null,
    },
    {
      id: 50,
      type: "FA",
      code: "FA",
      description: "TDS on Service Fee- Pay",
      status: "1",
      modifiedBy: null,
    },
    {
      id: 51,
      type: "FB",
      code: "FB",
      description: "TDS on Freight W/O Surchrge-Grossup-Pay",
      status: "1",
      modifiedBy: null,
    },
    {
      id: 52,
      type: "FC",
      code: "FC",
      description: "TDS on Frt W/O Surchge-NET-195(Pay)",
      status: "1",
      modifiedBy: null,
    },
    {
      id: 53,
      type: "FD",
      code: "FD",
      description: "TDS-Technical W/O Surch-Grossup-195(Pay)",
      status: "1",
      modifiedBy: null,
    },
    {
      id: 54,
      type: "FE",
      code: "FE",
      description: "TDS-Technical W/O Surchge-NET-195(Pay)",
      status: "1",
      modifiedBy: null,
    },
    {
      id: 55,
      type: "FF",
      code: "FF",
      description: "TDS-Professional-Non Resident-195 (Pay)",
      status: "1",
      modifiedBy: null,
    },
    {
      id: 56,
      type: "GC",
      code: "GC",
      description: "Central GST Payment Tax code",
      status: "1",
      modifiedBy: null,
    },
    {
      id: 57,
      type: "GI",
      code: "GI",
      description: "Integrated  GST Payment Tax code",
      status: "1",
      modifiedBy: null,
    },
    {
      id: 58,
      type: "GS",
      code: "GS",
      description: "State GST Payment Tax code",
      status: "1",
      modifiedBy: null,
    },
    {
      id: 59,
      type: "H1",
      code: "H1",
      description: "194H-TDS on Commission/Brokerage-Invoice",
      status: "1",
      modifiedBy: null,
    },
    {
      id: 60,
      type: "H1",
      code: "P1",
      description: "194H-TDS on Comm/Brokerage-Inv-No PAN",
      status: "1",
      modifiedBy: null,
    },
    {
      id: 61,
      type: "H2",
      code: "H2",
      description: "194H-TDS on Commission/Brokerage-Invoice",
      status: "1",
      modifiedBy: null,
    },
    {
      id: 62,
      type: "H3",
      code: "H3",
      description: "194H-TDS on Commission/Brokerage-Invoice",
      status: "1",
      modifiedBy: null,
    },
    {
      id: 63,
      type: "HA",
      code: "HA",
      description: "194H-TDS on Commission/Brokerage-Pymt",
      status: "1",
      modifiedBy: null,
    },
    {
      id: 64,
      type: "HA",
      code: "PA",
      description: "194H-TDS on Comm/Brokerage-Pymt-No PAN",
      status: "1",
      modifiedBy: null,
    },
    {
      id: 65,
      type: "HB",
      code: "HB",
      description: "194H-TDS on Commission/Brokerage-Pymt",
      status: "1",
      modifiedBy: null,
    },
    {
      id: 66,
      type: "HC",
      code: "HC",
      description: "194H-TDS on Commission/Brokerage-Pymt",
      status: "1",
      modifiedBy: null,
    },
    {
      id: 67,
      type: "I1",
      code: "I1",
      description: "194I-TDS on Rent Other than P&M -Invoice",
      status: "1",
      modifiedBy: null,
    },
    {
      id: 68,
      type: "I1",
      code: "I2",
      description: "194I-TDS on Rent On P&M -Invoice",
      status: "1",
      modifiedBy: null,
    },
    {
      id: 69,
      type: "I1",
      code: "P1",
      description: "194I-TDS on Rent Othr thn P&M Inv-No PAN",
      status: "1",
      modifiedBy: null,
    },
    {
      id: 70,
      type: "I1",
      code: "P2",
      description: "194I-TDS on Rent On P&M Inv-No PAN",
      status: "1",
      modifiedBy: null,
    },
    {
      id: 71,
      type: "I2",
      code: "I2",
      description: "194I-TDS on Rent On P&M -Invoice",
      status: "1",
      modifiedBy: null,
    },
    {
      id: 72,
      type: "I2",
      code: "P2",
      description: "194I-TDS on Rent On P&M -Invoice",
      status: "1",
      modifiedBy: null,
    },
    {
      id: 73,
      type: "I3",
      code: "I3",
      description: "194I-TDS on Rent Other than P&M -Invoice",
      status: "1",
      modifiedBy: null,
    },
    {
      id: 74,
      type: "I3",
      code: "I4",
      description: "194I-TDS on Rent On P&M -Invoice",
      status: "1",
      modifiedBy: null,
    },
    {
      id: 75,
      type: "I4",
      code: "I4",
      description: "194I-TDS on Rent On P&M -Invoice",
      status: "1",
      modifiedBy: null,
    },
    {
      id: 76,
      type: "I5",
      code: "I5",
      description: "194I-TDS on Rent Other than P&M -Invoice",
      status: "1",
      modifiedBy: null,
    },
    {
      id: 77,
      type: "I6",
      code: "I6",
      description: "194I-TDS on Rent On P&M -Invoice",
      status: "1",
      modifiedBy: null,
    },
    {
      id: 78,
      type: "IA",
      code: "IA",
      description: "194I-TDS on Rent Other than P&M -Pymt",
      status: "1",
      modifiedBy: null,
    },
    {
      id: 79,
      type: "IA",
      code: "IB",
      description: "194I-TDS on Rent On P&M -Pymt",
      status: "1",
      modifiedBy: null,
    },
    {
      id: 80,
      type: "IA",
      code: "PA",
      description: "194I-TDS on Rent Othr thn P&M-Pymt-NoPAN",
      status: "1",
      modifiedBy: null,
    },
    {
      id: 81,
      type: "IA",
      code: "PB",
      description: "194I-TDS on Rent On P&M-Pymt-NoPAN",
      status: "1",
      modifiedBy: null,
    },
    {
      id: 82,
      type: "IB",
      code: "IB",
      description: "194I-TDS on Rent On P&M -Pymt",
      status: "1",
      modifiedBy: null,
    },
    {
      id: 83,
      type: "IB",
      code: "PB",
      description: "194I-TDS on Rent On P&M -Pymt",
      status: "1",
      modifiedBy: null,
    },
    {
      id: 84,
      type: "IC",
      code: "IC",
      description: "194I-TDS on Rent Other than P&M -Pymt",
      status: "1",
      modifiedBy: null,
    },
    {
      id: 85,
      type: "IC",
      code: "ID",
      description: "194I-TDS on Rent On P&M -Pymt",
      status: "1",
      modifiedBy: null,
    },
    {
      id: 86,
      type: "ID",
      code: "ID",
      description: "194I-TDS on Rent On P&M -Pymt",
      status: "1",
      modifiedBy: null,
    },
    {
      id: 87,
      type: "IE",
      code: "IE",
      description: "194I-TDS on Rent Other than P&M -Pymt",
      status: "1",
      modifiedBy: null,
    },
    {
      id: 88,
      type: "IF",
      code: "IF",
      description: "194I-TDS on Rent On P&M -Pymt",
      status: "1",
      modifiedBy: null,
    },
    {
      id: 89,
      type: "IG",
      code: "IG",
      description: "Integrated GST tax code",
      status: "1",
      modifiedBy: null,
    },
    {
      id: 90,
      type: "J1",
      code: "J1",
      description: "194J-TDS on Prof./Tech. Fees-Invoice",
      status: "1",
      modifiedBy: null,
    },
    {
      id: 91,
      type: "J1",
      code: "P1",
      description: "194J-TDS on Prof./Tech. Fees-Inv-No PAN",
      status: "1",
      modifiedBy: null,
    },
    {
      id: 92,
      type: "J2",
      code: "J2",
      description: "TDS u/s 194J on Royalty (Local) - Inv",
      status: "1",
      modifiedBy: null,
    },
    {
      id: 93,
      type: "J2",
      code: "P1",
      description: "194J-TDS on Prof./Tech. Fees-Pymt-No PAN",
      status: "1",
      modifiedBy: null,
    },
    {
      id: 94,
      type: "J3",
      code: "J3",
      description: "194J-TDS on Prof./Tech. Fees-Invoice",
      status: "1",
      modifiedBy: null,
    },
    {
      id: 95,
      type: "J4",
      code: "J4",
      description: "TDS u/s 194J on Royalty (Local) - Inv",
      status: "1",
      modifiedBy: null,
    },
    {
      id: 96,
      type: "J5",
      code: "J5",
      description: "194J-TDS on Fees for Tech Service - Inv",
      status: "1",
      modifiedBy: null,
    },
    {
      id: 97,
      type: "J6",
      code: "J6",
      description: "194J-TDS on Fees for Tech Service - Inv",
      status: "1",
      modifiedBy: null,
    },
    {
      id: 98,
      type: "J7",
      code: "J7",
      description: "194J-TDS on Prof./Tech. Fees-Invoice",
      status: "1",
      modifiedBy: null,
    },
    {
      id: 99,
      type: "J8",
      code: "J8",
      description: "TDS u/s 194J on Royalty (Local) - Inv",
      status: "1",
      modifiedBy: null,
    },
    {
      id: 100,
      type: "J9",
      code: "J9",
      description: "194J-TDS on Fees for Tech Service - Inv",
      status: "1",
      modifiedBy: null,
    },
    {
      id: 101,
      type: "JA",
      code: "JA",
      description: "194J-TDS on Prof./Tech. Fees-Pymt",
      status: "1",
      modifiedBy: null,
    },
    {
      id: 102,
      type: "JA",
      code: "PA",
      description: "TDS on prof fees u/s 194J - No Pan 20%",
      status: "1",
      modifiedBy: null,
    },
    {
      id: 103,
      type: "JB",
      code: "JB",
      description: "TDS u/s 194J on Royalty (Local) - Pay.",
      status: "1",
      modifiedBy: null,
    },
    {
      id: 104,
      type: "JB",
      code: "PA",
      description: "TDS on prof fees u/s 194J - No Pan 20%",
      status: "1",
      modifiedBy: null,
    },
    {
      id: 105,
      type: "JC",
      code: "JC",
      description: "194J-TDS on Prof./Tech. Fees-Pymt",
      status: "1",
      modifiedBy: null,
    },
    {
      id: 106,
      type: "JD",
      code: "JD",
      description: "TDS u/s 194J on Royalty (Local) - Pay.",
      status: "1",
      modifiedBy: null,
    },
    {
      id: 107,
      type: "JE",
      code: "JE",
      description: "194J-TDS on Fees for Tech Service -Pay",
      status: "1",
      modifiedBy: null,
    },
    {
      id: 108,
      type: "JF",
      code: "JF",
      description: "194J-TDS on Fees for Tech Service -Pay",
      status: "1",
      modifiedBy: null,
    },
    {
      id: 109,
      type: "JG",
      code: "JG",
      description: "194J-TDS on Prof./Tech. Fees-Pymt",
      status: "1",
      modifiedBy: null,
    },
    {
      id: 110,
      type: "JH",
      code: "JH",
      description: "TDS u/s 194J on Royalty (Local) - Pay.",
      status: "1",
      modifiedBy: null,
    },
    {
      id: 111,
      type: "JI",
      code: "JI",
      description: "194J-TDS on Fees for Tech Service -Pay",
      status: "1",
      modifiedBy: null,
    },
    {
      id: 112,
      type: "P1",
      code: "P1",
      description: "TDS on Service Fee- Inv",
      status: "1",
      modifiedBy: null,
    },
    {
      id: 113,
      type: "P2",
      code: "P2",
      description: "TDS on Freight W/O Surchrge-Grossup-Inv",
      status: "1",
      modifiedBy: null,
    },
    {
      id: 114,
      type: "P3",
      code: "P3",
      description: "TDS on Frt W/O Surchge-NET-195(Inv)",
      status: "1",
      modifiedBy: null,
    },
    {
      id: 115,
      type: "P4",
      code: "P4",
      description: "TDS-Technical W/O Surch-Grossup-195(Inv)",
      status: "1",
      modifiedBy: null,
    },
    {
      id: 116,
      type: "P5",
      code: "P5",
      description: "TDS-Technical W/O Surchge-NET-195(Inv)",
      status: "1",
      modifiedBy: null,
    },
    {
      id: 117,
      type: "P6",
      code: "P6",
      description: "TDS-Professional-Non Resident-195 (Inv)",
      status: "1",
      modifiedBy: null,
    },
    {
      id: 118,
      type: "PA",
      code: "PA",
      description: "TDS on Service Fee- Pay",
      status: "1",
      modifiedBy: null,
    },
    {
      id: 119,
      type: "PB",
      code: "PB",
      description: "TDS on Freight W/O Surchrge-Grossup-Pay",
      status: "1",
      modifiedBy: null,
    },
    {
      id: 120,
      type: "PC",
      code: "PC",
      description: "TDS on Frt W/O Surchge-NET-195(Pay)",
      status: "1",
      modifiedBy: null,
    },
    {
      id: 121,
      type: "PD",
      code: "PD",
      description: "TDS-Technical W/O Surch-Grossup-195(Pay)",
      status: "1",
      modifiedBy: null,
    },
    {
      id: 122,
      type: "PE",
      code: "PE",
      description: "TDS-Technical W/O Surchge-NET-195(Pay)",
      status: "1",
      modifiedBy: null,
    },
    {
      id: 123,
      type: "PF",
      code: "PF",
      description: "TDS-Professional-Non Resident-195 (Pay)",
      status: "1",
      modifiedBy: null,
    },
    {
      id: 124,
      type: "R1",
      code: "R1",
      description: "TDS on Service Fee- Inv",
      status: "1",
      modifiedBy: null,
    },
    {
      id: 125,
      type: "R2",
      code: "R2",
      description: "TDS on Freight W/O Surchrge-Grossup-Inv",
      status: "1",
      modifiedBy: null,
    },
    {
      id: 126,
      type: "R3",
      code: "R3",
      description: "TDS on Frt W/O Surchge-NET-195(Inv)",
      status: "1",
      modifiedBy: null,
    },
    {
      id: 127,
      type: "R4",
      code: "R4",
      description: "TDS-Technical W/O Surch-Grossup-195(Inv)",
      status: "1",
      modifiedBy: null,
    },
    {
      id: 128,
      type: "R5",
      code: "R5",
      description: "TDS-Technical W/O Surchge-NET-195(Inv)",
      status: "1",
      modifiedBy: null,
    },
    {
      id: 129,
      type: "R6",
      code: "R6",
      description: "TDS-Professional-Non Resident-195 (Inv)",
      status: "1",
      modifiedBy: null,
    },
    {
      id: 130,
      type: "RA",
      code: "RA",
      description: "TDS on Service Fee- Pay",
      status: "1",
      modifiedBy: null,
    },
    {
      id: 131,
      type: "RB",
      code: "RB",
      description: "TDS on Freight W/O Surchrge-Grossup-Pay",
      status: "1",
      modifiedBy: null,
    },
    {
      id: 132,
      type: "RC",
      code: "RC",
      description: "TDS on Frt W/O Surchge-NET-195(Pay)",
      status: "1",
      modifiedBy: null,
    },
    {
      id: 133,
      type: "RD",
      code: "RD",
      description: "TDS-Technical W/O Surch-Grossup-195(Pay)",
      status: "1",
      modifiedBy: null,
    },
    {
      id: 134,
      type: "RE",
      code: "RE",
      description: "TDS-Technical W/O Surchge-NET-195(Pay)",
      status: "1",
      modifiedBy: null,
    },
    {
      id: 135,
      type: "RF",
      code: "RF",
      description: "TDS-Professional-Non Resident-195 (Pay)",
      status: "1",
      modifiedBy: null,
    },
    {
      id: 136,
      type: "S1",
      code: "S1",
      description: "206AB Special provision deduc.of TDS-INV",
      status: "1",
      modifiedBy: null,
    },
    {
      id: 137,
      type: "SA",
      code: "SA",
      description: "206AB Special provision deduc.of TDS-PAY",
      status: "1",
      modifiedBy: null,
    },
    {
      id: 138,
      type: "SG",
      code: "SG",
      description: "State GST tax code",
      status: "1",
      modifiedBy: null,
    },
    {
      id: 139,
      type: "T1",
      code: "I2",
      description: "TCS on Scrap",
      status: "1",
      modifiedBy: null,
    },
    {
      id: 140,
      type: "T1",
      code: "P1",
      description: "TCS on Scrap - No Pan 20%",
      status: "1",
      modifiedBy: null,
    },
    {
      id: 141,
      type: "T1",
      code: "T1",
      description: "TCS on Scrap",
      status: "1",
      modifiedBy: null,
    },
    {
      id: 142,
      type: "T2",
      code: "P1",
      description: "TCS on Minerals - No Pan 20%",
      status: "1",
      modifiedBy: null,
    },
    {
      id: 143,
      type: "T2",
      code: "T2",
      description: "TCS on Minerals,Coal or Lignite Iron Ore",
      status: "1",
      modifiedBy: null,
    },
    {
      id: 144,
      type: "T3",
      code: "I4",
      description: "TCS on Scrap",
      status: "1",
      modifiedBy: null,
    },
    {
      id: 145,
      type: "T3",
      code: "T3",
      description: "TCS on Scrap",
      status: "1",
      modifiedBy: null,
    },
    {
      id: 146,
      type: "T4",
      code: "T4",
      description: "TCS on Minerals,Coal or Lignite Iron Ore",
      status: "1",
      modifiedBy: null,
    },
    {
      id: 147,
      type: "T5",
      code: "T5",
      description: "TCS on Scrap",
      status: "1",
      modifiedBy: null,
    },
    {
      id: 148,
      type: "T6",
      code: "T6",
      description: "TCS on Minerals,Coal or Lignite Iron Ore",
      status: "1",
      modifiedBy: null,
    },
    {
      id: 149,
      type: "W1",
      code: "P1",
      description: "Works Contract Tax - No Pan 20%",
      status: "1",
      modifiedBy: null,
    },
    {
      id: 150,
      type: "W1",
      code: "W1",
      description: "Works Contract Tax(Registered Dealer)",
      status: "1",
      modifiedBy: null,
    },
    {
      id: 151,
      type: "W2",
      code: "P1",
      description: "Works Contract Tax - No Pan 20%",
      status: "1",
      modifiedBy: null,
    },
    {
      id: 152,
      type: "W2",
      code: "W2",
      description: "Works Contract Tax(Unregistered Dealer)",
      status: "1",
      modifiedBy: null,
    },
    {
      id: 153,
      type: "W3",
      code: "W3",
      description: "Sec 194D - Insurance Commission",
      status: "1",
      modifiedBy: null,
    },
    {
      id: 154,
      type: "W4",
      code: "W4",
      description: "Sec 194D - Insurance Commission Surcharg",
      status: "1",
      modifiedBy: null,
    },
    {
      id: 155,
      type: "W5",
      code: "W5",
      description: "Sec 194I - Rent Payment",
      status: "1",
      modifiedBy: null,
    },
    {
      id: 156,
      type: "W6",
      code: "W6",
      description: "Sec 194I - Rent Payment Surcharge",
      status: "1",
      modifiedBy: null,
    },
    {
      id: 157,
      type: "W7",
      code: "W7",
      description: "Sec 194J - Prof/Technical Invoice",
      status: "1",
      modifiedBy: null,
    },
    {
      id: 158,
      type: "W8",
      code: "W8",
      description: "Sec 194J - Prof/Technical  Surcharge",
      status: "1",
      modifiedBy: null,
    },
    {
      id: 159,
      type: "WA",
      code: "WA",
      description: "Sec 194C - Contractors Payment",
      status: "1",
      modifiedBy: null,
    },
    {
      id: 160,
      type: "WB",
      code: "WB",
      description: "Sec 194C - Contractors Payment Surcharge",
      status: "1",
      modifiedBy: null,
    },
    {
      id: 161,
      type: "WC",
      code: "WC",
      description: "Sec 194D - Insurance Commission",
      status: "1",
      modifiedBy: null,
    },
    {
      id: 162,
      type: "WD",
      code: "WD",
      description: "Sec 194D - Insurance Commission Surcharg",
      status: "1",
      modifiedBy: null,
    },
    {
      id: 163,
      type: "WE",
      code: "WE",
      description: "Sec 194I - Rent Payment",
      status: "1",
      modifiedBy: null,
    },
    {
      id: 164,
      type: "WF",
      code: "WF",
      description: "Sec 194I - Rent Payment Surcharge",
      status: "1",
      modifiedBy: null,
    },
    {
      id: 165,
      type: "WG",
      code: "WG",
      description: "Sec 194J - Prof/Technical Invoice",
      status: "1",
      modifiedBy: null,
    },
    {
      id: 166,
      type: "WH",
      code: "WH",
      description: "Sec 194J - Prof/Technical  Surcharge",
      status: "1",
      modifiedBy: null,
    },
  ]);
}
