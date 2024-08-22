import constants from "../helpers/constants.js";
import ses from "../helpers/ses.js";
import knex from "../config/mysql_db.js";
import fun from "../helpers/functions.js";

const getQueriedEmailString = (
  supplier_name,
  status,
  approver_name,
  remarks,
  link_address,
  company_name
) => {
  const emailString =
    "<style>html,body { padding: 0; margin:0; }</style>" +
    '<div style="font-family:Arial,Helvetica,sans-serif; line-height: 1.5; font-weight: normal; font-size: 15px; color: #2F3044; min-height: 100%; margin:0; padding:0; width:100%; background-color:#edf2f7">' +
    '<table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;margin:0 auto; padding:0; max-width:600px">' +
    "<tbody>" +
    "<tr>" +
    '<td align="center" valign="center" style="text-align:center; padding: 40px">' +
    '<img src="https://www.aeonx.digital/wp-content/uploads/2022/03/42.png" style="height: 100px" alt="logo">' +
    "<tr>" +
    '<td align="left" valign="center">' +
    '<div style="text-align:left; margin: 0 20px; padding: 40px; background-color:#ffffff; border-radius: 6px">' +
    "<!--begin:Email content-->" +
    '<div style="padding-bottom: 30px; font-size: 17px;">' +
    "<strong> Hello, </strong>" +
    "</div>" +
    '<div style="padding-bottom: 30px"> Registration request of <b>' +
    supplier_name +
    "</b> for Supplier Onboarding Portal has been " +
    status +
    " <br/></div>" +
    '<div style="padding-bottom: 30px">' +
    "Queried By : " +
    approver_name +
    "<br>" +
    "Query is : " +
    remarks +
    "</div>" +
    '<div style="padding-bottom: 30px">You can review this registration using below link:<br>' +
    "<a href=" +
    link_address +
    ' rel="noopener" target="_blank" style="text-decoration:none;color: #009EF7">Click to view registration form</a></div>' +
    "<!--end:Email content-->" +
    '<div style="padding-bottom: 10px">Kind regards,' +
    "<br>" +
    company_name +
    "<tr>" +
    '<td align="center" valign="center" style="font-size: 13px; text-align:center;padding: 20px; color: #6d6e7c;">' +
    "<p>" +
    constants.admindetails.address1 +
    ", </p>" +
    "<p>" +
    constants.admindetails.address2 +
    "</p>" +
    "<p>Copyright © " +
    company_name +
    "</p>" +
    "</td>" +
    "</tr></br></div>" +
    "</div>" +
    "</td>" +
    "</tr>" +
    '<tr align="center">' +
    '<td style="color:#0265d2"><b class="text-primary" >Note :</b> Do not reply to this email. This is auto-generated mail.</td>' +
    "</tr>" +
    "</img>" +
    "</a>" +
    "</td>" +
    "</tr>" +
    "</tbody>" +
    "</table>" +
    "</div>";
  return emailString;
};

async function sendSupplierQueriedEmail(email, status, comment, firstname,lastname,suppliername) {
  let emaildetail =
    "<table style=' text-align: left; width: 100%; border:1px solid orange;'><tr><td style='width:20%'></td><td><br><br><br><b>Hello " +
    suppliername +
    ",</b>" +
    "<br><b>Welcome to " +
    constants.admindetails.companyFullName +
    "</b>" +
    "<br><br>Your Registration request for Supplier Onboarding Portal has been " +
    status +
    "<br>Queried by " +
    firstname +
    " " +
    lastname +
    "<br>Query: " +
    comment +
    "." +
    "<br> Please visit : <a href='https://dev.supplierx.aeonx.digital/' target='_blank'>https://dev.supplierx.aeonx.digital/</a> to give your respond" +
    "<br><br>Kind regards,<br><b>" +
    constants.admindetails.companyFullName +
    "</b><br><br><br><center><br>" +
    constants.admindetails.address1 +
    ", <br> " +
    constants.admindetails.address2 +
    ", " +
    constants.admindetails.city +
    ", " +
    constants.admindetails.state +
    ", " +
    constants.admindetails.country +
    "<br><img style='max-width:80px;' alt='logo' src='https://dev.supplierx.aeonx.digital/mailTruck.png'><br> Powered by aeonx.digital<br> Note: Do not reply this email. This is auto-generated email.</center>" +
    "</td><td style='width:20%'></td></tr></table>";

  const sendEmail = await ses.sendEmail(
    constants.sesCredentials.fromEmails.emailOtp,
    email,
    "Supplier Onboarding Registration - " + status,
    emaildetail
  );
}

export default {
  getQueriedEmailString,
  sendSupplierQueriedEmail,
};
