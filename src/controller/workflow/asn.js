import knex from "../../config/mysql_db.js";
import { v4 as uuidv4 } from "uuid";
import AWS from "aws-sdk";
import QRCode from "qrcode";
import constant from "../../helpers/constants.js";
import CryptoJS from "crypto-js";
import jwt from "jsonwebtoken";
import functions from "../../helpers/functions.js";
import validation from "../../validation/workflow/asn.js";

function stringToDate(dateString) {
  console.log("mydate:=", dateString);
  const [day, month, year] = dateString.split("-").map(Number);

  // Create a Date object by using the year, month (subtract 1 as months are 0-indexed), and day
  const dateObject = new Date(year, month - 1, day);

  return dateObject;
}

const createAsn3 = async (req, res) => {
  try {
    const token = req.headers["authorization"];
    if (!token) {
      return res.status(400).json({
        error: true,
        message: "Token is required.",
      });
    }

    const { jwtConfig } = constant;
    const payload = jwt.decode(token.split(" ")[1], jwtConfig.secret);
    const statusChanger = payload.permissions[0];
    const statusChangerId = payload.id;

    const { error, value } = validation.create(req.body);

    if (error) {
      return res.status(400).json({
        error: true,
        message: error.details[0].message,
      });
    }

    let {
      poNo,
      poDate,
      asnNo,
      plantId,
      supplierId,
      deliveryDate,
      type,
      carrier,
      lineItems,
      status = "Material Shipped",
      gst,
      pan,
      irnNo,
      gstInvoiceNumber,
      shipToAddress,
      billToAddress,
      remarks,
      file,
      eWayBillNo,
      departmentId,
    } = value;

    if (type == "ZSER") {
      status = "requested";
      const asnNo2 = asnNo.replace(/^.{3}/, "SCR");
      asnNo = asnNo2;
      let Obj = [];
      let li = [];
      lineItems.map((item) => {
        const serviceName = item.itemName;
        delete lineItems[0]["itemName"];
        li.push({ serviceName: serviceName, ...lineItems[0] });
      });
      lineItems = [];
      lineItems = li;

      //if you want to not show blank fields
      // lineItems.map((item) => {
      //   Obj.push(Object.keys(item));
      // });
      // Obj.forEach((item, index) => {
      //   item.map((value, ind) => {
      //     // if (lineItems[index][value] == "") {
      //     //   delete lineItems[index][value];
      //     // }
      //   });
      // });
    }

    let currentPOqty = 0;
    const totalPOqty = 1100; //to do : total purchase order qty will come here

    for (const iterator of lineItems) {
      currentPOqty += iterator.orderQuantity;
    }

    // if (currentPOqty != totalPOqty) {
    //   return res.status(400).json({
    //     error: true,
    //     message:
    //       "Total PO quantity should be equal to the sum of order quantities",
    //   });
    // }

    const lineItemsValue = JSON.stringify(lineItems);

    const todaysDate = new Date().getDate() + "";
    const todaysMonth = new Date().getMonth() + 1 + "";
    const todaysYear = new Date().getFullYear() + "";

    const currentDate = new Date(
      stringToDate(todaysDate + "-" + todaysMonth + "-" + todaysYear)
    );

    const deliveryDateIs = new Date(stringToDate(deliveryDate));

    // console.log(currentDate, deliveryDateIs);

    if (deliveryDateIs < currentDate) {
      return res.status(405).json({
        error: true,
        message: "Delivery date should not be less than current date",
      });
    }

    const checkDeptId = await knex("departments")
      .where("id", departmentId)
      .first();

    if (checkDeptId == undefined) {
      return res.status(404).json({
        error: true,
        message: "Department not found",
      });
    }

    const insertASN = await knex("asns").insert({
      poNo,
      poDate,
      asnNo,
      plantId,
      supplierId,
      deliveryDate,
      type,
      carrier,
      lineItems: lineItemsValue,
      status,
      gst,
      pan,
      irnNo,
      gstInvoiceNumber,
      shipToAddress,
      billToAddress,
      remarks,
      file,
      eWayBillNo,
      departmentId,
    });
    if (!insertASN) {
      return res.status(405).json({
        error: true,
        message: "ASN could not submited",
      });
    }

    let insertTimeLine;

    if (type == "ZSER") {
      const timeStampscr = await knex.fn.now();
      const data = {
        asn_id: insertASN,
        requested: statusChangerId,
        requestedTime: await knex.fn.now(),
        requestedStatus: status,
      };
      insertTimeLine = await knex("scrStatusTimeline").insert(data);
    } else {
      const timeStampasn = await knex.fn.now();
      const data = {
        asn_id: insertASN,
        MaterialShipped: statusChangerId,
        MaterialShippedTime: await knex.fn.now(),
        MaterialShippedStatus: status,
      };
      insertTimeLine = await knex("asnStatusTimeline").insert(data);
    }

    if (!insertTimeLine) {
      return res.status(200).json({
        error: false,
        message: "ASN submitted successfully",
        data: insertASN,
      });
    }

    return res.status(200).json({
      error: false,
      message: "ASN submitted successfully and timeline created.",
      data: insertASN,
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: "Could not submit ASN",
      data: JSON.stringify(error),
    });
  }
};

const PaginateAsn2 = async (req, res) => {
  // try {
  const tableName = "asns";
  const searchFrom = ["poNo"];

  const { error, value } = validation.paginate(req.body);
  if (error) {
    return res.status(400).json({
      error: true,
      message: error.details[0].message,
      data: error,
    });
  }

  let total = 0;

  let { offset, limit, order, sort, search, status } = value;
  let results = knex(tableName);
  if (status != undefined && status != "") {
    total = results.where("status", status);
  }
  results = results.where(function () {
    if (search != undefined && search != "") {
      searchFrom.forEach((element) => {
        this.orWhereILike(element, `%${search}%`);
      });
    }
  });
  total = await results.count("id as total").first();
  let rows = knex(tableName);

  if (status != undefined && status != "") {
    rows.where("status", status);
  }
  rows = rows.where(function () {
    if (search != undefined && search != "") {
      searchFrom.forEach((element) => {
        this.orWhereILike(element, `%${search}%`);
      });
    }
  });
  rows = await rows.orderBy(sort, order).limit(limit).offset(offset);

  for (const currentrow of rows) {
    if (currentrow.type == "ZSER") {
      let asnno = currentrow.asnNo;
      currentrow.asnNo = "SCR" + asnno.substr(3);
      //console.log("done:=", currentrow.asnNo, asnno);
    }
  }

  let data_rows = [];
  if (order === "desc") {
    let sr = offset + 1;
    await rows.forEach((row) => {
      row.sr = sr;
      delete row.password;
      row.lineItems = JSON.parse(row.lineItems);
      data_rows.push(row);
      sr++;
    });
  } else {
    let sr = total.total - limit * offset;
    await rows.forEach((row) => {
      row.sr = sr;
      delete row.password;
      row.lineItems = JSON.parse(row.lineItems);
      data_rows.push(row);
      sr--;
    });
  }
  return res.status(200).json({
    error: false,
    message: "Retrieved successfully.",
    data: {
      rows: data_rows,
      total: total.total,
    },
  });
  // } catch (error) {
  //   return res.json({
  //     error: true,
  //     message: "Something went wrong",
  //     data: JSON.stringify(error),
  //   });
  // }
};

//view asn only without status timeline
// const viewAsn2 = async (req, res) => {
//   try {
//     const schema = Joi.object({
//       id: Joi.number().required(),
//     });
//     const { error, value } = schema.validate(req.params);
//     if (error) {
//       return res.status(400).json({
//         error: true,
//         message: error.details[0].message,
//       });
//     }
//     const { id } = value;
//     const asn = await knex("asns").where({ id }).first();

//     if (!asn) {
//       return res.status(400).json({
//         error: true,
//         message: "ASN not found",
//       });
//     }

//     asn.lineItems = JSON.parse(asn.lineItems);

//     return res.status(200).json({
//       error: false,
//       message: "Retrieved successfully.",
//       data: asn,
//     });
//   } catch (error) {
//     return res.json({
//       error: true,
//       message: "Something went wrong",
//       data: JSON.stringify(error),
//     });
//   }
// };

//view asn with status timeline
const viewAsn2 = async (req, res) => {
  try {

    const { error, value } = validation.view(req.params);
    if (error) {
      return res.status(400).json({
        error: true,
        message: error.details[0].message,
      });
    }
    const { id } = value;
    const asn = await knex("asns").where({ id }).first();

    if (!asn) {
      return res.status(400).json({
        error: true,
        message: "ASN not found",
      });
    }

    asn.lineItems = JSON.parse(asn.lineItems);

    const getTimeLine = async (id, type) => {
      let getTimeLine = [];
      if (type == "ZSER") {
        const checkScr = await knex("scrStatusTimeline").where("asn_id", id);

        if (checkScr.length <= 0) {
          return (getTimeLine = null);
        } else {
          getTimeLine = await knex("scrStatusTimeline")
            .select({
              Intial_User: knex.raw(
                "CONCAT(users.firstname, ' ', users.lastname)"
              ),
              Intial_Time: "scrStatusTimeline.requestedTime",
              Intial_Status: "scrStatusTimeline.requestedStatus",
              Standard_Department_User: knex.raw(
                "CONCAT(users1.firstname, ' ', users1.lastname)"
              ),
              AcceptedTime: "scrStatusTimeline.acceptedTime",
              Status1: "scrStatusTimeline.acceptedStatus",
              Accounts_Executive: knex.raw(
                "CONCAT(users2.firstname, ' ', users2.lastname)"
              ),
              InvoicedTime: "scrStatusTimeline.invoicedTime",
              Status2: "scrStatusTimeline.invoicedStatus",
            })
            .leftJoin(
              "users as users",
              "users.id",
              "=",
              "scrStatusTimeline.requested"
            )
            .leftJoin(
              "users as users1",
              "users1.id",
              "=",
              "scrStatusTimeline.accepted"
            )
            .leftJoin(
              "users as users2",
              "users2.id",
              "=",
              "scrStatusTimeline.invoiced"
            )
            .where("asn_id", id);

          const data = [
            {
              Name: getTimeLine[0].Intial_User,
              TIme: getTimeLine[0].Intial_Time,
              Status: getTimeLine[0].Intial_Status,
            },
            {
              Name: getTimeLine[0].Standard_Department_User,
              Time: getTimeLine[0].AcceptedTime,
              Status: getTimeLine[0].Status1,
            },
            {
              Name: getTimeLine[0].Accounts_Executive,
              Time: getTimeLine[0].InvoicedTime,
              Status: getTimeLine[0].Status2,
            },
          ];

          getTimeLine = [];
          getTimeLine.push(data);
        }
      } else {
        const tableName = "asnStatusTimeline";
        const checkScr = await knex(tableName).where("asn_id", id);
        if (checkScr.length <= 0) {
          return (getTimeLine = null);
        } else {
          getTimeLine = await knex(tableName)
            .select({
              MaterialShipped: knex.raw(
                "CONCAT(users.firstname, ' ', users.lastname)"
              ),
              MaterialShippedTime: `${tableName}.MaterialShippedTime`,
              Status: `${tableName}.MaterialShippedStatus`,
              MaterialGateInward: knex.raw(
                "CONCAT(users1.firstname, ' ', users1.lastname)"
              ),
              MaterialGateInwardTime: `${tableName}.MGITime`,
              Status1: `${tableName}.MaterialGateInwardStatus`,

              MaterialReceived: knex.raw(
                "CONCAT(users2.firstname, ' ', users2.lastname)"
              ),
              MaterialReceivedTime: `${tableName}.MaterialReceivedTime`,
              Status2: `${tableName}.MaterialReceivedStatus`,

              QualityApproved: knex.raw(
                "CONCAT(users3.firstname, ' ', users3.lastname)"
              ),
              QualityApprovedTime: `${tableName}.QualityApprovedTime`,
              Status3: `${tableName}.QualityApprovedStatus`,
              Invoiced: knex.raw(
                "CONCAT(users4.firstname, ' ', users4.lastname)"
              ),
              InvoicedTime: `${tableName}.InvoicedTime`,
              Status4: `${tableName}.InvoicedStatus`,
            })
            .leftJoin(
              "users as users",
              "users.id",
              "=",
              `${tableName}.MaterialShipped`
            )
            .leftJoin(
              "users as users1",
              "users1.id",
              "=",
              `${tableName}.MaterialGateInward`
            )
            .leftJoin(
              "users as users2",
              "users2.id",
              "=",
              `${tableName}.MaterialReceived`
            )
            .leftJoin(
              "users as users3",
              "users3.id",
              "=",
              `${tableName}.QualityApproved`
            )
            .leftJoin(
              "users as users4",
              "users4.id",
              "=",
              `${tableName}.Invoiced`
            )
            .where("asn_id", id);

          const data = [
            {
              Name: getTimeLine[0].MaterialShipped,
              Time: getTimeLine[0].MaterialShippedTime,
              Status: getTimeLine[0].Status,
            },
            {
              Name: getTimeLine[0].MaterialGateInward,
              Time: getTimeLine[0].MaterialGateInwardTime,
              Status: getTimeLine[0].Status1,
            },
            {
              Name: getTimeLine[0].MaterialReceived,
              Time: getTimeLine[0].MaterialReceivedTime,
              Status: getTimeLine[0].Status2,
            },
            {
              Name: getTimeLine[0].QualityApproved,
              Time: getTimeLine[0].QualityApprovedTime,
              Status: getTimeLine[0].Status3,
            },
            {
              Name: getTimeLine[0].Invoiced,
              Time: getTimeLine[0].InvoicedTime,
              Status: getTimeLine[0].Status4,
            },
          ];
          getTimeLine = [];
          getTimeLine.push(data);
        }
      }
      return getTimeLine[0];
    };

    const timeline = await getTimeLine(id, asn.type);

    return res.status(200).json({
      error: false,
      message: "Retrieved successfully.",
      data: asn,
      timeline: timeline,
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: "Could not retrive",
      data: error,
    });
  }
};

const deleteAsn2 = async (req, res) => {
  try {

    const { error, value } = validation.del(req.params);
    if (error) {
      return res.status(400).json({
        error: true,
        message: error.details[0].message,
      });
    }
    const { id } = value;
    const getType = await knex("asns").select("type").where({ id });
    if (getType.length <= 0) {
      return res.status(400).json({
        error: true,
        message: "ASN not found",
      });
    }
    const asn_id = id;
    let dltTimeline;
    if (getType[0].type == "ZSER") {
      dltTimeline = await knex("scrStatusTimeline").where({ asn_id }).del();
    } else {
      dltTimeline = await knex("asnStatusTimeline").where({ asn_id }).del();
    }
    const asn = await knex("asns").where({ id }).del();

    if (!asn) {
      return res.status(200).json({
        error: false,
        message: "ASN not found.",
      });
    }

    if (asn && !dltTimeline) {
      return res.status(200).json({
        error: false,
        message: "ASN deleted successfully.",
      });
    }

    return res.status(200).json({
      error: false,
      message: "ASN & Status History deleted successfully",
    });
  } catch (error) {
    return res.json({
      error: true,
      message: "Something went wrong",
      data: JSON.stringify(error),
    });
  }
};

const updateAsn2 = async (req, res) => {
  try {

    const { error, value } = validation.update(req.body);
    if (error) {
      return res.status(400).json({
        error: true,
        message: error.details[0].message,
      });
    }

    const {
      id,
      poNo,
      plantId,
      supplierId,
      deliveryDate,
      type,
      carrier,
      lineItems,
      status,
    } = value;

    let currentPOqty = 0;
    const totalPOqty = 1100; //to do : total purchase order qty will come here

    for (const iterator of lineItems) {
      currentPOqty += iterator.orderQuantity;
    }

    if (currentPOqty != totalPOqty) {
      return res.status(400).json({
        error: true,
        message:
          "Total PO quantity should be equal to the sum of order quantities",
      });
    }

    const lineItemsValue = JSON.stringify(lineItems);

    const todaysDate = new Date().getDate() + "";
    const todaysMonth = new Date().getMonth() + 1 + "";
    const todaysYear = new Date().getFullYear() + "";

    const currentDate = new Date(
      stringToDate(todaysDate + "-" + todaysMonth + "-" + todaysYear)
    );

    const deliveryDateIs = new Date(stringToDate(deliveryDate));

    console.log(currentDate, deliveryDateIs);

    if (deliveryDateIs < currentDate) {
      return res.status(400).json({
        error: true,
        message: "Delivery date should not be less than current date",
      });
    }

    const updationDataIs = await functions.takeSnapShot("asns", id);
    const updateASN = await knex("asns").where({ id }).update({
      poNo,
      plantId,
      supplierId,
      deliveryDate,
      type,
      carrier,
      lineItems: lineItemsValue,
      status,
    });

    if (!updateASN) {
      return res.status(400).json({
        error: true,
        message: "ASN could not updated",
      });
    }
    if (id) {
      const modifiedByTable1 = await functions.SetModifiedBy(
        req.headers["authorization"],
        "asns",
        "id",
        id
      );
      console.log("isUpdated:-", modifiedByTable1);
    }
    return res.status(200).json({
      error: false,
      message: "ASN updated successfully",
    });
  } catch (error) {
    return res.json({
      error: true,
      message: "Something went wrong",
      data: JSON.stringify(error),
    });
  }
};

const QRCodeAsn = async (req, res) => {
  try {
    const { error, value } = validation.QRScan(req.params);
    if (error) {
      return res.status(400).json({
        error: true,
        message: error.details[0].message,
      });
    }
    const { id } = value;
    const asn = await knex("asns").where({ id }).first();
    if (!asn) {
      return res.status(400).json({
        error: true,
        message: "ASN not found",
      });
    }

    asn.lineItems = JSON.parse(asn.lineItems);

    let stringdata = JSON.stringify(asn);

    const secret = constant.jwtConfig.secret;

    const encryptedData = CryptoJS.AES.encrypt(stringdata, secret).toString();

    const credentials = new AWS.Credentials({
      accessKeyId: constant.s3Creds.accessKey,
      secretAccessKey: constant.s3Creds.secret,
    });
    AWS.config.credentials = credentials;

    const s3 = new AWS.S3({
      credentials: credentials,
    });

    // Converting the data into base64
    QRCode.toDataURL(
      encryptedData,
      { errorCorrectionLevel: "L", scale: 2 },
      function (err, code) {
        if (err) {
          return res.send({
            error: true,
            message: err.message,
          });
        }

        // Printing the code
        // console.log(code.split(',')[1])
        const imageBuffer = Buffer.from(code.split(",")[1], "base64");
        const QrCodeName = `QRCode${asn.asnNo}.png`;
        const uploadParams = {
          Bucket: constant.s3Creds.bucket,
          Key: "asnQrcodes/" + QrCodeName,
          Body: Buffer.from(imageBuffer),
          ContentType: "image/png",
        };

        s3.upload(uploadParams, async (err, data) => {
          if (err) {
            return res.send({
              error: true,
              message: err.message,
            });
          }

          const updationDataIs = await functions.takeSnapShot("asns", id);
          const QrCodeinDb = await knex("asns")
            .update("QrCode", QrCodeName)
            .where({ id });
          if (QrCodeinDb.length <= 0) {
            return res.send({
              error: false,
              message: "Uploaded to s3 but Failed to Insert name in Db.",
              QrCodeBase64: code.split(",")[1],
            });
          }
          if (id) {
            const modifiedByTable1 = await functions.SetModifiedBy(
              req.headers["authorization"],
              "asns",
              "id",
              id
            );
            console.log("isUpdated:-", modifiedByTable1);
          }
          return res.send({
            error: false,
            message: "Uploaded to s3 and Inserted name in Db.",
            QrCodeBase64: code.split(",")[1],
          });
        });
      }
    );
  } catch (error) {
    return res.json({
      error: true,
      message: error.message,
    });
  }
};

const checkQRCode = async (req, res) => {
  try {

    const { error, value } = validation.checkQR(req.body);
    if (error) {
      return res.json({
        error: true,
        message: error.details[0].message,
      });
    }

    const { text } = value;

    let obj;
    try {
      const secret = constant.jwtConfig.secret;

      const decryptedData = CryptoJS.AES.decrypt(text, secret).toString(
        CryptoJS.enc.Utf8
      );

      eval("obj = " + decryptedData);
    } catch (error) {
      return res.json({
        error: true,
        message: "Wrong QRCode.",
      });
    }
    let counter = 0;
    const keys = Object.keys(obj);
    const search = [
      "poNo",
      "poDate",
      "asnNo",
      "plantId",
      "supplierId",
      "lineItems",
      "gst",
      "pan",
    ];
    search.forEach((item) => {
      keys.forEach((key) => {
        if (item == key) {
          counter += 1;
        }
      });
    });

    const { id, type } = obj;
    console.log("this is type", type);
    const user = "users";
    let getTimeLine = [];
    if (type == "ZSER") {
      const checkScr = await knex("scrStatusTimeline").where("asn_id", id);

      if (checkScr.length <= 0) {
        return (getTimeLine = null);
      } else {
        getTimeLine = await knex("scrStatusTimeline")
          .select({
            Intial_User: knex.raw(
              "CONCAT(users.firstname, ' ', users.lastname)"
            ),
            Intial_Time: "scrStatusTimeline.requestedTime",
            Intial_Status: "scrStatusTimeline.requestedStatus",
            Standard_Department_User: knex.raw(
              "CONCAT(users1.firstname, ' ', users1.lastname)"
            ),
            AcceptedTime: "scrStatusTimeline.acceptedTime",
            Status1: "scrStatusTimeline.acceptedStatus",
            Accounts_Executive: knex.raw(
              "CONCAT(users2.firstname, ' ', users2.lastname)"
            ),
            InvoicedTime: "scrStatusTimeline.invoicedTime",
            Status2: "scrStatusTimeline.invoicedStatus",
          })
          .leftJoin(
            "users as users",
            "users.id",
            "=",
            "scrStatusTimeline.requested"
          )
          .leftJoin(
            "users as users1",
            "users1.id",
            "=",
            "scrStatusTimeline.accepted"
          )
          .leftJoin(
            "users as users2",
            "users2.id",
            "=",
            "scrStatusTimeline.invoiced"
          )
          .where("asn_id", id);

        const data = [
          {
            Name: getTimeLine[0].Intial_User,
            TIme: getTimeLine[0].Intial_Time,
            Status: getTimeLine[0].Intial_Status,
          },
          {
            Name: getTimeLine[0].Standard_Department_User,
            Time: getTimeLine[0].AcceptedTime,
            Status: getTimeLine[0].Status1,
          },
          {
            Name: getTimeLine[0].Accounts_Executive,
            Time: getTimeLine[0].InvoicedTime,
            Status: getTimeLine[0].Status2,
          },
        ];

        getTimeLine = [];
        getTimeLine.push(data);
      }
    } else {
      const tableName = "asnStatusTimeline";
      const checkScr = await knex(tableName).where("asn_id", id);
      if (checkScr.length <= 0) {
        return (getTimeLine = null);
      } else {
        getTimeLine = await knex(tableName)
          .select({
            MaterialShipped: knex.raw(
              "CONCAT(users.firstname, ' ', users.lastname)"
            ),
            MaterialShippedTime: `${tableName}.MaterialShippedTime`,
            Status: `${tableName}.MaterialShippedStatus`,
            MaterialGateInward: knex.raw(
              "CONCAT(users1.firstname, ' ', users1.lastname)"
            ),
            MaterialGateInwardTime: `${tableName}.MGITime`,
            Status1: `${tableName}.MaterialGateInwardStatus`,

            MaterialReceived: knex.raw(
              "CONCAT(users2.firstname, ' ', users2.lastname)"
            ),
            MaterialReceivedTime: `${tableName}.MaterialReceivedTime`,
            Status2: `${tableName}.MaterialReceivedStatus`,

            QualityApproved: knex.raw(
              "CONCAT(users3.firstname, ' ', users3.lastname)"
            ),
            QualityApprovedTime: `${tableName}.QualityApprovedTime`,
            Status3: `${tableName}.QualityApprovedStatus`,
            Invoiced: knex.raw(
              "CONCAT(users4.firstname, ' ', users4.lastname)"
            ),
            InvoicedTime: `${tableName}.InvoicedTime`,
            Status4: `${tableName}.InvoicedStatus`,
          })
          .leftJoin(
            "users as users",
            "users.id",
            "=",
            `${tableName}.MaterialShipped`
          )
          .leftJoin(
            "users as users1",
            "users1.id",
            "=",
            `${tableName}.MaterialGateInward`
          )
          .leftJoin(
            "users as users2",
            "users2.id",
            "=",
            `${tableName}.MaterialReceived`
          )
          .leftJoin(
            "users as users3",
            "users3.id",
            "=",
            `${tableName}.QualityApproved`
          )
          .leftJoin(
            "users as users4",
            "users4.id",
            "=",
            `${tableName}.Invoiced`
          )
          .where("asn_id", id);

        const data = [
          {
            Name: getTimeLine[0].MaterialShipped,
            Time: getTimeLine[0].MaterialShippedTime,
            Status: getTimeLine[0].Status,
          },
          {
            Name: getTimeLine[0].MaterialGateInward,
            Time: getTimeLine[0].MaterialGateInwardTime,
            Status: getTimeLine[0].Status1,
          },
          {
            Name: getTimeLine[0].MaterialReceived,
            Time: getTimeLine[0].MaterialReceivedTime,
            Status: getTimeLine[0].Status2,
          },
          {
            Name: getTimeLine[0].QualityApproved,
            Time: getTimeLine[0].QualityApprovedTime,
            Status: getTimeLine[0].Status3,
          },
          {
            Name: getTimeLine[0].Invoiced,
            Time: getTimeLine[0].InvoicedTime,
            Status: getTimeLine[0].Status4,
          },
        ];
        getTimeLine = [];
        getTimeLine.push(data);
      }
    }

    if (getTimeLine.length <= 0) {
      if (counter >= search.length - 1) {
        return res.json({
          error: false,
          data: obj,
        });
      } else {
        return res.json({
          error: true,
          message: "Wrong QRCode.",
        });
      }
    }

    if (counter >= search.length - 1) {
      return res.json({
        error: false,
        timeline: getTimeLine[0],
        data: obj,
      });
    } else {
      return res.json({
        error: true,
        message: "Wrong QRCode.",
      });
    }
  } catch (error) {
    return res.json({
      error: true,
      message: "Wrong QRCode.",
      data: error.message,
    });
  }
};

const asnStatusChange = async (req, res) => {
  try {
    const historyTable = "asn_status_history";
    const asnTable = "asns";

    let asnStatus = "invoiced";

    const { error, value } = validation.statusChange(req.params);
    if (error) {
      return res.json({
        error: true,
        message: error.details[0].message,
      });
    }

    const { id } = value;

    const checkStatus = await knex(asnTable).where({ id }).first();
    if (checkStatus == undefined) {
      return res.json({
        error: true,
        message: "ASN not found",
      });
    }

    if (checkStatus.status == "materialShipped") {
      const updationDataIs = await functions.takeSnapShot(asnTable, id);
      const updateStatus = await knex(asnTable)
        .where({ id })
        .update({ status: "materialGateInward" });
      if (id) {
        const modifiedByTable1 = await functions.SetModifiedBy(
          req.headers["authorization"],
          asnTable,
          "id",
          id
        );
        console.log("isUpdated:-", modifiedByTable1);
      }
      const insertHistory = await knex(historyTable).insert({
        asnId: id,
        status: "materialGateInward",
      });

      asnStatus = "materialGateInward";
    }

    if (checkStatus.status == "materialGateInward") {
      const updationDataIs = await functions.takeSnapShot(asnTable, id);
      const updateStatus = await knex(asnTable)
        .where({ id })
        .update({ status: "received" });
      if (id) {
        const modifiedByTable1 = await functions.SetModifiedBy(
          req.headers["authorization"],
          asnTable,
          "id",
          id
        );
        console.log("isUpdated:-", modifiedByTable1);
      }
      const insertHistory = await knex(historyTable).insert({
        asnId: id,
        status: "received",
      });

      asnStatus = "received";
    }

    if (checkStatus.status == "received") {
      const updationDataIs = await functions.takeSnapShot(asnTable, id);
      const updateStatus = await knex(asnTable)
        .where({ id })
        .update({ status: "qualityApproved" });
      if (id) {
        const modifiedByTable1 = await functions.SetModifiedBy(
          req.headers["authorization"],
          asnTable,
          "id",
          id
        );
        console.log("isUpdated:-", modifiedByTable1);
      }
      const insertHistory = await knex(historyTable).insert({
        asnId: id,
        status: "qualityApproved",
      });

      asnStatus = "qualityApproved";
    }

    if (checkStatus.status == "qualityApproved") {
      const updationDataIs = await functions.takeSnapShot(asnTable, id);
      const updateStatus = await knex(asnTable)
        .where({ id })
        .update({ status: "invoiced" });
      if (id) {
        const modifiedByTable1 = await functions.SetModifiedBy(
          req.headers["authorization"],
          asnTable,
          "id",
          id
        );
        console.log("isUpdated:-", modifiedByTable1);
      }
      const insertHistory = await knex(historyTable).insert({
        asnId: id,
        status: "invoiced",
      });

      asnStatus = "invoiced";
    }

    return res
      .json({
        error: false,
        message: "ASN status updated successfully to " + asnStatus,
      })
      .end();
  } catch (error) {
    return res.json({
      error: true,
      message: error.message,
    });
  }
};
//   "partiallyPaid",
//   "fullyPaid",
//   "unpaid"

const asnPaymentStatusUpdate = async (req, res) => {
  try {
    const asnTable = "asns";
    const historyTable = "asn_status_history";

    const { error, value } = validation.asnPaymentStatusUpdate(req.body);
    if (error) {
      return res.json({
        error: true,
        message: error.details[0].message,
      });
    }

    const { id, status } = value;

    const checkStatus = await knex(asnTable).where({ id }).first();
    if (checkStatus == undefined) {
      return res.json({
        error: true,
        message: "ASN not found",
      });
    }

    const updationDataIs = await functions.takeSnapShot(asnTable, id);
    const updateStatus = await knex(asnTable)
      .where({ id })
      .update({ status: status });
    if (id) {
      const modifiedByTable1 = await functions.SetModifiedBy(
        req.headers["authorization"],
        asnTable,
        "id",
        id
      );
      console.log("isUpdated:-", modifiedByTable1);
    }
    const insertHistory = await knex(historyTable).insert({
      asnId: id,
      status: status,
    });

    return res.json({
      error: false,
      message: "ASN payment status updated successfully to " + status,
    });
  } catch (error) {
    return res.json({
      error: true,
      message: error.message,
    });
  }
};

const viewAsnStatusHistory = async (req, res) => {
  try {

    const { error, value } = validation.viewStatusHistory(req.params);
    if (error) {
      return res.json({
        error: true,
        message: error.details[0].message,
      });
    }

    const { id } = value;

    const getAsnStatusHistory = await knex("asn_status_history").where({
      asnId: id,
    });

    if (getAsnStatusHistory.length == 0) {
      return res.json({
        error: true,
        message: "ASN status history not found",
      });
    }

    return res
      .json({
        error: false,
        message: "ASN status history found successfully",
        data: getAsnStatusHistory,
      })
      .end();
  } catch (error) {
    return res.json({
      error: true,
      message: error.message,
    });
  }
};

const viewAsnCurrentStatus = async (req, res) => {
  try {

    const { error, value } = validation.viewCurrentStatus(req.params);
    if (error) {
      return res.json({
        error: true,
        message: error.details[0].message,
      });
    }

    const { id } = value;

    const getAsnCurrentStatus = await knex("asn_status_history")
      .where({ asnId: id })
      .orderBy("id", "desc")
      .limit(1);

    if (getAsnCurrentStatus == undefined || getAsnCurrentStatus == "") {
      return res
        .json({
          error: true,
          message: "ASN not found",
        })
        .end();
    }

    return res
      .json({
        error: false,
        message: "ASN current status found successfully",
        data: getAsnCurrentStatus,
      })
      .end();
  } catch (error) {
    return res.json({
      error: true,
      message: error.message,
    });
  }
};

const getQRCode = async (req, res) => {
  try {

    const { error, value } = validation.getQRCode(req.body);
    if (error) {
      return res.json({
        error: true,
        message: error.details[0].message,
      });
    }

    const { QrCode } = value;

    const credentials = new AWS.Credentials({
      accessKeyId: constant.s3Creds.accessKey,
      secretAccessKey: constant.s3Creds.secret,
    });
    AWS.config.credentials = credentials;

    const s3 = new AWS.S3({
      credentials: credentials,
    });

    const params = {
      Bucket: constant.s3Creds.bucket,
      Key: "asnQrcodes/" + QrCode,
    };

    s3.getObject(params, (err, data) => {
      if (err) {
        return res.json({
          error: true,
          message: "Failed to fetch QRCoce.",
          data: [],
        });
      } else {
        const fileBuffer = data.Body;
        const imageBuffer = fileBuffer.toString("base64");
        return res.json({
          error: false,
          message: "QRCode fetched.",
          data: imageBuffer,
        });
      }
    });
  } catch (error) {
    return res.json({
      error: true,
      message: error.message,
    });
  }
};

// const workFlowStatus = async (req, res) => {
//   try {
//     const token = req.headers["authorization"];

//     if (!token) {
//       return res.json({
//         error: true,
//         message: "Token is required.",
//       });
//     }

//     const { jwtConfig } = constant;

//     const payload = jwt.decode(token.split(" ")[1], jwtConfig.secret);
//     const statusChanger = payload.permissions[0];
//     // console.log("status changer",statusChanger);
//     const statusChangerId = payload.role;

//     const { id, status } = req.body;
//     //check if status is shipped or not
//     const checkShippedStatus = await knex("asns")
//       .where({ id: id })
//       .select("status");
//     if (checkShippedStatus[0].status === "materialShipped") {
//       const updateStatusToInward = await knex("asns")
//         .where({ id: id })
//         .update({ status: status });
//       if (!updateStatusToInward) {
//         return res
//           .json({
//             error: true,
//             message: "Unable to update",
//           })
//           .end();
//       }
//       //  else {
//       //   res.json({ message: "Updated successfullly" });
//       // }
//       const changeStatus = await knex("asnStatusTimeline")
//         .where({ id: id })
//         .insert({ asn_id: id, MaterialGateInward: statusChangerId });
//       if (!changeStatus) {
//         return res
//           .json({
//             error: true,
//             message: "Unable to insert status",
//           })
//           .end();
//       }
//       res
//         .json({
//           error: false,
//           message: "Material status stored in timeliine successfully",
//         })
//         .end();
//       const checkInwardStatus = await knex("asns")
//         .where({ id: id })
//         .select("status");
//       if (checkInwardStatus[0].status === "materialGateInward") {
//         const updateStatusToMaterialReceived = await knex("asns")
//           .where({ id: id })
//           .update("status");
//         if (!updateStatusToMaterialReceived) {
//           return res.json({
//             error: true,
//             message: "Unable to update",
//           });
//         } else {
//           res.json({ message: "Status updated successfully" });
//         }
//         const changeStatusToMaterialReceived = await knex("asnStatusTimeline")
//           .where({ id: id })
//           .insert({ asn_id: id, MaterialReceived: statusChangerId });
//         if (!changeStatusToMaterialReceived) {
//           return res
//             .json({
//               error: true,
//               message: "Unable to insert status",
//             })
//             .end();
//         }
//         res
//           .json({
//             error: false,
//             message: "Status stored in timeline successfully",
//           })
//           .end();

//         const checkStatusMaterialRec = await knex("asns")
//           .where({ id: id })
//           .select("status");
//         if (checkStatusMaterialRec[0].status === "materialReceived") {
//           const updateStatusToQualityApproved = await knex("asns")
//             .where({ id: id })
//             .update({ status: status });
//           if (!updateStatusToQualityApproved) {
//             return res
//               .json({
//                 error: true,
//                 message: "Unable to update status",
//               })
//               .end();
//           } else {
//             res.json({ message: "Status updated successfully" });
//           }
//           const changeStatusToQuality = await knex("asnStatusTimeline")
//             .where({ id: id })
//             .insert({ asn_id: id, QualityApproved: statusChangerId });
//           if (!changeStatusToQuality) {
//             return res
//               .json({
//                 error: true,
//                 message: "Unable to store status",
//               })
//               .end();
//           }
//           res
//             .json({ message: "Change inserted to timeline successfully" })
//             .end();

//           const checkQuaityApprovedStatus = await knex("asns")
//             .where({ id: id })
//             .select("status");
//           if (checkQuaityApprovedStatus[0].status === "qualityApproved") {
//             const statusChangedToInvoiced = await knex("asns")
//               .where({ id: id })
//               .update({ status: status });
//             if (!statusChangedToInvoiced) {
//               return res
//                 .json({
//                   error: true,
//                   message: "Unable to update status",
//                 })
//                 .end();
//             } else {
//               res.json({
//                 message: "Status changed successfully",
//               });
//             }
//             const changeStatusInvoiced = await knex("asnStatusTimeline")
//               .where({ id: id })
//               .insert({ asn_id: id, Invoiced: statusChangerId });
//             if (!changeStatusInvoiced) {
//               return res
//                 .json({
//                   error: true,
//                   message: "Unable to store status",
//                 })
//                 .end();
//             }
//             res
//               .json({ message: "Status stored in timeline successfully" })
//               .end();
//           }
//         } else {
//           res.json({ message: "Material status in not recieved yet" }).end();
//         }
//       } else {
//         return res
//           .json({
//             error: true,
//             message: "First Inward your material at gate",
//           })
//           .end();
//       }
//       if (!changeStatus) {
//         return res
//           .json({
//             error: true,
//             message: "Unable to update status",
//           })
//           .end();
//       }
//     }
//     return res
//       .json({
//         error: true,
//         message: "Material has not shipped",
//       })
//       .end();
//   } catch (error) {
//     return res
//       .json({
//         erro: true,
//         message: "Something went wrong",
//         data:error
//       })
//       .end();
//   }
// };

const workFlowStatus = async (req, res) => {
  try {
    const token = req.headers["authorization"];
    if (!token) {
      return res.json({
        error: true,
        message: "Token is required.",
      });
    }

    const { jwtConfig } = constant;
    const payload = jwt.decode(token.split(" ")[1], jwtConfig.secret);
    const statusChanger = payload.permissions[0];
    const statusChangerId = payload.id;

    const { error, value } = validation.workflowStatus(req.body);
    if (error) {
      return res.json({
        error: true,
        message: error.details[0].message,
      });
    }
    const { text } = value;

    let obj;
    try {
      const secret = constant.jwtConfig.secret;

      const decryptedData = CryptoJS.AES.decrypt(text, secret).toString(
        CryptoJS.enc.Utf8
      );

      eval("obj = " + decryptedData);
    } catch (error) {
      return res.json({
        error: true,
        message: "Wrong QRCode.",
      });
    }

    const { id, departmentId, type } = obj;

    //check if status is shipped or not
    const checkShippedStatus = await knex("asns")
      .where({ id: id })
      .select("status");

    if (type == "ZSER") {
      if (checkShippedStatus.length <= 0) {
        return res.json({
          error: true,
          message: "SCR does not exist.",
        });
      }
    } else {
      if (checkShippedStatus.length <= 0) {
        return res.json({
          error: true,
          message: "ASN does not exist.",
        });
      }
    }

    const userDepid = await knex("users")
      .where({ id: statusChangerId })
      .select("approverofdept");
    const finalDepId = userDepid[0].approverofdept;

    if (userDepid.length <= 0) {
      return res
        .json({
          error: true,
          message: "department id of user not found",
        })
        .end();
    }

    // if (departmentId != finalDepId) {
    //   return res
    //     .json({
    //       error: true,
    //       message: "Department does not match",
    //     })
    //     .end();
    // }

    const getData = async (asnid) => {
      let data = await knex("asns").where({ id: asnid });
      data[0].lineItems = JSON.parse(data[0].lineItems);

      return data[0];
    };

    const getTimeLine = async (id, type) => {
      let getTimeLine = [];
      if (type == "ZSER") {
        const checkScr = await knex("scrStatusTimeline").where("asn_id", id);

        if (checkScr.length <= 0) {
          return (getTimeLine = null);
        } else {
          getTimeLine = await knex("scrStatusTimeline")
            .select({
              Intial_User: knex.raw(
                "CONCAT(users.firstname, ' ', users.lastname)"
              ),
              Intial_Time: "scrStatusTimeline.requestedTime",
              Intial_Status: "scrStatusTimeline.requestedStatus",
              Standard_Department_User: knex.raw(
                "CONCAT(users1.firstname, ' ', users1.lastname)"
              ),
              AcceptedTime: "scrStatusTimeline.acceptedTime",
              Status1: "scrStatusTimeline.acceptedStatus",
              Accounts_Executive: knex.raw(
                "CONCAT(users2.firstname, ' ', users2.lastname)"
              ),
              InvoicedTime: "scrStatusTimeline.invoicedTime",
              Status2: "scrStatusTimeline.invoicedStatus",
            })
            .leftJoin(
              "users as users",
              "users.id",
              "=",
              "scrStatusTimeline.requested"
            )
            .leftJoin(
              "users as users1",
              "users1.id",
              "=",
              "scrStatusTimeline.accepted"
            )
            .leftJoin(
              "users as users2",
              "users2.id",
              "=",
              "scrStatusTimeline.invoiced"
            )
            .where("asn_id", id);

          const data = [
            {
              Name: getTimeLine[0].Intial_User,
              TIme: getTimeLine[0].Intial_Time,
              Status: getTimeLine[0].Intial_Status,
            },
            {
              Name: getTimeLine[0].Standard_Department_User,
              Time: getTimeLine[0].AcceptedTime,
              Status: getTimeLine[0].Status1,
            },
            {
              Name: getTimeLine[0].Accounts_Executive,
              Time: getTimeLine[0].InvoicedTime,
              Status: getTimeLine[0].Status2,
            },
          ];

          getTimeLine = [];
          getTimeLine.push(data);
        }
      } else {
        const tableName = "asnStatusTimeline";
        const checkScr = await knex(tableName).where("asn_id", id);
        if (checkScr.length <= 0) {
          return (getTimeLine = null);
        } else {
          getTimeLine = await knex(tableName)
            .select({
              MaterialShipped: knex.raw(
                "CONCAT(users.firstname, ' ', users.lastname)"
              ),
              MaterialShippedTime: `${tableName}.MaterialShippedTime`,
              Status: `${tableName}.MaterialShippedStatus`,
              MaterialGateInward: knex.raw(
                "CONCAT(users1.firstname, ' ', users1.lastname)"
              ),
              MaterialGateInwardTime: `${tableName}.MGITime`,
              Status1: `${tableName}.MaterialGateInwardStatus`,

              MaterialReceived: knex.raw(
                "CONCAT(users2.firstname, ' ', users2.lastname)"
              ),
              MaterialReceivedTime: `${tableName}.MaterialReceivedTime`,
              Status2: `${tableName}.MaterialReceivedStatus`,

              QualityApproved: knex.raw(
                "CONCAT(users3.firstname, ' ', users3.lastname)"
              ),
              QualityApprovedTime: `${tableName}.QualityApprovedTime`,
              Status3: `${tableName}.QualityApprovedStatus`,
              Invoiced: knex.raw(
                "CONCAT(users4.firstname, ' ', users4.lastname)"
              ),
              InvoicedTime: `${tableName}.InvoicedTime`,
              Status4: `${tableName}.InvoicedStatus`,
            })
            .leftJoin(
              "users as users",
              "users.id",
              "=",
              `${tableName}.MaterialShipped`
            )
            .leftJoin(
              "users as users1",
              "users1.id",
              "=",
              `${tableName}.MaterialGateInward`
            )
            .leftJoin(
              "users as users2",
              "users2.id",
              "=",
              `${tableName}.MaterialReceived`
            )
            .leftJoin(
              "users as users3",
              "users3.id",
              "=",
              `${tableName}.QualityApproved`
            )
            .leftJoin(
              "users as users4",
              "users4.id",
              "=",
              `${tableName}.Invoiced`
            )
            .where("asn_id", id);

          const data = [
            {
              Name: getTimeLine[0].MaterialShipped,
              Time: getTimeLine[0].MaterialShippedTime,
              Status: getTimeLine[0].Status,
            },
            {
              Name: getTimeLine[0].MaterialGateInward,
              Time: getTimeLine[0].MaterialGateInwardTime,
              Status: getTimeLine[0].Status1,
            },
            {
              Name: getTimeLine[0].MaterialReceived,
              Time: getTimeLine[0].MaterialReceivedTime,
              Status: getTimeLine[0].Status2,
            },
            {
              Name: getTimeLine[0].QualityApproved,
              Time: getTimeLine[0].QualityApprovedTime,
              Status: getTimeLine[0].Status3,
            },
            {
              Name: getTimeLine[0].Invoiced,
              Time: getTimeLine[0].InvoicedTime,
              Status: getTimeLine[0].Status4,
            },
          ];
          getTimeLine = [];
          getTimeLine.push(data);
        }
      }
      return getTimeLine[0];
    };

    switch (checkShippedStatus[0].status) {
      case "materialShipped":
        if (statusChanger === "Security Executive") {
          const updationDataIs7 = await functions.takeSnapShot("asns", id);
          const updateStatus = await knex("asns")
            .where({ id: id })
            .update("status", "materialGateInward");

          if (updateStatus.length <= 0) {
            return res.json({
              error: true,
              message: "failed to update the status.",
            });
          }
          if (id) {
            const modifiedByTable1 = await functions.SetModifiedBy(
              req.headers["authorization"],
              "asns",
              "id",
              id
            );
            console.log("isUpdated:-", modifiedByTable1);
          }
          const asnDetail = await getData(id);

          //add timestamp for status
          const timeStamp = knex.fn.now();
          const getId = await knex("asnStatusTimeline")
            .where({ asn_id: id })
            .first();
          const updationDataIs = await functions.takeSnapShot(
            "asnStatusTimeline",
            getId.id
          );
          const insertIntoHistory = await knex("asnStatusTimeline")
            .where({ asn_id: id })
            .update({
              asn_id: id,
              MaterialGateInward: statusChangerId,
              MGITime: timeStamp,
              MaterialGateInwardStatus: "Material Gate Inward",
            });
          if (insertIntoHistory.length <= 0) {
            return res.json({
              error: true,
              message: "failed to insert the history.",
              data: asnDetail,
            });
          }
          if (id) {
            const modifiedByTable2 = await functions.SetModifiedBy(
              req.headers["authorization"],
              "asnStatusTimeline",
              "asn_id",
              id
            );
            console.log("isUpdated:-", modifiedByTable2);
          }
          const timeline = await getTimeLine(id, type);

          return res.json({
            error: false,
            message: "Status changed and history created.",
            timeline: timeline,
            data: asnDetail,
          });
        } else {
          const asnDetail = await getData(id);
          const timeline = await getTimeLine(id, type);
          return res.json({
            error: false,
            message: "Invalid status changer for materialInward status",
            timeline: timeline,
            data: asnDetail,
          });
        }

      case "materialGateInward":
        if (statusChanger === "Store Keeper") {
          const updationDataIs6 = await functions.takeSnapShot("asns", id);
          const updateStatus = await knex("asns")
            .where({ id: id })
            .update("status", "materialReceived");

          if (updateStatus.length <= 0) {
            return res.json({
              error: true,
              message: "failed to update the status.",
            });
          }
          if (id) {
            const modifiedByTable1 = await functions.SetModifiedBy(
              req.headers["authorization"],
              "asns",
              "id",
              id
            );
            console.log("isUpdated:-", modifiedByTable1);
          }
          const asnDetail = await getData(id);

          const timeStamp1 = knex.fn.now();
          const getId = await knex("asnStatusTimeline")
            .where({ asn_id: id })
            .first();
          const updationDataIs = await functions.takeSnapShot(
            "asnStatusTimeline",
            getId.id
          );
          const insertIntoHistory = await knex("asnStatusTimeline")
            .where({ asn_id: id })
            .update({
              asn_id: id,
              MaterialReceived: statusChangerId,
              MaterialReceivedTime: timeStamp1,
              MaterialReceivedStatus: "Material Received",
            });
          if (insertIntoHistory.length <= 0) {
            return res.json({
              error: true,
              message: "failed to insert the history.",
              data: asnDetail,
            });
          }
          if (id) {
            const modifiedByTable3 = await functions.SetModifiedBy(
              req.headers["authorization"],
              "asnStatusTimeline",
              "asn_id",
              id
            );
            console.log("isUpdated:-", modifiedByTable3);
          }
          const timeline = await getTimeLine(id, type);

          return res.json({
            error: false,
            message: "Status changed and history created.",
            editable: 1,
            timeline: timeline,
            data: asnDetail,
          });
        } else {
          const asnDetail = await getData(id);
          const timeline = await getTimeLine(id, type);
          return res.json({
            error: true,
            message:
              "Invalid status changer for Stock Receive entry at warehouse status",
            timeline: timeline,
            data: asnDetail,
          });
        }

      case "materialReceived":
        if (statusChanger === "Quality Incharge") {
          const updationDataIs5 = await functions.takeSnapShot("asns", id);
          const updateStatus = await knex("asns")
            .where({ id: id })
            .update("status", "qualityApproved");

          if (updateStatus.length <= 0) {
            return res.json({
              error: true,
              message: "failed to update the status.",
            });
          }
          if (id) {
            const modifiedByTable1 = await functions.SetModifiedBy(
              req.headers["authorization"],
              "asns",
              "id",
              id
            );
            console.log("isUpdated:-", modifiedByTable1);
          }
          const asnDetail = await getData(id);

          const timeStamp2 = knex.fn.now();
          const getId = await knex("asnStatusTimeline")
            .where({ asn_id: id })
            .first();
          const updationDataIs = await functions.takeSnapShot(
            "asnStatusTimeline",
            getId.id
          );
          const insertIntoHistory = await knex("asnStatusTimeline")
            .where({ asn_id: id })
            .update({
              asn_id: id,
              QualityApproved: statusChangerId,
              QualityApprovedTime: timeStamp2,
              QualityApprovedStatus: "Quality Approved",
            });
          if (insertIntoHistory.length <= 0) {
            return res.json({
              error: true,
              message: "failed to insert the history.",

              data: asnDetail,
            });
          }
          if (asn_id) {
            const modifiedByTable = await functions.SetModifiedBy(
              req.headers["authorization"],
              "asnStatusTimeline",
              "asn_id",
              asn_id
            );
            const timeline = await getTimeLine(id, type);
          }

          return res.json({
            error: false,
            message: "Status changed and history created.",
            timeline: timeline,
            data: asnDetail,
          });
        } else if (statusChanger === "Accounts Executive") {
          const updationDataIs2 = await functions.takeSnapShot("asns", id);
          const updateStatus = await knex("asns")
            .where({ id: id })
            .update("status", "invoiced");

          if (updateStatus.length <= 0) {
            return res.json({
              error: true,
              message: "failed to update the status.",
            });
          }
          if (id) {
            const modifiedByTable2 = await functions.SetModifiedBy(
              req.headers["authorization"],
              "asns",
              "id",
              id
            );
            console.log("isUpdated:-", modifiedByTable2);
          }
          const asnDetail = await getData(id);

          const timeStamp3 = knex.fn.now();
          const getId = await knex("asnStatusTimeline")
            .where({ asn_id: id })
            .first();
          const updationDataIs = await functions.takeSnapShot(
            "asnStatusTimeline",
            getId.id
          );
          const insertIntoHistory = await knex("asnStatusTimeline")
            .where({ asn_id: id })
            .update({
              asn_id: id,
              Invoiced: statusChangerId,
              InvoicedTime: timeStamp3,
              InvoicedStatus: "Invoiced",
            });
          if (insertIntoHistory.length <= 0) {
            return res.json({
              error: true,
              message: "failed to insert the history.",
              data: asnDetail,
            });
          }
          if (id) {
            const modifiedByTable1 = await functions.SetModifiedBy(
              req.headers["authorization"],
              "asnStatusTimeline",
              "asn_id",
              id
            );
            console.log("isUpdated:-", modifiedByTable1);
          }
          const timeline = await getTimeLine(id, type);

          return res.json({
            error: false,
            message: "Status changed and history created.",
            timeline: timeline,
            data: asnDetail,
          });
        } else {
          const asnDetail = await getData(id);
          const timeline = await getTimeLine(id, type);
          return res.json({
            error: true,
            message: "Invalid status changer for Quality Check status",
            timeline: timeline,
            data: asnDetail,
          });
        }

      case "qualityApproved":
        if (statusChanger === "Accounts Executive") {
          const updationDataIs2 = await functions.takeSnapShot("asns", id);
          const updateStatus = await knex("asns")
            .where({ id: id })
            .update("status", "invoiced");

          if (updateStatus.length <= 0) {
            return res.json({
              error: true,
              message: "failed to update the status.",
            });
          }
          if (id) {
            const modifiedByTable7 = await functions.SetModifiedBy(
              req.headers["authorization"],
              "asns",
              "id",
              id
            );
            console.log("isUpdated:-", modifiedByTable7);
          }
          const asnDetail = await getData(id);

          const timeStamp3 = knex.fn.now();
          const getId = await knex("asnStatusTimeline")
            .where({ asn_id: id })
            .first();
          const updationDataIs = await functions.takeSnapShot(
            "asnStatusTimeline",
            getId.id
          );
          const insertIntoHistory = await knex("asnStatusTimeline")
            .where({ asn_id: id })
            .update({
              asn_id: id,
              Invoiced: statusChangerId,
              InvoicedTime: timeStamp3,
              InvoicedStatus: "Invoiced",
            });
          if (insertIntoHistory.length <= 0) {
            return res.json({
              error: true,
              message: "failed to insert the history.",
              data: asnDetail,
            });
          }
          if (id) {
            const modifiedByTable1 = await functions.SetModifiedBy(
              req.headers["authorization"],
              "asnStatusTimeline",
              "asn_id",
              id
            );
            console.log("isUpdated:-", modifiedByTable1);
          }
          const timeline = await getTimeLine(id, type);
          return res.json({
            error: false,
            message: "Status changed and history created.",
            timeline: timeline,
            data: asnDetail,
          });
        } else {
          const asnDetail = await getData(id);
          const timeline = await getTimeLine(id, type);
          return res.json({
            error: true,
            message: "Invalid status changer for Invoice status",
            timeline: timeline,
            data: asnDetail,
          });
        }

      case "requested":
        if (
          statusChanger === "Service Department User" &&
          departmentId == finalDepId
        ) {
          const updationDataIs4 = await functions.takeSnapShot("asns", id);
          const updateStatus = await knex("asns")
            .where({ id: id })
            .update("status", "accepted");

          if (updateStatus.length <= 0) {
            return res.json({
              error: true,
              message: "failed to update the status.",
            });
          }
          if (id) {
            const modifiedByTable3 = await functions.SetModifiedBy(
              req.headers["authorization"],
              "asns",
              "id",
              id
            );
            console.log("isUpdated:-", modifiedByTable3);
          }
          const asnDetail = await getData(id);

          //add timestamp for status
          const timeStamp = knex.fn.now();
          const getId = await knex("scrStatusTimeline")
            .where({ asn_id: id })
            .first();
          const updationDataIs = await functions.takeSnapShot(
            "scrStatusTimeline",
            getId.id
          );
          const insertIntoHistory = await knex("scrStatusTimeline")
            .update({
              asn_id: id,
              SDUid: departmentId,
              accepted: statusChangerId,
              acceptedTime: timeStamp,
              acceptedStatus: "Accepted",
            })
            .where("asn_id", id);
          if (insertIntoHistory.length <= 0) {
            return res.json({
              error: true,
              message: "failed to insert the history.",
              data: asnDetail,
            });
          }
          if (id) {
            const modifiedByTable1 = await functions.SetModifiedBy(
              req.headers["authorization"],
              "scrStatusTimeline",
              "asn_id",
              id
            );
            console.log("isUpdated:-", modifiedByTable1);
          }
          const timeline = await getTimeLine(id, type);

          return res.json({
            error: false,
            message: "Status changed and history created.",
            timeline: timeline,
            data: asnDetail,
          });
        } else {
          const asnDetail = await getData(id);
          const timeline = await getTimeLine(id, type);
          return res.json({
            error: true,
            message: "This department user cant change status requested.",
            timeline: timeline,
            data: asnDetail,
          });
        }

      case "accepted":
        if (statusChanger === "Accounts Executive") {
          const updationDataIs2 = await functions.takeSnapShot("asns", id);
          const updateStatus = await knex("asns")
            .where({ id: id })
            .update("status", "invoiced");

          if (updateStatus.length <= 0) {
            return res.json({
              error: true,
              message: "failed to update the status.",
            });
          }
          if (id) {
            const modifiedByTable2 = await functions.SetModifiedBy(
              req.headers["authorization"],
              "asns",
              "id",
              id
            );
            console.log("isUpdated:-", modifiedByTable2);
          }
          const asnDetail = await getData(id);

          //add timestamp for status
          const timeStamp = knex.fn.now();
          const getId = await knex("scrStatusTimeline")
            .where({ asn_id: id })
            .first();
          const updationDataIs = await functions.takeSnapShot(
            "scrStatusTimeline",
            getId.id
          );
          const insertIntoHistory = await knex("scrStatusTimeline")
            .where({ asn_id: id })
            .update({
              asn_id: id,
              Invoiced: statusChangerId,
              InvoicedTime: timeStamp,
              InvoicedStatus: "Invoiced",
            });
          if (insertIntoHistory.length <= 0) {
            return res.json({
              error: false,
              message: "failed to insert the history.",
              data: asnDetail,
            });
          }
          if (id) {
            const modifiedByTable1 = await functions.SetModifiedBy(
              req.headers["authorization"],
              "scrStatusTimeline",
              "asn_id",
              id
            );
            console.log("isUpdated:-", modifiedByTable1);
          }
          const timeline = await getTimeLine(id, type);
          return res.json({
            error: false,
            message: "Status changed and history created.",
            timeline: timeline,
            data: asnDetail,
          });
        } else {
          const asnDetail = await getData(id);
          const timeline = await getTimeLine(id, type);
          return res.json({
            error: false,
            message: "This department user cant change status accepted.",
            timeline: timeline,
            data: asnDetail,
          });
        }

      default:
        const asnDetail = await getData(id);
        const timeline = await getTimeLine(id, type);
        // Handle unknown checkShippedStatus
        return res.json({
          error: false,
          message: "You can't change status.",
          timeline: timeline,
          data: asnDetail,
        });
    }

    // switch (statusChanger) {
    //   case "Security Executive":
    //     if (checkShippedStatus[0].status === "materialShipped") {
    //       // Perform actions for Security Executi
    //       const updateStatus = await knex("asns")
    //         .where({ id: id })
    //         .update("status", "materialGateInward");

    //       if (updateStatus.length <= 0) {
    //         return res.json({
    //           error: true,
    //           message: "failed to update the status.",
    //         });
    //       }

    //       //add timestamp for status
    //       const timeStamp = knex.fn.now();
    //       const insertIntoHistory = await knex("asnStatusTimeline")
    //         .where({ id: id })
    //         .insert({
    //           asn_id: id,
    //           MaterialGateInward: statusChangerId,
    //           MGITime: timeStamp,
    //         });
    //       if (insertIntoHistory.length <= 0) {
    //         return res.json({
    //           error: true,
    //           message: "failed to insert the history.",
    //         });
    //       }

    //       return res.json({
    //         error: false,
    //         message: "Status changed and history created.",
    //       });
    //     } else {
    //       // Handle invalid status for Security Executive
    //       return res.json({
    //         error: true,
    //         message: "Invalid status for Security Executive",
    //       });
    //     }

    //   case "Store Keeper":
    //     if (checkShippedStatus[0].status === "materialGateInward") {
    //       // Perform actions for Store Keeper and materialGateInward status
    //       const updateStatus = await knex("asns")
    //         .where({ id: id })
    //         .update("status", "materialReceived");

    //       if (updateStatus.length <= 0) {
    //         return res.json({
    //           error: true,
    //           message: "failed to update the status.",
    //         });
    //       }

    //       const timeStamp1 = knex.fn.now();
    //       const insertIntoHistory = await knex("asnStatusTimeline")
    //         .where({ asn_id: id })
    //         .update({
    //           asn_id: id,
    //           MaterialReceived: statusChangerId,
    //           MaterialReceivedTime: timeStamp1,
    //         });
    //       if (insertIntoHistory.length <= 0) {
    //         return res.json({
    //           error: true,
    //           message: "failed to insert the history.",
    //         });
    //       }

    //       return res.json({
    //         error: false,
    //         message: "Status changed and history created.",
    //       });
    //     } else {
    //       // Handle invalid status for Store Keeper
    //       return res.json({
    //         error: true,
    //         message: "Invalid status for Store Keeper",
    //       });
    //     }

    //   case "Quality Incharge":
    //     if (checkShippedStatus[0].status === "materialReceived") {
    //       // Perform actions for Quality Incharge and materialReceived status
    //       const updateStatus = await knex("asns")
    //         .where({ id: id })
    //         .update("status", "qualityApproved");

    //       if (updateStatus.length <= 0) {
    //         return res.json({
    //           error: true,
    //           message: "failed to update the status.",
    //         });
    //       }

    //       const timeStamp2 = knex.fn.now();
    //       const insertIntoHistory = await knex("asnStatusTimeline")
    //         .where({ asn_id: id })
    //         .update({
    //           asn_id: id,
    //           QualityApproved: statusChangerId,
    //           QualityApprovedTime: timeStamp2,
    //         });
    //       if (insertIntoHistory.length <= 0) {
    //         return res.json({
    //           error: true,
    //           message: "failed to insert the history.",
    //         });
    //       }

    //       return res.json({
    //         error: false,
    //         message: "Status changed and history created.",
    //       });
    //     } else {
    //       // Handle invalid status for Quality Incharge
    //       return res.json({
    //         error: true,
    //         message: "Invalid status for Quality Incharge",
    //       });
    //     }

    //   case "Accounts Executive":
    //     if (
    //       checkShippedStatus[0].status === "qualityApproved" ||
    //       checkShippedStatus[0].status === "materialReceived"
    //     ) {
    //       // Perform actions for Accounts Executive and qualityApproved or materialReceived status
    //       const updateStatus = await knex("asns")
    //         .where({ id: id })
    //         .update("status", "invoiced");

    //       if (updateStatus.length <= 0) {
    //         return res.json({
    //           error: true,
    //           message: "failed to update the status.",
    //         });
    //       }

    //       const timeStamp3 = knex.fn.now();
    //       const insertIntoHistory = await knex("asnStatusTimeline")
    //         .where({ asn_id: id })
    //         .update({
    //           asn_id: id,
    //           Invoiced: statusChangerId,
    //           InvoicedTime: timeStamp3,
    //         });
    //       if (insertIntoHistory.length <= 0) {
    //         return res.json({
    //           error: true,
    //           message: "failed to insert the history.",
    //         });
    //       }

    //       return res.json({
    //         error: false,
    //         message: "Status changed and history created.",
    //       });
    //     } else {
    //       // Handle invalid status for Accounts Executive
    //       return res.json({
    //         error: true,
    //         message: "Invalid status for Accounts Executive",
    //       });
    //     }

    //   default:
    //     // Handle unknown statusChanger
    //     return res.json({ error: true, message: "Invalid status changer" });
    // }

    // if (
    //   statusChanger == "Security Executive" &&
    //   checkShippedStatus[0].status == "materialShipped"
    // ) {
    //   const updateStatus = await knex("asns")
    //     .where({ id: id })
    //     .update("status", "materialGateInward");

    //   if (updateStatus.length <= 0) {
    //     return res.json({
    //       error: true,
    //       message: "failed to update the status.",
    //     });
    //   }

    //   //add timestamp for status
    //   const timeStamp = knex.fn.now();
    //   const insertIntoHistory = await knex("asnStatusTimeline")
    //     .where({ id: id })
    //     .insert({
    //       asn_id: id,
    //       MaterialGateInward: statusChangerId,
    //       MGITime: timeStamp,
    //     });
    //   if (insertIntoHistory.length <= 0) {
    //     return res.json({
    //       error: true,
    //       message: "failed to insert the history.",
    //     });
    //   }

    //   return res.json({
    //     error: false,
    //     message: "Status changed and history created.",
    //   });
    // } else if (
    //   statusChanger == "Store Keeper" &&
    //   checkShippedStatus[0].status == "materialGateInward"
    // ) {
    //   const updateStatus = await knex("asns")
    //     .where({ id: id })
    //     .update("status", "materialReceived");

    //   if (updateStatus.length <= 0) {
    //     return res.json({
    //       error: true,
    //       message: "failed to update the status.",
    //     });
    //   }

    //   const timeStamp1 = knex.fn.now();
    //   const insertIntoHistory = await knex("asnStatusTimeline")
    //     .where({ asn_id: id })
    //     .update({
    //       asn_id: id,
    //       MaterialReceived: statusChangerId,
    //       MaterialReceivedTime: timeStamp1,
    //     });
    //   if (insertIntoHistory.length <= 0) {
    //     return res.json({
    //       error: true,
    //       message: "failed to insert the history.",
    //     });
    //   }

    //   return res.json({
    //     error: false,
    //     message: "Status changed and history created.",
    //   });
    // } else if (
    //   statusChanger == "Quality Incharge" &&
    //   checkShippedStatus[0].status == "materialReceived"
    // ) {
    //   const updateStatus = await knex("asns")
    //     .where({ id: id })
    //     .update("status", "qualityApproved");

    //   if (updateStatus.length <= 0) {
    //     return res.json({
    //       error: true,
    //       message: "failed to update the status.",
    //     });
    //   }

    //   const timeStamp2 = knex.fn.now();
    //   const insertIntoHistory = await knex("asnStatusTimeline")
    //     .where({ asn_id: id })
    //     .update({
    //       asn_id: id,
    //       QualityApproved: statusChangerId,
    //       QualityApprovedTime: timeStamp2,
    //     });
    //   if (insertIntoHistory.length <= 0) {
    //     return res.json({
    //       error: true,
    //       message: "failed to insert the history.",
    //     });
    //   }

    //   return res.json({
    //     error: false,
    //     message: "Status changed and history created.",
    //   });
    // } else if (
    //   (statusChanger == "Accounts Executive" &&
    //     checkShippedStatus[0].status == "qualityApproved") ||
    //   "materialReceived"
    // ) {
    //   const updateStatus = await knex("asns")
    //     .where({ id: id })
    //     .update("status", "invoiced");

    //   if (updateStatus.length <= 0) {
    //     return res.json({
    //       error: true,
    //       message: "failed to update the status.",
    //     });
    //   }

    //   const timeStamp3 = knex.fn.now();
    //   const insertIntoHistory = await knex("asnStatusTimeline")
    //     .where({ asn_id: id })
    //     .update({
    //       asn_id: id,
    //       Invoiced: statusChangerId,
    //       InvoicedTime: timeStamp3,
    //     });
    //   if (insertIntoHistory.length <= 0) {
    //     return res.json({
    //       error: true,
    //       message: "failed to insert the history.",
    //     });
    //   }

    //   return res.json({
    //     error: false,
    //     message: "Status changed and history created.",
    //   });
    // }

    // return res.json({
    //   error: true,
    //   message: "Asn status is up to date.",
    // });
  } catch (error) {
    return res.json({
      error: true,
      message: error.message,
    });
  }
};
//     const { jwtConfig } = constant;
//     const payload = jwt.decode(token.split(" ")[1], jwtConfig.secret);
//     const statusChanger = payload.permissions[0];
//     const statusChangerId = payload.id;
//     // const userDepId=payload

//     //getting user dept id
//     const userDepid = await knex("users")
//       .where({ id: statusChangerId })
//       .select("approverofdept");
//     const finalDepId = userDepid[0].approverofdept;
//     console.log("this is dept id of user", userDepid[0].approverofdept);

//     if (userDepid.length <= 0) {
//       return res
//         .json({
//           error: true,
//           message: "department id of user not found",
//         })
//         .end();
//     }

//     const schema = Joi.object({
//       text: Joi.string().required(),
//     });

//     const { error, value } = schema.validate(req.body);
//     if (error) {
//       return res.json({
//         error: true,
//         message: error.details[0].message,
//       });
//     }
//     const { text } = value;

//     let obj;
//     try {
//       const secret = constant.jwtConfig.secret;

//       const decryptedData = CryptoJS.AES.decrypt(text, secret).toString(
//         CryptoJS.enc.Utf8
//       );

//       eval("obj = " + decryptedData);
//       console.log(obj);
//     } catch (error) {
//       return res.json({
//         error: true,
//         message: "Wrong QRCode.",
//       });
//     }

//     const { id, departmentId } = obj;
//     console.log("dep id", departmentId);
//     if (departmentId != finalDepId) {
//       return res
//         .json({
//           error: true,
//           message: "Department does not match",
//         })
//         .end();
//     }

//     const checkReqStatus = await knex("asns")
//       .where({ id: id })
//       .select("status");

//     if (checkReqStatus.length <= 0) {
//       return res.json({
//         error: true,
//         message: "SCR does not exist.",
//       });
//     }
//     console.log("status changer", statusChanger);
//     switch (checkReqStatus[0].status) {
//       case "requested":
//         if (
//           statusChanger === "Service Department User" &&
//           departmentId == finalDepId
//         ) {
//           const updateStatus = await knex("asns")
//             .where({ id: id })
//             .update("status", "accepted");

//           if (updateStatus.length <= 0) {
//             return res.json({
//               error: true,
//               message: "failed to update the status.",
//             });
//           }

//           //add timestamp for status
//           const timeStamp = knex.fn.now();
//           const insertIntoHistory = await knex("scrStatusTimeline")
//             .where({ asn_id: id })
//             .insert({
//               asn_id: id,
//               SDUid: departmentId,
//               accepted: statusChangerId,
//               acceptedStatus: "accepted",
//               AcceptedTime: timeStamp,
//             });
//           if (insertIntoHistory.length <= 0) {
//             return res.json({
//               error: true,
//               message: "failed to insert the history.",
//             });
//           }

//           return res.json({
//             error: false,
//             message: "Status changed and history created.",
//           });
//         } else {
//           return res.json({
//             error: true,
//             message: "This department user cant change status",
//           });
//         }

//       case "accepted":
//         if (statusChanger === "Accounts Executive") {
//           const updateStatus = await knex("asns")
//             .where({ id: id })
//             .update("status", "invoiced");

//           if (updateStatus.length <= 0) {
//             return res.json({
//               error: true,
//               message: "failed to update the status.",
//             });
//           }

//           //add timestamp for status
//           const timeStamp = knex.fn.now();
//           const insertIntoHistory = await knex("scrStatusTimeline")
//             .where({ asn_id: id })
//             .update({
//               asn_id: id,
//               invoiced: statusChangerId,
//               invoicedStatus: "invoiced",
//               invoicedTime: timeStamp,
//             });
//           if (insertIntoHistory.length <= 0) {
//             return res.json({
//               error: true,
//               message: "failed to insert the history.",
//             });
//           }

//           return res.json({
//             error: false,
//             message: "Status changed and history created.",
//           });
//         } else {
//           return res.json({
//             error: true,
//             message: "Invalid status changer for materialInward status",
//           });
//         }

//       default:
//         // Handle unknown checkShippedStatus
//         return res.json({ error: true, message: "Invalid checkShippedStatus" });
//     }
//   } catch (error) {
//     return res
//       .json({
//         error: true,
//         message: "something went wrong",
//       })
//       .end();
//   }
// };

const asnMaterialReceived = async (req, res) => {
  try {
    const token = req.headers["authorization"];
    if (!token) {
      return res.json({
        error: true,
        message: "Token is required.",
      });
    }

    const { jwtConfig } = constant;
    const payload = jwt.decode(token.split(" ")[1], jwtConfig.secret);
    const statusChangerId = payload.id;

    const { error, value } = validation.materialReceived(req.body);

    if (error) {
      return res.json({
        error: true,
        message: error.details[0].message,
      });
    }

    const {
      poNo,
      poDate,
      asnNo,
      plantId,
      supplierId,
      deliveryDate,
      type,
      carrier,
      lineItems,
      status,
      gst,
      pan,
      irnNo,
      gstInvoiceNumber,
      shipToAddress,
      billToAddress,
      remarks,
      file,
      eWayBillNo,
      departmentId,
    } = value.qrdata;

    if (type == "ZSER") {
      status = "requested";
      const asnNo2 = asnNo.replace(/^.{3}/, "SCR");
      asnNo = asnNo2;
      let Obj = [];
      let li = [];
      lineItems.map((item) => {
        const serviceName = item.itemName;
        delete lineItems[0]["itemName"];
        li.push({ serviceName: serviceName, ...lineItems[0] });
      });
      lineItems = [];
      lineItems = li;

      //if you want to not show blank fields
      // lineItems.map((item) => {
      //   Obj.push(Object.keys(item));
      // });
      // Obj.forEach((item, index) => {
      //   item.map((value, ind) => {
      //     // if (lineItems[index][value] == "") {
      //     //   delete lineItems[index][value];
      //     // }
      //   });
      // });
    }

    let currentPOqty = 0;
    const totalPOqty = 1100; //to do : total purchase order qty will come here

    for (const iterator of lineItems) {
      currentPOqty += iterator.orderQuantity;
    }

    // if (currentPOqty != totalPOqty) {
    //   return res.status(400).json({
    //     error: true,
    //     message:
    //       "Total PO quantity should be equal to the sum of order quantities",
    //   });
    // }

    const lineItemsValue = JSON.stringify(lineItems);

    const todaysDate = new Date().getDate() + "";
    const todaysMonth = new Date().getMonth() + 1 + "";
    const todaysYear = new Date().getFullYear() + "";

    const currentDate = new Date(
      stringToDate(todaysDate + "-" + todaysMonth + "-" + todaysYear)
    );

    const deliveryDateIs = new Date(stringToDate(deliveryDate));

    // console.log(currentDate, deliveryDateIs);

    if (deliveryDateIs < currentDate) {
      return res.json({
        error: true,
        message: "Delivery date should not be less than current date",
      });
    }

    const checkDeptId = await knex("departments")
      .where("id", departmentId)
      .first();

    if (checkDeptId == undefined) {
      return res.json({
        error: true,
        message: "Department not found",
      });
    }

    const insertASN = await knex("asnMaterialReceived").insert({
      poNo,
      poDate,
      asnNo,
      plantId,
      supplierId,
      deliveryDate,
      type,
      carrier,
      lineItems: lineItemsValue,
      status,
      gst,
      pan,
      irnNo,
      gstInvoiceNumber,
      shipToAddress,
      billToAddress,
      remarks,
      file,
      eWayBillNo,
      departmentId,
      remarks,
      // MaterialGateInwardRemarks,
      // MaterialReceivedRemarks,
      // QualityApprovedRemarks,
      // InvoicedRemarks,
    });
    if (!insertASN) {
      return res.json({
        error: true,
        message: "ASN could not submited",
      });
    }

    return res.json({
      error: false,
      message: "ASN submitted successfully and timeline created.",
      data: insertASN,
    });
  } catch (error) {
    return res.json({
      error: true,
      message: "Something went wrong",
      data: JSON.stringify(error),
    });
  }
};

const scannerHistory = async (req, res) => {
  try {
    const token = req.headers["authorization"];
    if (!token) {
      return res.json({
        error: true,
        message: "Token is required.",
      });
    }
    const { jwtConfig } = constant;
    const payload = jwt.decode(token.split(" ")[1], jwtConfig.secret);
    const statusChanger = payload.permissions[0];
    const statusChangerId = payload.id;

    const { search } = req.body;

    let rows = [];

    switch (statusChanger) {
      case "Security Executive":
        rows = await knex("asnStatusTimeline")
          .where("MaterialGateInward", statusChangerId)
          .select(
            `asns.asnNo`,
            "MGITime as Time",
            "MaterialGateInwardStatus as Status",
            "MaterialGateInwardRemarks as Remarks"
          )
          .leftJoin("asns", "asns.id", "=", "asnStatusTimeline.asn_id");
        break;

      case "Store Keeper":
        rows = await knex("asnStatusTimeline")
          .where("MaterialReceived", statusChangerId)
          .select(
            `asns.asnNo`,
            "MaterialReceivedTime as Time",
            "MaterialReceivedStatus as Status"
          )
          .leftJoin("asns", "asns.id", "=", "asnStatusTimeline.asn_id");
        break;

      case "Quality Incharge":
        rows = await knex("asnStatusTimeline")
          .where("QualityApproved", statusChangerId)
          .select(
            `asns.asnNo`,
            "QualityApprovedTime as Time",
            "QualityApprovedStatus as Status"
          )
          .leftJoin("asns", "asns.id", "=", "asnStatusTimeline.asn_id");
        break;

      case "Accounts Executive":
        rows = await knex("asnStatusTimeline")
          .where("Invoiced", statusChangerId)
          .select(
            `asns.asnNo`,
            "InvoicedTime as Time",
            "InvoicedStatus as Status"
          )
          .leftJoin("asns", "asns.id", "=", "asnStatusTimeline.asn_id");
        rows = await knex("scrStatusTimeline")
          .where("Invoiced", statusChangerId)
          .select(
            `asns.asnNo`,
            "InvoicedTime as Time",
            "InvoicedStatus as Status"
          )
          .leftJoin("asns", "asns.id", "=", "scrStatusTimeline.asn_id");
        let temp = rows.slice().sort((a, b) => a.InvoicedTime - b.InvoicedTime);
        rows = [];
        rows = temp;
        break;

      case "Service Department User":
        rows = await knex("scrStatusTimeline")
          .where("accepted", statusChangerId)
          .select(
            `asns.asnNo`,
            "acceptedTime as Time",
            "acceptedStatus as Status"
            //"MaterialGateInwardRemarks"
          )
          .leftJoin("asns", "asns.id", "=", "scrStatusTimeline.asn_id");
        break;

      default:
        break;
    }

    return res.json({
      error: false,
      message: "Data fetched successfully.",
      data: rows,
    });
  } catch (error) {
    return res.json({
      error: true,
      message: error.message,
    });
  }
};
const delteMultipleRecords=async(req,res)=>{
  try {
    const tableName = "asns";
    const { ids } = req.body;
  
    const result = await functions.bulkDeleteRecords(tableName, ids, req);
  
    if (result.error) {
      return res.json({
        error: true,
        message: "Failed to delete one or more records",
        errors: result.errors,
        deltedIds:result.messages,
      });
    }
  
    return res.json({
      error: false,
      message: "Deleted all selected records successfully",
      errors: result.errors,
    });
  
    } catch (error) {
      return res.json({
        error: true,
        message: "Something went wrong",
        data: JSON.stringify(error),
      });
    }
}

export default {
  createAsn3,
  viewAsn2,
  updateAsn2,
  deleteAsn2,
  PaginateAsn2,
  QRCodeAsn,
  checkQRCode,
  asnStatusChange,
  asnPaymentStatusUpdate,
  viewAsnStatusHistory,
  viewAsnCurrentStatus,
  workFlowStatus,
  getQRCode,
  scannerHistory,
  //changeScrStatus,
  // viewAsn3,
  asnMaterialReceived,
  delteMultipleRecords
};
