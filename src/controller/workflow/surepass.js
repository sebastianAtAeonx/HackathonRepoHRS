import surepass from "../../services/surepass.js";
import knex from "../../config/mysql_db.js";
import validation from "../../validation/workflow/surpass.js";

const verifyBankAccount = async (req, res) => {

    const { error, value } = validation.verifyBankAccount(req.body);
    if (error) {
      return res.status(400).json({
        error: true,
        message: error.details[0].message,
      });
    }
  
    const { bankAcNo, ifsc } = value;
  
    const bankAcNoDetails = await surepass.verifyBankAc(bankAcNo, ifsc);
  
    if (bankAcNoDetails == -1) {
      return res.status(404)
        .json({
          error: true,
          message: "API credentials are not found in the database.",
        })
        .end();
    }
  
    if (!bankAcNoDetails) {
      return res.status(404)
        .json({
          error: true,
          message: "Bank account not found",
        })
        .end();
    }
  
    return res.status(200)
      .json({
        error: false,
        message: "Bank account details retrived successfully",
        data: bankAcNoDetails,
      })
      .end();
  };

export default{
    verifyBankAccount
}