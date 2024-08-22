import constants from "../helpers/constants.js";

const verifyPanEmail = async (name, pan) => {
  return `
      <table style="width:100%;border:2px solid orange;">
        <tr>
          <td style="width:20%;"></td>
          <td>
            <br><br>
            Hello,<br>${name},<br>
            <p>Your Pan No. ${pan} is invalid. Please update it.
            </p>
            Regards,<br>
            <b>SupplierX</b>
            <br>
            <center>
              <br>
              <img style="max-width:80px;" src="${constants.admindetails.companyLogo}">
              <br>
              Powered by ${constants.admindetails.companyShortName}
              <br>
              Note: Do not reply to this email. This is an auto-generated email.
            </center>
          </td>
          <td style="width:20%"></td>
        </tr>
      </table>
    `;
};

const verifyGSTEmail = async (name, gst) => {
  return `
      <table style="width:100%;border:2px solid orange;">
        <tr>
          <td style="width:20%;"></td>
          <td>
            <br><br>
            Hello,<br>${name},<br>
            <p>Your GST No. ${gst} is invalid. Please update it.
            </p>
            Regards,<br>
            <b>SupplierX</b>
            <br>
            <center>
              <br>
              <img style="max-width:80px;" src="${constants.admindetails.companyLogo}">
              <br>
              Powered by ${constants.admindetails.companyShortName}
              <br>
              Note: Do not reply to this email. This is an auto-generated email.
            </center>
          </td>
          <td style="width:20%"></td>
        </tr>
      </table>
    `;
};

const verifyMsmeEmail = async (name, msmeNo) => {
  return `
    <table style="width:100%;border:2px solid orange;">
      <tr>
        <td style="width:20%;"></td>
        <td>
          <br><br>
          Hello,<br><b> ${name},</b><br>
          <p>Your MSME No. ${msmeNo} is invalid. Please update it on <a href="${constants.admindetails.homePageUrl}login">${constants.admindetails.homePageUrl}login</a>.
          </p>
          Regards,<br>
          <b>${constants.admindetails.companyFullName}</b>
          <br>
          <br>
          <center>
          ${constants.admindetails.address1},<br>
          ${constants.admindetails.address2}, ${constants.admindetails.state}, ${constants.admindetails.country}
            <br><br>
            <img style="max-width:80px;" src="${constants.admindetails.companyLogo}">
            <br>
            Powered by ${constants.admindetails.companyShortName}
            <br>
            Note: Do not reply to this email. This is an auto-generated email.
          </center>
        </td>
        <td style="width:20%"></td>
      </tr>
    </table>
  `;
};

const statusChange = async (name, status) => {
  return `
  <table style="width:100%;border:2px solid orange;">
      <tr>
        <td style="width:20%;"></td>
        <td>
          <br><br>
          Hello, ${name},<br>
          <p>Your request has been ${status}.
          </p>
          Regards,<br>
          <b>SupplierX</b>
          <br>
          <center>
            <br>
            <img style="max-width:80px;" src="https://dev.supplierx.aeonx.digital/mailTruck.png">
            <br>
            Powered by aeonx.digital
            <br>
            Note: Do not reply to this email. This is an auto-generated email.
          </center>
        </td>
        <td style="width:20%"></td>
      </tr>
    </table>
  `;
};

const nextApproverEmail = async (name, status, level) => {
  return `
  <table style="width:100%;border:2px solid orange;">
      <tr>
        <td style="width:20%;"></td>
        <td>
          <br><br>
          Hello ${name},<br>
          <p>Your previous level ${level} request has been ${status}. Please review and approve accordingly.</p>
          Regards,<br>
          <b>SupplierX</b>
          <br>
          <center>
            <br>
            <img style="max-width:80px;" src="https://dev.supplierx.aeonx.digital/mailTruck.png">
            <br>
            Powered by aeonx.digital
            <br>
            Note: Do not reply to this email. This is an auto-generated email.
          </center>
        </td>
        <td style="width:20%"></td>
      </tr>
    </table>
  `;
};

const AdminMsmeEmail = async (name, msmeNo) => {
  return `
    <table style="width:100%;border:2px solid orange;">
      <tr>
        <td style="width:20%;"></td>
        <td>
          <br><br>
          Dear,<br><b> Admin,</b><br>
          <p><b>${name}'s </b> MSME No. ${msmeNo} is invalid.
          We would like to inform you that an email has been sent to <b> ${name} </b> regarding their invalid MSME number.
          </p>
          Regards,<br>
          <b>${constants.admindetails.companyFullName}</b>
          <br>
          <br> 
          <center>
          ${constants.admindetails.address1},<br>
          ${constants.admindetails.address2}, ${constants.admindetails.state}, ${constants.admindetails.country}
            <br><br>
            <img style="max-width:80px;" src="${constants.admindetails.companyLogo}">
            <br>
            Powered by ${constants.admindetails.companyShortName}
            <br>
            Note: Do not reply to this email. This is an auto-generated email.
          </center>
        </td>
        <td style="width:20%"></td>
      </tr>
    </table>
  `;
};
const AdminNotAbleToSendMail = async (name, msmeNo) => {
  return `
    <table style="width:100%;border:2px solid orange;">
      <tr>
        <td style="width:20%;"></td>
        <td>
          <br><br>
          Dear,<br><b> Admin,</b><br>
          <p><b>${name}'s </b> MSME No. ${msmeNo} is invalid.
          we would like to inform you that we are not able to send an email to <b> ${name} </b> regarding their invalid MSME number, Because we did not find their Email Address in our record.
          </p>
          Regards,<br>
          <b>${constants.admindetails.companyFullName}</b>
          <br>
          <br> 
          <center>
          ${constants.admindetails.address1},<br>
          ${constants.admindetails.address2}, ${constants.admindetails.state}, ${constants.admindetails.country}
            <br><br>
            <img style="max-width:80px;" src="${constants.admindetails.companyLogo}">
            <br>
            Powered by ${constants.admindetails.companyShortName}
            <br>
            Note: Do not reply to this email. This is an auto-generated email.
          </center>
        </td>
        <td style="width:20%"></td>
      </tr>
    </table>
  `;
};


export default {
  verifyPanEmail,
  verifyGSTEmail,
  verifyMsmeEmail,
  statusChange,
  nextApproverEmail,
  AdminMsmeEmail,
  AdminNotAbleToSendMail
};
