import knex from "../../config/mysql_db.js";
import surepass from "../../services/surepass.js";
import natural from "natural";
const { JaroWinklerDistance } = natural;
import validation from "../../validation/admin/msme.js";

const sendOtp = async (req, res) => {
  try {
    const { error, value } = validation.sendOtp(req.body);
    if (error) {
      return res.status(400).json({ error: true, message: error.details[0].message }).end();
    }

    const { msmeNo, mobileNo } = value;

    const getOutput = await surepass.sendOtpForMsme(msmeNo, mobileNo);

    if(getOutput == -1){
      return res
        .json({ error: true, message: "Surepass MSME Api credentials are not found in database" })
        .end();
    }

    if (!getOutput) {
      return res.status(500)
        .json({ error: true, message: "Please try after sometime" })
        .end();
    }
    if (getOutput.data) {
      
      if (getOutput.status_code == 200) {
        return res.status(200)
          .json({
            error: false,
            message: "Otp sent successfully",
            data: getOutput,
          })
          .end();
      }
      if (getOutput.data.status_code == 500) {
        return res
          .json({
            error: true,
            message: getOutput.data.message,
            data: getOutput.data,
          })
          .end();
      }
    }

    return res
      .json({
        error: true,
        message: getOutput.data.message,
        data: getOutput.data,
      })
      .end();
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: "Unable to send OTP",
      data:JSON.stringify(error),
    });
  }
};
const submitOtp = async (req, res) => {
  try {
  const { error, value } = validation.submitOtp(req.body);
  if (error) {
    return res.status(400).json({ error: true, message: error.details[0].message }).end();
  }

  const { clientId, otp, pan } = value;

  const getDetails = await surepass.submitOtpForMsme(clientId, otp);

  if(getDetails == -1){
    return res
      .json({ error: true, message: "Surepass MSME Api credentials are not found in database" })
      .end();
  }

  console.log("getDetails:-", getDetails);

  if(getDetails.data.status_code == 200){

    if(getDetails.data.data.pan_number != null){
      if(getDetails.data.data.pan_number == pan){
        return res.json({error:false, message: "MSME No. verified successfully", data:getDetails.data}).end();
      }else{
        return res.json({error:true, message: "MSME No. does not match with Pan No.", data:getDetails.data}).end();
      }
    }
    return res.json({ error: true, message: getDetails.data.message, data:getDetails.data.status_code }).end();
  }

  // if(getDetails.data.status_code == 422){
  //   return res.json({ error: true, message: getDetails.data.message }).end();
  // }

  return res.json({ error: true, message: getDetails.data.message, data:getDetails.data }).end();

  } catch (error) {
    return res.status(500).json({
      error: true,
      message: "Unable to submit OTP",
      data:JSON.stringify(error),
    });
  }
};
const getMsmeDetails = async (req, res) => {
  // try {
    const { error, value } = validation.getMsmeDetails(req.body);
    if (error) {
      return res.json({ error: true, message: error.details[0].message }).end();
    }

    const { msmeNo, companyName } = value;

    function similarityPercentage(str1, str2) {
      const distance =JaroWinklerDistance(str1.toLowerCase(), str2.toLowerCase());
      console.log(distance)
      const maxLength = Math.max(str1.length, str2.length);
      // return ((maxLength - distance) / maxLength) * 100;
      return distance * 100
    }

    const getDetails = await surepass.getMsmeDetails(msmeNo);

    if(getDetails == -1){
      return res
        .json({ error: true, message: "Surepass MSME Api credentials are not found in database" })
        .end();
    }

    if (!getDetails) {
      return res
        .json({ error: true, message: "Udyam Number does not exist" })
        .end();
    }

    if (getDetails.data.status_code == 500) {
      return res
        .json({ error: true, message: "Try Again", data: getDetails.data })
        .end();
    }

    if (getDetails.data.status_code == 422) {
      return res
        .json({ error: true, message: "Invalid UAN", data: getDetails.data })
        .end();
    }

    const company_name = getDetails.data.main_details.name_of_enterprise;
    const similarity = similarityPercentage(companyName.toLowerCase(), company_name.toLowerCase());
    const threshold = 70;
    if (similarity >= threshold) {
      return res.json({
        error: false,
        message: "MSME Number verified successfully.",
        similarity,
        data: getDetails.data,
        
      });
    }

    return res.json({
      error: true,
      message:
        "The provided MSME number does not belong to the specified company; please verify and try again.",
        similarity,
      data: getDetails,
    });
  // } catch (error) {
  //   return res.json({
  //     error: true,
  //     message: "Could not get details.",
  //   });
  // }
};

export default {
  sendOtp,
  submitOtp,
  getMsmeDetails,
};
