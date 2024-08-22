import knex from "../config/mysql_db.js";
import fs from "fs";
import AWS from "aws-sdk";
import constants from "../helpers/constants.js";
import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";

const client = new S3Client({});

const main = async () => {
  const command = new GetObjectCommand({
    Bucket: "test-bucket",
    Key: "hello-s3.txt",
  });

  try {
    const response = await client.send(command);
    // The Body object also has 'transformToByteArray' and 'transformToWebStream' methods.
    const str = await response.Body.transformToString();
    console.log(str);
  } catch (err) {
    console.error(err);
  }
};

const indexPath = constants.indexPath;

const s3 = new AWS.S3({
  accessKeyId: constants.s3Creds.accessKey,
  secretAccessKey: constants.s3Creds.secret,
  signatureVersion: "v4",
  region: "ap-south-1",
});

const Bucket = constants.s3Creds.bucket;
const ArchiveBucket = constants.s3Creds.archiveBucket;

function batchUpdate(table, collection) {
  return knex.transaction((trx) => {
    const queries = collection.map((tuple) =>
      knex(table).where("id", tuple.id).update(tuple).transacting(trx)
    );
    return Promise.all(queries).then(trx.commit).catch(trx.rollback);
  });
}

const uploadImageFromTable = async (tableName, ImageFields = []) => {
  ImageFields.push("id");
  console.log(indexPath);

  const array = await knex(tableName).select(ImageFields);
  ImageFields.pop();
  console.log(ImageFields);

  for (i = 0; i < array.length; i++) {
    console.log("start");
    for (j = 0; j < ImageFields.length; j++) {
      console.log(array[i]);
      if (
        !ImageFields[j] ||
        !array[1] ||
        !(ImageFields[j] in array[1]) ||
        array[i][ImageFields[j]] == null ||
        array[i][ImageFields[j]] == "null" ||
        array[i][ImageFields[j]] == ""
      ) {
      } else {
        try {
          const blob = fs.readFileSync(
            indexPath + "/uploads/" + array[i][ImageFields[j]]
          );
          const uploadedImage = await s3
            .upload({
              Bucket,
              Key: array[i][ImageFields[j]],
              Body: blob,
            })
            .promise();
          // array[i][ImageFields[j]] = uploadedImage.Location
        } catch (e) {
          console.log(e);
        }
      }
    }
  }
  console.log(array);
};

const uploadFile = async (FileName) => {
  const blob = fs.readFileSync(indexPath + "/uploads/" + FileName);
  const name = Date.now() + "_" + FileName;
  const uploadedImage = await s3
    .upload({
      Bucket,
      Key: "abc/logo/" + name,
      Body: blob,
    })
    .promise();
  console.log(uploadedImage);
  return uploadedImage;
};

const uploadFileToDir = async (FileName, directorypath) => {
  const blob = fs.readFileSync(indexPath + "/uploads/" + FileName);
  const name = Date.now() + "_" + FileName;
  const uploadedImage = await s3
    .upload({
      Bucket,
      Key: directorypath + name,
      Body: blob,
    })
    .promise();
  //console.log(uploadedImage);
  return uploadedImage;
};

const service = async (req, res) => {
  const file1 = req.files.image1;

  const newName = "test.png";

  try {
    const awsResponse = await recieveAndUpload(file, newName);
    knex("table").insert({
      name: "Jay",
      email: "jay.parmar@aeonx.digital",
      image: newName,
    });

    res.json({
      error: true,
      message: "file upload successfull",
      data: awsResponse,
    });
  } catch (err) {
    res.json({
      error: true,
      message: "failed to upload file",
    });
  }
};

const recieveAndUpload = async (file, newName) => {
  return new Promise(async (resolve, reject) => {
    try {
      await file.mv(`${constants.indexPath}/uploads/${newName}`);
      const data = await uploadFile(newName);

      if (!data) {
        reject("Upload failed");
      }

      resolve(data);
    } catch (err) {
      console.error(err);
      reject(err);
    }
  });
};

const recieveUploadAndStore = async (file, newName, directorypath) => {
  return new Promise(async (resolve, reject) => {
    try {
      await file.mv(`${constants.indexPath}/uploads/${newName}`);
      const data = await uploadFileToDir(newName, directorypath);

      if (!data) {
        reject("Upload failed");
      }

      resolve(data);
    } catch (err) {
      console.error(err);
      reject(err);
    }
  });
};

const deleteObject = async (Key) => {
  const archiveFile_result = await archiveFile(Key);
  if (archiveFile_result != true) {
    return archiveFile_result;
  }
  var params = {
    Bucket,
    Key,
  };

  try {
    await s3.deleteObject(params).promise();
    return true; // No error, return null
  } catch (error) {
    // Handle the error and return an error message
    return error.message;
  }
};

const archive_record = async (
  fileKey,
  archiveBucketName,
  originalBucketName,
  deletedBy,
  reason,
  userId
) => {
  const check_user_id = await knex("users").where({
    id: userId,
  });

  if (check_user_id.length == 0) {
    console.log("user id does not exist");
    return "error";
  }

  const archive_result = await knex("archives").insert({
    file_key: "content-server/arhives/" + fileKey,
    archive_bucket: archiveBucketName,
    original_bucket: originalBucketName,
    deleted_by: deletedBy,
    reason: reason,
    user_id: userId,
  });
  console.log("archivesKey:=", "content-server/arhives/" + fileKey);
  console.log("archiveResult:=", archive_result);
  return archive_result;
};

const getPresignedUrl = async (fileName, fileType) => {
  return new Promise((resolve, reject) => {
    const params = {
      Bucket: Bucket,
      Key: "content-server/" + fileName,
      Expires: 60, // URL expiration time in seconds
      ContentType: "application/octet-stream",
    };
    s3.getSignedUrl("putObject", params, (err, url) => {
      if (err) return reject(err);

      resolve({
        error: false,
        message: "Url recieved Successfully.",
        data: {
          url,
        },
      });
    });
  });
};

const archiveFile = async (fileKey) => {
  // Define the source and destination bucket names
  const sourceBucket = Bucket;
  const destinationBucket = constants.s3Creds.archiveBucket;

  // Define the source and destination object keys
  const sourceKey = fileKey;
  const destinationKey = fileKey;

  var params = {
    CopySource: `${sourceBucket}/${sourceKey}`,
    Bucket: destinationBucket,
    Key: "content-server/archives/" + destinationKey,
  };
  console.log("fileKey:=", fileKey);
  console.log("params:=", params);
  try {
    await s3.copyObject(params).promise();
    return true; // No error, return true
  } catch (error) {
    // Handle the error and return an error message
    return error.message;
  }
};

const fileupload_using_path = async (file, path) => {
  var params = {
    Bucket: Bucket,
    Key: file,
    Body: fs.createReadStream(path),
  };
  try {
    await s3.upload(params).promise();
    return true; // No error, return true
  } catch (error) {
    return error.message;
  }
};

const getTempUrl = async (fileName) => {
  const url = s3.getSignedUrl("getObject", {
    Bucket: Bucket,
    Key: "content-server/" + fileName,
    Expires: 3600,
  });

  return Promise.resolve(url);
};

const getTempUrl2 = (fileName) => {
  const url = s3.getSignedUrl("getObject", {
    Bucket: Bucket,
    Key: fileName,
    Expires: 3600,
  });

  return url;
};

const deleteObjectFromS3 = async(Key) => {

  var params = {
    Bucket,
    Key,
  };

  try {
    await s3.headObject(params).promise(); // Check if the object exists
    await s3.deleteObject(params).promise(); // Delete the object
    return true; // No error, return true
  } catch (error) {
    // Handle the error and return an error message
    return error.message;
  }
}

const getASNTempUrl = async (fileName) => {
  const url = s3.getSignedUrl("getObject", {
    Bucket: Bucket,
    Key: "asnQrcodes/" + fileName,
    Expires: 3600,
  });

  return Promise.resolve(url);
};

export default {
  uploadImageFromTable,
  uploadFile,
  recieveAndUpload,
  deleteObject,
  batchUpdate,
  getPresignedUrl,
  recieveUploadAndStore,
  archiveFile,
  getTempUrl,
  getTempUrl2,
  archive_record,
  fileupload_using_path,
  deleteObjectFromS3,
  getASNTempUrl
};
