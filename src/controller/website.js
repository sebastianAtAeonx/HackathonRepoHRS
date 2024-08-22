import ses from "../helpers/ses.js";
import constants from "../helpers/constants.js";
import validation from "../validation/website.js";

const scheduleDemo = async (req, res) => {
  try {
    const { error, value } = validation.scheduleDemo(req.body);
    if (error) {
      return res.json({
        error: true,
        message: error.details[0].message,
      });
    }
    const { firstName, lastName, email, phoneNo, coName, hearFrom } = value;

    //send e-mail to admin

    const adminBody = `<table style="border:2px solid orange; padding-top:25px;"><tr>
          <td style="width:20%"></td><td>Hello,<br><br> We got request for the demo of <b style="color:orange;">SupplierX</b> from <u><b>${firstName} ${lastName}</b></u>, Phone No.: <b>${phoneNo}</b> for Company: <b>${coName}</b>
          <br><br>Regards,<br> <b>${constants.admindetails.companyFullName}
          </b><br><p align="center">${constants.admindetails.address1}, ${constants.admindetails.address2}<br>${constants.admindetails.state}, ${constants.admindetails.country}<br><img style='max-width:80px;' src="${constants.admindetails.companyLogo}"><br>
          Powered By ${constants.admindetails.companyShortName} <br> Note: Do not reply this email. This is auto-generated email. </p>
          </td>
          <td style="width:20%"></td>
          </tr></table>`;

    const resultOfAdmin = await ses.sendEmail(
      "noreply@supplierx.aeonx.digital",
      "supplierxuser@gmail.com",
      "A new request for SupplierX demo",
      adminBody
    );

    console.log("Result of Admin Email:", resultOfAdmin);

    const visitorBody = `<table style="border:2px solid orange; padding-top:25px;"><tr>
          <td style="width:20%"></td><td>Hello ${firstName},<br><br>We got your request for demo. Thanks for showing interest in our product <b style="color:orange">SupplierX</b>. We will reach to you as soon as possible, will schedule demo for you. <br><br> Regards, <br> <b> ${constants.admindetails.companyFullName}
          </b><br><p align="center">${constants.admindetails.address1}, ${constants.admindetails.address2}<br>${constants.admindetails.state}, ${constants.admindetails.country}<br><img style='max-width:80px;' src="${constants.admindetails.companyLogo}"><br>
          Powered By ${constants.admindetails.companyShortName} <br> Note: Do not reply this email. This is auto-generated email. </p>
          </td><td style="width:20%"></td>
          </tr></table>`;

    //send e-mail to visitor
    const resultOfVisitor = await ses.sendEmail(
      "noreply@supplierx.aeonx.digital",
      email,
      "Welcome to SupplierX",
      visitorBody
    );

    console.log("Result of Visitor Email:", resultOfVisitor);

    return res
      .json({
        error: false,
        message: "Demo request sent successfully",
      })
      .end();
  } catch (error) {
    return res
      .json({ error: true, message: "Please contact Website's Administrator" })
      .end();
  }
};

export default {
  scheduleDemo,
};
