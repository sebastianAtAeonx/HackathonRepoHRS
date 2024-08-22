import constants from "../helpers/constants.js";
import ses from "../helpers/ses.js";
import knex from "../config/mysql_db.js";
import fun from "../helpers/functions.js";

const getOtpString = (password, processName = "", userName = "") => {
  return (
    `<table style="border:0.5px solid orange; border-radius:5px;">
  <tr>
      <td style="width:20%"></td>
      <td><br><br><p>Hello, <br>Use the following credentials to view your Supplier Registration procedure. Here is a link for login <br><br><a href="${constants.admindetails.homePageUrl}login">${constants.admindetails.homePageUrl}login</a><br><br> Username: Your registered email. <br> Password: <b>` +
    password +
    `</b></p><br>Regards, <br>
    <B>${constants.admindetails.companyFullName}</B> <br><br><br>
    <center>${constants.admindetails.address1},<br>${constants.admindetails.address2}, ${constants.admindetails.state},${constants.admindetails.country}<br><br><img style="width:80px;" src="${constants.admindetails.companyLogo}" /><br>Powered by ${constants.admindetails.companyShortName}<br>Note: Do not reply this email. This is auto-generated email.</center></td><td style='width:20%'></td>
    </table>`
  );
};

const sendPassViaEmail = async (email, processName, password) => {
  try {
    console.log(password);
    const otpString = getOtpString(password, processName);
    const hiddenPasswordString = getOtpString("********", processName);

    const response = await ses.sendEmail(
      constants.sesCredentials.fromEmails.emailOtp,
      email,
      `Registration successful on SupplierX On-boarding portal`,
      otpString,
      hiddenPasswordString
    );
    console.log(response);
    return {
      error: false,
      message: "Password Sent Successfully.",
      data: {
        response,
      },
    };
  } catch (err) {
    fun.sendErrorLog(req, err);
    return {
      error: true,
      message: "Error in sending password",
      data: err,
    };
  }
};

const generateRandomString = (length) => {
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};

const forgotPasswordEmail = async (name, token) => {
  const link = generateRandomString(50);
  return `
  <table style="border:0.5px solid orange; border-radius:5px;">
      <tr>
        <td style="width:20%;"></td>
        <td>
          <br><br>
          Hello <b>${name}</b>,<br>
          <p>We have received request to reset your password. To reset, please click: <br><br> 
            <b>
              <a href='${constants.admindetails.homePageUrl}forgot-password?token=${token}' target='_blank'>
                Reset Password?="${link}"
              </a>
            </b>
          </p>
          Regards, <br>
              <B>${constants.admindetails.companyFullName}</B> <br><br><br>
              <center>${constants.admindetails.address1},<br>${constants.admindetails.address2}, ${constants.admindetails.state},${constants.admindetails.country}<br><br><img style="width:80px;" src="${constants.admindetails.companyLogo}" /><br>Powered by ${constants.admindetails.companyShortName}<br>Note: Do not reply this email. This is auto-generated email.</center>
        </td>
        <td style="width:20%"></td>
      </tr>
    </table>
  `;
};

export default {
  getOtpString,
  sendPassViaEmail,
  forgotPasswordEmail,
};
