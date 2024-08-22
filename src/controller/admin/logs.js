import knex from "../../config/mysql_db.js";
import moment from "moment-timezone";
import validation from "../../validation/admin/logs.js"

// const logsList = async (req, res) => {
//     const tableName = "transaction_logs";

//     // try {
//         const getData = await knex(tableName).select();
//         if (!getData || getData.length === 0) {
//             return res.json({ error: true, message: "No data available" });
//         }

//         const formattedData = await Promise.all(getData.map(async (item) => {
//             const { username } = await knex("users").where({ id: item.user_id }).select("username").first();
//             const timestamp = new Date(item.timestamp).toLocaleString('en-US', { hour12: true });
//             const action = item.transaction_type === "UPDATE" ? "Updated" : item.transaction_type === "DELETE" ? "Deleted" : "Modified";
//             let id, formattedSentence;

//             if (item.transaction_type === "DELETE") {
//                 const deletedTable = item.table_name; // Get the name of the table from which data was deleted
//                 id = item.new_value && typeof item.new_value === "object" && item.new_value.id !== undefined ? item.new_value.id : null; // Check if new_value exists and is an object
//                 formattedSentence = `${username} ${action} ID ${id} from ${deletedTable}`;
//             } else {
//                 id = JSON.parse(item.old_value).id;
//                 formattedSentence = `${username} ${action} the ${item.table_name} data`;
//             }

//             return {
//                 original: {
//                     ...item,
//                     old_value: JSON.parse(item.old_value),
//                     new_value: JSON.parse(item.new_value),
//                     username // Include username in the original object
//                 },
//                 formatted: formattedSentence
//             };
//         }));

//         return res.json({ error: false, data: formattedData });
//     // } catch (error) {
//     //     return res.json({ error: true, message: "Error fetching data", data: error });
//     // }
// }

//this list includes insert logs also
const logsList = async (req, res) => {
  // try {
    const { error, value } = validation.paginate(req.body);
    if (error) {
      return res.status(400).json({
        error: true,
        message: error.details[0].message,
        data: error,
      });
    }

    let { offset, limit, sort, order, search,filter } = value;

    let query = knex("transaction_logs");
    
    if (search) {
      query = query.where(function() {
        this.orWhereILike("transaction_type", `%${search}%`)
            .orWhereILike("table_name", `%${search}%`)
            .orWhereExists(function() {
              this.select(knex.raw(1))
                  .from("users")
                  .whereRaw("transaction_logs.user_id = users.id")
                  .andWhere("username", "ilike", `%${search}%`);
            });
      });
    }
    
    if (filter) {
      const { startDate, endDate, dateField } = filter;
      if (startDate && endDate && dateField) {
        const startDate = moment(filter.startDate)
          .startOf("day")
          .format("YYYY-MM-DD HH:mm:ss");
        const endDate = moment(filter.endDate)
          .endOf("day")
          .format("YYYY-MM-DD HH:mm:ss");
        query.whereBetween(dateField, [startDate, endDate]);
      }
    }

    const total = await query.clone().count("id as total").first();
    let rows = await query
      .orderBy(sort, order)
      .limit(limit)
      .offset(offset);

    const formattedData = await Promise.all(
      rows.map(async (item, index) => {
        const user = await knex("users")
        .where({ id: item.user_id })
        .select("username")
        .first();
      
        const username = user?.username
      
        // Convert timestamp to IST using moment.js
        let timestamp = moment(item.timestamp)
          .tz("Asia/Kolkata")
          .format("YYYY-MM-DD HH:mm:ss");

        const action =
          item.transaction_type === "UPDATE"
            ? "Updated"
            : item.transaction_type === "DELETE"
            ? "Deleted"
            : "Inserted";

        let id, formattedSentence;

        if (item.transaction_type === "DELETE") {
          const deletedTable = item.table_name;
          id = item.new_value && typeof item.new_value === "object" && item.new_value.id !== undefined ? item.new_value.id : null;
          formattedSentence = `${username} ${action} ID ${id} from ${deletedTable}`;
        } else {
          id = JSON.parse(item.new_value).id;
          formattedSentence = `${username} ${action} the ${item.table_name} data`;
        }

        return {
          srno: offset + index + 1, // Adjust serial number for pagination
          id: item.id,
          transaction_type: item.transaction_type,
          table_name: item.table_name,
          old_value: JSON.parse(item.old_value),
          new_value: JSON.parse(item.new_value),
          user_id: item.user_id,
          username: username,
          timestamp: timestamp,
          action: action,
          formattedSentence: formattedSentence,
        };
      })
    );

    return res.status(200).json({
      error: false,
      message: "Data retrieved successfully",
      data: formattedData,
      total: total.total,
    });
  // } catch (error) {
  //   console.error("Error fetching data:", error);
  //   return res.status(500).json({
  //     error: true,
  //     message: "Error fetching data",
  //     data: error,
  //   });
  // }
};


export default { logsList };
