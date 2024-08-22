import AWS from "aws-sdk";
import constants from "./constants.js";
import knex from "../config/mysql_db.js";

const SES_CONFIG = {
  accessKeyId: constants.sesCredentials.accessKey,
  secretAccessKey: constants.sesCredentials.secret,
  region: constants.sesCredentials.region,
};

const AWS_SES = new AWS.SES(SES_CONFIG);

let sendEmail = async (
  fromEmail,
  recipientEmail,
  subject,
  body,
  bodyEnc = "-", // this code is used to store ***** (i.e. for password)
  Charset = "UTF-8"
) => {
  let params = {
    Source: fromEmail,
    Destination: {
      ToAddresses: [recipientEmail],
    },
    ReplyToAddresses: [],
    Message: {
      Body: {
        Html: {
          Charset: Charset,
          Data: body,
        },
      },
      Subject: {
        Charset: Charset,
        Data: subject,
      },
    },
  };
  params["ReturnPath"] = "no-reply@supplierx.aeonx.digital";

  if (bodyEnc != "-") {
    // this code is used to store *****(i.e. for password)
    body = bodyEnc;
  }

  const logEmail = await knex("email_logs").insert({
    fromemail: fromEmail,
    toemail: recipientEmail,
    subject: subject,
    body: body,
  });

  return AWS_SES.sendEmail(params).promise();
};

let sendTemplateEmail = (fromEmail, recipientEmail, templateName, data) => {
  let params = {
    Source: fromEmail,
    Template: templateName,
    Destination: {
      ToAddresse: [recipientEmail],
    },
    TemplateData: data,
  };
  return AWS_SES.sendTemplatedEmail(params).promise();
};

//check response of email weather it is successful or not
const emailResponse = async (messageId) => {
  try {
    const params = {
      MessageId: messageId,
    };

    const response = await AWS_SES.getSendStatistics(params).promise();
    // const deliveryStatus = response.SendDataPoints[0];
    const deliveryStatus = response.SendDataPoints[0];
    console.log("Delivery Status:", deliveryStatus);
    return deliveryStatus;
  } catch (error) {
    console.error("Error retrieving delivery status:", error);
    throw error;
  }
};

export default {
  sendEmail,
  sendTemplateEmail,
  emailResponse,
};
