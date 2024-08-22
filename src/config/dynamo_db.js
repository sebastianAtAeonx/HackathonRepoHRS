import AWS from 'aws-sdk'
import config from "../helpers/constants.js"


AWS.config.update({
  accessKeyId: config.aws.accessKey,
  secretAccessKey: config.aws.secret,
  region: config.aws.region,
});

const dynamodb = new AWS.DynamoDB.DocumentClient({convertEmptyValues: true});

 export default dynamodb;


  


