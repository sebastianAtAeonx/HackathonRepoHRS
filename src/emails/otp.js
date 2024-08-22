import constants from "../helpers/constants.js";
import ses from "../helpers/ses.js";
import knex from "../config/mysql_db.js";
import fun from "../helpers/functions.js";

const getOtpStringOld = (otp, processName = "", userName = "") => {
  return `<div style="font-family: Helvetica,Arial,sans-serif;min-width:1000px;overflow:auto;line-height:2">
    <div style="margin:50px auto;width:70%;padding:20px 0">
      <div style="border-bottom:1px solid #eee">
        <a href="" style="font-size:1.4em;color: #00466a;text-decoration:none;font-weight:600"></a>
      </div>
      <p style="font-size:1.1em">Hi ${userName},</p>
      <p>Use the following OTP to complete your ${processName} procedure. OTP is valid for 5 minutes</p>
      <h2 style="background: #00466a;margin: 0 auto;width: max-content;padding: 0 10px;color: #fff;border-radius: 4px;">${otp}</h2>
      <p style="font-size:0.9em;">Regards,<br />SupplierX Aeonx Digital</p>
      <hr style="border:none;border-top:1px solid #eee" />
      <div style="float:right;padding:8px 0;color:#aaa;font-size:0.8em;line-height:1;font-weight:300">
        <p>${constants.admindetails.address1},</p>
        <p>${constants.admindetails.address2},</p>
        <p>${constants.admindetails.state}</p>
        <p>${constants.admindetails.country}</p>
      </div>
    </div>
  </div>`;
};

const getOtpString = (otp, processName = "", userName = "") => {
  return (
    `<table style="border:0.5px solid orange; border-radius:5px;">
<tr><td style='width:20%'></td><td><br><br><br><p>Hello,<br>
Use the following OTP to complete your
Supplier Registration procedure. OTP is valid for 5 minutes</p>` +
    `<p><h2>OTP: ` +
    otp +
    `</h2></p>Regards,<br> <b>${constants.admindetails.companyFullName}</b><br></p><br><center><br><center> ${constants.admindetails.address1},<br> ${constants.admindetails.address2}, ${constants.admindetails.state}, ${constants.admindetails.country}<br><br><img style="max-width:80px;" src="${constants.admindetails.companyLogo}"><br>Powered by ${constants.admindetails.companyShortName}<br>Note: Do not reply this email. This is auto-generated email.</center></td><td style='width:20%'></td>
    </table>`
  );
};

const sendOtpViaEmail = async (email, processName, processKey) => {
  try {
    const existing = await knex("otps")
      .where({
        process_name: processKey,
        identifier: email,
      })
      .first();

    const otp = Math.floor(100000 + Math.random() * 900000);
    const otpString = getOtpString(otp, processName);
    const time = Date.now();
    const obj = {
      process_name: processKey,
      identifier: email,
      time,
      otp,
    };
    let dbRes = false;

    if (existing) {
      dbRes = await knex("otps").update(obj).where({ id: existing.id });
    } else {
      dbRes = await knex("otps").insert(obj);
    }

    if (!dbRes) {
      return {
        error: true,
        message: "Otp creation process Failed.",
      };
    }

    const response = await ses.sendEmail(
      constants.sesCredentials.fromEmails.emailOtp,
      email,
      `${constants.admindetails.companyShortName} Email Verification`,
      otpString
    );

    return {
      error: false,
      message: "OTP Sent Successfully.",
      // otp: otp,
      data: {
      response,
      },
    };
  } catch (err) {
    fun.sendErrorLog(req, err);
    return {
      error: true,
      message: "Error in sending OTP",
      data: err,
    };
  }
};



export default {
  getOtpString,
  sendOtpViaEmail
};
