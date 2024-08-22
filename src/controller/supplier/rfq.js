import knex from "../../config/mysql_db.js";
import s3 from "../../../src/s3/s3.js";
import { json } from "express";
import validation from "../../validation/supplier/rfq.js";
import moment from "moment";
import subscriber from "../admin/subscriber.js";
import functions from "../../helpers/functions.js";
import constants from "../../helpers/constants.js";
import logs from "../../middleware/logs.js";
import ses from "../../helpers/ses.js";

const generateCode = async (table, idColumn, prefix) => {
  try {
    const row = await knex(table).orderBy(idColumn, "desc").first(idColumn);
    let lastId = 0;
    if (row && row[idColumn]) {
      const parts = row[idColumn].split(prefix);
      lastId = parseInt(parts[1]);
    }
    const count = lastId + 1;
    return `${prefix}${String(count).padStart(6, "0")}`;
  } catch (err) {
    console.error(err);
    throw new Error(err.message);
  }
};

// const createRfq = async (req, res) => {
//   try {
//     const { pr_id } = req.body;

//     const checkPR = await knex("purchase_requisitions")
//       .select("*")
//       .where({ id: pr_id })
//       .first();

//     if (!checkPR) {
//       return res.status(404).json({
//         error: true,
//         message: "Purchase requisition not found.",
//       });
//     }

//     if (checkPR.status !== "approved") {
//       return res.status(400).json({
//         error: true,
//         message: "You can only create an RFQ from an approved PR.",
//       });
//     }

//     const rfqData = {
//       ...req.body,
//       purchase_group_id: checkPR.purchase_grp_id,
//       purchase_org_id: checkPR.purchase_org_id,
//       delivery_date: checkPR.delivery_date,
//       plant_id: checkPR.plant_id,
//       storage_loc_id: checkPR.stor_loc_id,
//       vendor: [],
//     };
//     Object.keys(req.body).forEach((key) => {
//       const match = key.match(/^vendor\[(\d+)\]$/);

//       if (match) {
//         const index = parseInt(match[1], 10);
//         rfqData.vendor[index] = req.body[key];
//         delete rfqData[key];
//       }
//     });

//     const { error, value } = validation.createRfq(rfqData);

//     if (error) {
//       return res.status(400).json({
//         error: true,
//         message: error.details[0].message,
//       });
//     }
//     try {
//       await functions.checkForeignId("languages", value.language_id);
//       await functions.checkForeignId("item_categories", value.item_category_id);
//       await functions.checkForeignId(
//         "purchase_groups",
//         value.purchase_group_id
//       );
//     } catch (error) {
//       return res.status(422).json({
//         error: true,
//         message: `${error.message}`,
//       });
//     }
//     const rfq_no = await generateCode(
//       "request_for_quotations",
//       "rfq_no",
//       "RFQ"
//     );
//     let attachmentFileName;
//     let uploadParams = {};

//     if (req.files?.attachment) {
//       const attachment = req.files.attachment;
//       const allowedFileTypes = ["jpg", "png", "pdf", "jpeg"];
//       const fileExtension = attachment.name.split(".").pop().toLowerCase();

//       if (!allowedFileTypes.includes(fileExtension)) {
//         return res.status(400).json({
//           error: true,
//           message: "Only jpg, png, pdf, and jpeg file formats are allowed",
//         });
//       }

//       attachmentFileName = `${Date.now()}-${attachment.name}`;
//       uploadParams = {
//         Bucket: constants.s3Creds.bucket,
//         Key: `rfq/${attachmentFileName}`,
//         Body: attachment.data,
//       };

//       const uploadResult = await functions.uploadToS3(uploadParams);
//       if (uploadResult.error) {
//         throw new Error(uploadResult.message);
//       }
//     }
//     const [insertedId] = await knex("request_for_quotations").insert({
//       ...value,
//       vendor: JSON.stringify(value.vendor),
//       rfq_no,
//       attachment: uploadParams?.Key,
//     });
//     const vendorDetails = await knex("supplier_details")
//       .whereIn("id", value.vendor)
//       .select("emailID", "supplier_name");
//     // Send email to each vendor

//     const data = await knex("request_for_quotations")
//       .where("id", insertedId)
//       .first();
//     if (!data) {
//       return res.status(500).json({
//         error: true,
//         message: "Unable to create record",
//       });
//     }
//     const itemCategory = await knex("item_categories")
//       .where("id", data.item_category_id)
//       .first();

//     // Fetch plant name based on plant ID
//     const plant = await knex("plants").where("id", data.plant_id).first();
//     for (const { emailID, supplier_name } of vendorDetails) {
//       console.log(emailID, supplier_name);

//       const emailContent = `<br><br>
//         Hello ${supplier_name},<br>
//         <br>
//         We are pleased to invite you to submit a quotation for the following RFQ.<br>
//         <br>
//         <strong>RFQ Details:</strong><br>
//         <ul>
//           <li><strong>RFQ Type :</strong> ${data.rfq_type}</li>
//           <li><strong>RFQ No. :</strong> ${data.rfq_no}</li>
//           <li><strong>Date Issued :</strong> ${moment(data.rfq_date).format(
//             "DD MMM YYYY"
//           )}</li>
//           <li><strong>Deadline for Submission :</strong> ${moment(
//             data.deadline
//           ).format("DD MMM YYYY")}</li>
//           <li><strong>Delivery Date :</strong> ${moment(
//             data.delivery_date
//           ).format("DD MMM YYYY")}</li>
//           <li><strong>Item Category :</strong> ${itemCategory.name}</li>
//           <li><strong>Plant Location :</strong> ${plant.name}</li>
//         </ul>
//         <p>
//         Please review the RFQ and submit your quotation by the deadline. Feel free to contact us if you have any questions or need further information.</p>
//     `;

//       // Generate the email body
//       const emailBody = functions.generateEmailBody(emailContent);

//       // Send the email
//       //   ses.sendEmail(
//       //     constants.sesCredentials.fromEmails.emailOtp,
//       //     emailID,
//       //     `Request for Quotation (RFQ) Submission - ${data.rfq_type} ${data.rfq_no}`,
//       //     emailBody
//       //   );
//     }
//     return res.status(200).json({
//       error: false,
//       message: "RFQ created successfully",
//       data: data,
//     });
//   } catch (error) {
//     console.error("Error occurred:", error);
//     return res.status(500).json({
//       error: true,
//       message: "Could not create record.",
//       data: error.message,
//     });
//   }
// };

const updateRfq = async (req, res) => {
  try {
    const rfqData = {
      ...req.body,
      vendor: [],
    };
    Object.keys(req.body).forEach((key) => {
      const match = key.match(/^vendor\[(\d+)\]$/);

      if (match) {
        const index = parseInt(match[1], 10);
        rfqData.vendor[index] = req.body[key];
        delete rfqData[key];
      }
    });
    const tableName = "request_for_quotations";
    const { error, value } = validation.updateRfq(rfqData);
    if (error) {
      return res.status(422).json({
        error: true,
        message: "Invalid Input(s).",
        details: error.details.map((err) => err.message),
      });
    }
    try {
      await functions.checkForeignId("purchase_requisitions", value.pr_id);
      await functions.checkForeignId("languages", value.language_id);
      await functions.checkForeignId("item_categories", value.item_category_id);
      await functions.checkForeignId(
        "purchase_groups",
        value.purchase_group_id
      );
      if (value.purchase_org_id) {
        const check = await knex("purchase_organization")
          .select("purchase_group_id")
          .where("id", value.purchase_org_id)
          .first();
        if (check) {
          if (value.purchase_group_id !== check.purchase_group_id) {
            return res.status(400).json({
              error: true,
              message:
                "Please select purchase organization of given purchase group.",
            });
          }
        }
        await functions.checkForeignId(
          "purchase_organization",
          value.purchase_org_id
        );
      }
    } catch (error) {
      return res.status(422).json({
        error: true,
        message: `${error.message}`,
      });
    }

    let attachmentFileName;
    let uploadParams = {};
    if (req.files && req.files.attachment) {
      const attachment = req.files.attachment;
      const allowedFileTypes = ["jpg", "png", "pdf", "jpeg"];
      const fileExtension = attachment.name.split(".").pop().toLowerCase();

      if (!allowedFileTypes.includes(fileExtension)) {
        return res.json({
          error: true,
          message: "Only jpg, png, pdf, and jpeg file formats are allowed",
          data: [],
        });
      }
      attachmentFileName = new Date().getTime() + "-" + attachment.name;

      // Upload attachment to S3
      uploadParams = {
        Bucket: constants.s3Creds.bucket,
        Key: "rfq/" + attachmentFileName,
        Body: attachment.data,
      };

      const uploadResult = await functions.uploadToS3(uploadParams);
      if (uploadResult.error) {
        throw new Error(uploadResult.message);
      }
    }
    value.attachment = uploadParams.Key;
    (value.vendor = JSON.stringify(value.vendor)), console.log(value);
    const { id, ...updateData } = value;

    const updationDataIs = await functions.takeSnapShot(
      "request_for_quotations",
      id
    );

    try {
      await logs.logOldValues(tableName, id, value, req);
    } catch {
      console.log(error);
    }

    const updatedCount = await knex("request_for_quotations")
      .where("id", id)
      .update(updateData);

    if (updatedCount === 0) {
      return res.status(404).json({
        error: true,
        message: "Record not found",
      });
    }
    if (id) {
      const modifiedByTable1 = await functions.SetModifiedBy(
        req.headers["authorization"],
        "request_for_quotations",
        "id",
        id
      );
      console.log("isUpdated:-", modifiedByTable1);
    }
    const updatedRecord = await knex("request_for_quotations")
      .where("id", id)
      .first();

    return res.status(200).json({
      error: false,
      message: "RFQ updated successfully",
      data: updatedRecord,
    });
  } catch (error) {
    console.error("Error occurred:", error);
    return res.status(500).json({
      error: true,
      message: "Could not update record.",
      data: error.message,
    });
  }
};

const deleteRfq = async (req, res) => {
  try {
    const tableName = "request_for_quotations";
    const { error } = validation.deleteRfq(req.params);
    if (error) {
      return res.status(422).json({
        error: true,
        message: "Invalid Input(s).",
        details: error.details.map((err) => err.message),
      });
    }

    const { id } = req.params;

    try {
      await logs.logOldValues(tableName, id, value, req);
    } catch {
      console.log(error);
    }

    const deletedCount = await knex("request_for_quotations")
      .where("id", id)
      .update('isDeleted', 1); 

    if (deletedCount === 0) {
      return res.status(404).json({
        error: true,
        message: "Record not found.",
        data: [],
      });
    }

    return res.status(200).json({
      error: false,
      message: "RFQ deleted successfully",
    });
  } catch (error) {
    console.error("Error occurred:", error);
    return res.status(500).json({
      error: true,
      message: "Could not delete record.",
      data: [],
    });
  }
};

function applyDateFilter(rows, filter, tableName) {
  if (!filter || !filter.startDate || !filter.endDate || !filter.dateField) {
    return rows; // Return rows unchanged if filter parameters are missing
  }
  if (filter) {
    const { startDate, endDate, dateField } = filter;
    if (startDate && endDate && dateField) {
      const startDateISO = new Date(startDate).toISOString();
      const endDateISO = new Date(endDate + "T23:59:59.999Z").toISOString();
      rows.whereBetween(`${tableName}.${dateField}`, [
        startDateISO,
        endDateISO,
      ]);
    }
  }
  return rows;
}

const paginateRfq = async (req, res) => {
  try {
    const tableName = "request_for_quotations";
    const searchFrom = [
      "pr_no",
      "rfq_no",
      "plants.name",
      "purchase_organization.description",
      "purchase_groups.name",
      "item_categories.name",
      "purchase_requisitions.pr_type",
    ];
    const { error, value } = validation.paginateRfq(req.body);
    if (error) {
      return res.status(422).json({
        error: true,
        message: "Field error.",
        data: error,
      });
    }
    let { offset, limit, order, sort, search, id } = value;

    let rows = knex(tableName)
      .select(
        "request_for_quotations.*",
        "purchase_requisitions.id as pr_id",
        "purchase_requisitions.pr_no as pr_no",
        "languages.id as language_id",
        "languages.name as language_name",
        "item_categories.id as item_category_id",
        "item_categories.name as item_name",
        "plants.name as plant",
        "storage_locations.name as storage_location",
        "purchase_organization.description as purchase_organization",
        "purchase_groups.name as purchase_group"
      )
      .leftJoin(`plants`, `${tableName}.plant_id`, `plants.id`)
      .leftJoin(
        `storage_locations`,
        `${tableName}.storage_loc_id`,
        `storage_locations.id`
      )
      .leftJoin(
        `purchase_organization`,
        `${tableName}.purchase_org_id`,
        `purchase_organization.id`
      )
      .leftJoin(
        `purchase_groups`,
        `${tableName}.purchase_group_id`,
        `purchase_groups.id`
      )
      .leftJoin(
        "purchase_requisitions",
        "request_for_quotations.pr_id",
        "purchase_requisitions.id"
      )
      .leftJoin(
        "languages",
        "request_for_quotations.language_id",
        "languages.id"
      )
      .leftJoin(
        "item_categories",
        "request_for_quotations.item_category_id",
        "item_categories.id"
      );

    if (id != "" && id != undefined) {
      rows = rows.where({ "request_for_quotations.id": id });
    }

    if (search != undefined && search != "") {
      rows = rows.where(function () {
        searchFrom.forEach((element) => {
          this.orWhereILike(element, `%${search}%`);
        });
      });
    }
    const { startDate, endDate, dateField } = req.query;

    // Create a filter object
    const filter = {
      startDate,
      endDate,
      dateField,
    };
    rows = applyDateFilter(rows, filter, tableName);
    const total = await rows
      .clone()
      //  knex(tableName)
      .count("request_for_quotations.id as total")
      .first();

    rows = rows.orderBy(sort, order).limit(limit).offset(offset);
    rows = await rows;

    let sr;
    // let data_rows = [];
    if (order === "desc") {
      sr = offset + 1;
    } else {
      sr = total.total - limit * offset;
    }
    const data_rows = await Promise.all(
      rows.map(async (row) => {
        if (
          row.attachment !== undefined &&
          row.attachment !== null &&
          row.attachment !== ""
        ) {
          const imageBucket = process.env.S3_BUCKET;
          const imageKey = row.attachment;
          const expirationInSeconds = 3600;
          row.attachment = await functions.generatePresignedUrl(
            imageBucket,
            imageKey,
            expirationInSeconds
          );
        }
        row.pr_no = {
          id: row.pr_id,
          name: row.pr_no,
        };
        row.langauge = {
          id: row.language_id,
          name: row.language_name,
        };
        row.item_category = {
          id: row.item_category_id,
          name: row.item_name,
        };
        row.rfq_date = moment(row.rfq_date).format("YYYY-MM-DD");
        row.deadline = moment(row.deadline).format("YYYY-MM-DD");
        delete row.created_at;
        delete row.updated_at;
        const Delete = [
          "pr_id",
          "language_id",
          "language_name",
          "item_name",
          "item_category_id",
          "req_tracking_no",
          "subscriber_id",
          "description",
        ];

        for (const key of Delete) {
          delete row[key];
        }
        row.sr = sr;
        if (order === "desc") {
          sr++;
        } else {
          sr--;
        }
        return row;
        // data_rows.push(row);
      })
    );

    res.status(200).json({
      error: false,
      message: "Retrieved successfully.",
      data: {
        count: total.total,
        rows: data_rows,
      },
    });
  } catch (error) {
    res.status(503).json({
      error: true,
      message: "Something went wrong",
      data: error.message,
    });
  }
};

const viewRfq = async (req, res) => {
  try {
    const tableName = "request_for_quotations";
    const { id } = req.params;

    // Retrieve the RFQ record by ID
    const rfq = await knex(tableName)
      .select(
        "request_for_quotations.*",
        "purchase_requisitions.id as pr_id",
        "purchase_requisitions.pr_no as pr_no",
        "languages.id as language_id",
        "languages.name as language_name",
        "item_categories.id as item_category_id",
        "item_categories.name as item_name",
        "plants.name as plant",
        "storage_locations.name as storage_location",
        "purchase_organization.description as purchase_organization",
        "purchase_groups.name as purchase_group"
      )
      .leftJoin(`plants`, `${tableName}.plant_id`, `plants.id`)
      .leftJoin(
        `storage_locations`,
        `${tableName}.storage_loc_id`,
        `storage_locations.id`
      )
      .leftJoin(
        `purchase_organization`,
        `${tableName}.purchase_org_id`,
        `purchase_organization.id`
      )
      .leftJoin(
        `purchase_groups`,
        `${tableName}.purchase_group_id`,
        `purchase_groups.id`
      )
      .leftJoin(
        "purchase_requisitions",
        "request_for_quotations.pr_id",
        "purchase_requisitions.id"
      )
      .leftJoin(
        "languages",
        "request_for_quotations.language_id",
        "languages.id"
      )
      .leftJoin(
        "item_categories",
        "request_for_quotations.item_category_id",
        "item_categories.id"
      )
      .where("request_for_quotations.id", id)
      .first();

    if (!rfq) {
      return res.status(404).json({
        error: true,
        message: "RFQ not found",
      });
    }

    // Format dates and prepare response data
    if (
      rfq.attachment !== undefined &&
      rfq.attachment !== null &&
      rfq.attachment !== ""
    ) {
      const imageBucket = process.env.S3_BUCKET;
      const imageKey = rfq.attachment;
      const expirationInSeconds = 3600;
      rfq.attachment = await functions.generatePresignedUrl(
        imageBucket,
        imageKey,
        expirationInSeconds
      );
    }
    rfq.pr_no = {
      id: rfq.pr_id,
      name: rfq.pr_no,
    };
    rfq.langauge = {
      id: rfq.language_id,
      name: rfq.language_name,
    };
    rfq.item_category = {
      id: rfq.item_category_id,
      name: rfq.item_name,
    };
    rfq.rfq_date = moment(rfq.rfq_date).format("YYYY-MM-DD");
    rfq.deadline = moment(rfq.deadline).format("YYYY-MM-DD");
    delete rfq.created_at;
    delete rfq.updated_at;
    delete rfq.pr_id;
    delete rfq.language_id;
    delete rfq.language_name;
    delete rfq.item_category_id;
    delete rfq.item_name;
    delete rfq.subscriber_id;

    res.status(200).json({
      error: false,
      message: "RFQ retrieved successfully",
      data: rfq,
    });
  } catch (error) {
    console.error("Error occurred:", error);
    return res.status(500).json({
      error: true,
      message: "Internal Server Error",
    });
  }
};

const fileUploadInRfq = async (req, res) => {
  try {
    const { id, file } = req.body;

    const filePath = req.files.file;
    const timestamp = Date.now(); // Generate a timestamp
    const originalFileName = req.files.file.name;
    const fileName = `${timestamp}_${originalFileName}`;
    const uploadFile = await s3.recieveAndUpload(filePath, fileName);

    const updationDataIs = await functions.takeSnapShot(
      "request_for_quotations",
      id
    );

    const fileInsert = await knex("request_for_quotations")
      .update({
        file: uploadFile.Location,
      })
      .where("id", id);
    if (!fileInsert) {
      return res.json({
        error: true,
        message: "File upload failed",
      });
    }
    if (id) {
      const modifiedByTable1 = await functions.SetModifiedBy(
        req.headers["authorization"],
        "request_for_quotations",
        "id",
        id
      );
      console.log("isUpdated:-", modifiedByTable1);
    }
    return res.json({
      error: false,
      message: "File upload done!",
      data: uploadFile.Location,
    });
  } catch (error) {
    return res.json({
      error: true,
      message: "Something went wrong",
      data: JSON.stringify(error),
    });
  }
};

const delteMultipleRecords = async (req, res) => {
  try {
    const tableName = "request_for_quotations";
    const { ids } = req.body;

    const result = await functions.bulkDeleteRecords(tableName, ids, req);

    if (result.error) {
      return res.json({
        error: true,
        message: "Failed to delete one or more records",
        errors: result.errors,
        deltedIds: result.messages,
      });
    }

    return res.status(200).json({
      error: false,
      message: "Deleted all selected records successfully",
      errors: result.errors,
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: "could not delete record(s).",
      data: JSON.stringify(error.message),
    });
  }
};

const createRfq = async (req, res) => {
  try {
    const { pr_id } = req.body;

    const checkPR = await knex("purchase_requisitions")
      .select("*")
      .where({ id: pr_id })
      .first();

    if (!checkPR) {
      return res.status(404).json({
        error: true,
        message: "Purchase requisition not found.",
      });
    }

    if (checkPR.status !== "approved") {
      return res.status(400).json({
        error: true,
        message: "You can only create an RFQ from an approved PR.",
      });
    }

    const rfqData = {
      ...req.body,
      purchase_group_id: checkPR.purchase_grp_id,
      purchase_org_id: checkPR.purchase_org_id,
      delivery_date: checkPR.delivery_date,
      plant_id: checkPR.plant_id,
      storage_loc_id: checkPR.stor_loc_id,
      vendor: [],
    };
    Object.keys(req.body).forEach((key) => {
      const match = key.match(/^vendor\[(\d+)\]$/);

      if (match) {
        const index = parseInt(match[1], 10);
        rfqData.vendor[index] = req.body[key];
        delete rfqData[key];
      }
    });

    const { error, value } = validation.createRfq(rfqData);

    if (error) {
      return res.status(400).json({
        error: true,
        message: error.details[0].message,
      });
    }
    try {
      await functions.checkForeignId("languages", value.language_id);
      await functions.checkForeignId("item_categories", value.item_category_id);
      await functions.checkForeignId(
        "purchase_groups",
        value.purchase_group_id
      );
    } catch (error) {
      return res.status(422).json({
        error: true,
        message: `${error.message}`,
      });
    }
    const rfq_no = await generateCode(
      "request_for_quotations",
      "rfq_no",
      "RFQ"
    );
    let attachmentFileName;
    let uploadParams = {};

    if (req.files?.attachment) {
      const attachment = req.files.attachment;
      const allowedFileTypes = ["jpg", "png", "pdf", "jpeg"];
      const fileExtension = attachment.name.split(".").pop().toLowerCase();

      if (!allowedFileTypes.includes(fileExtension)) {
        return res.status(400).json({
          error: true,
          message: "Only jpg, png, pdf, and jpeg file formats are allowed",
        });
      }

      attachmentFileName = `${Date.now()}-${attachment.name}`;
      uploadParams = {
        Bucket: constants.s3Creds.bucket,
        Key: `rfq/${attachmentFileName}`,
        Body: attachment.data,
      };

      const uploadResult = await functions.uploadToS3(uploadParams);
      if (uploadResult.error) {
        throw new Error(uploadResult.message);
      }
    }
    const [insertedId] = await knex("request_for_quotations").insert({
      rfq_type :value.rfq_type,
      pr_id : value.pr_id,
      language_id : value.language_id,
      rfq_date : value.rfq_date,
      deadline :value.deadline, 
      item_category_id : value.item_category_id,
      purchase_group_id: value.purchase_group_id,
      purchase_org_id :value.purchase_org_id,
      delivery_date :value.delivery_date,
      plant_id :value.plant_id,
      storage_loc_id :value.storage_loc_id,
      // ...value,
      rfq_no,
      attachment: uploadParams?.Key,
    });

    // Prepare data to insert into rfq_vendors table
    const rfqVendorEntries = value.vendor.map((vendorId) => ({
      rfq_id: insertedId,
      vendor_id: vendorId,
    }));
    // Insert vendor entries into the rfq_vendors table
    await knex("rfq_items").insert(rfqVendorEntries);

    const vendorDetails = await knex("supplier_details")
      .whereIn("id", value.vendor)
      .select("emailID", "supplier_name");
    // Send email to each vendor

    const data = await knex("request_for_quotations")
      .where("id", insertedId)
      .first();
    if (!data) {
      return res.status(500).json({
        error: true,
        message: "Unable to create record",
      });
    }
    const itemCategory = await knex("item_categories")
      .where("id", data.item_category_id)
      .first();

    // Fetch plant name based on plant ID
    const plant = await knex("plants").where("id", data.plant_id).first();
    for (const { emailID, supplier_name } of vendorDetails) {
      console.log(emailID, supplier_name);

      const emailContent = `<br><br>
        Hello ${supplier_name},<br>
        <br>
        We are pleased to invite you to submit a quotation for the following RFQ.<br>
        <br>
        <strong>RFQ Details:</strong><br>
        <ul>
          <li><strong>RFQ Type :</strong> ${data.rfq_type}</li>
          <li><strong>RFQ No. :</strong> ${data.rfq_no}</li>
          <li><strong>Date Issued :</strong> ${moment(data.rfq_date).format(
            "DD MMM YYYY"
          )}</li>
          <li><strong>Deadline for Submission :</strong> ${moment(
            data.deadline
          ).format("DD MMM YYYY")}</li>
          <li><strong>Delivery Date :</strong> ${moment(
            data.delivery_date
          ).format("DD MMM YYYY")}</li>
          <li><strong>Item Category :</strong> ${itemCategory.name}</li>
          <li><strong>Plant Location :</strong> ${plant.name}</li>
        </ul>
        <p>
        Please review the RFQ and submit your quotation by the deadline. Feel free to contact us if you have any questions or need further information.</p>
    `;

      // Generate the email body
      const emailBody = functions.generateEmailBody(emailContent);

      // Send the email
      //   ses.sendEmail(
      //     constants.sesCredentials.fromEmails.emailOtp,
      //     emailID,
      //     `Request for Quotation (RFQ) Submission - ${data.rfq_type} ${data.rfq_no}`,
      //     emailBody
      //   );
    }
    return res.status(200).json({
      error: false,
      message: "RFQ created successfully",
      data: data,
    });
  } catch (error) {
    console.error("Error occurred:", error);
    return res.status(500).json({
      error: true,
      message: "Could not create record.",
      data: error.message,
    });
  }
};

export default {
  createRfq,
  updateRfq,
  deleteRfq,
  viewRfq,
  paginateRfq,
  generateCode,
  fileUploadInRfq,
  delteMultipleRecords,
};
