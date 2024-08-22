import s3 from "../../../s3/s3.js";
import fun from "../../../helpers/functions.js";

const uploadfile = async (req, res) => {
  try {
    const fileUpload = [];
    const myfile = Object.keys(req.files).map(async (fileName) => {
      const myfile = req.files[fileName];
      fileUpload.push(s3.recieveAndUpload(myfile, myfile.name));
    });

    const responses = await Promise.all(fileUpload);
    return res.json({
      error: false,
      mesage: "All files Uploaded",
      data: responses,
    });

    //old code for single file was:
    const file_name = myfile.name;
    const mime_type = myfile.mimetype;
    const file_size = myfile.size;

    const uploadresult = await s3.recieveAndUpload(myfile, myfile.name);

    if (!uploadresult) {
      res.json({ Error: true, Message: "Can not upload file" });
      res.end();
    } else {
      res.json({ Error: false, Message: uploadresult });
      res.end();
    }
    res.end();
  } catch (error) {
    fun.sendErrorLog(error);
    return res.json({
      error: true,
      message: error.toString(),
    });
  }
};
export default {
  uploadfile,
};
