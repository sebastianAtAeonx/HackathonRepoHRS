import knex from "../config/mysql_db.js";
import axios from "axios";

const send_data = async (data) => {
  const sapResponse = await axios.post("http://www.google.com", data);
  return sapResponse;
};

const get_data = async () => {
  const sapResponse = await axios.get("http://www.google.com");
  return sapResponse;
};

export default {
  send_data,
};
