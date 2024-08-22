import knex from "../../config/mysql_db.js";
import functions from "../../helpers/functions.js";
import logs from "../../middleware/logs.js";
import validation from "../../validation/admin/api.js";

const createAPI = async (req, res) => {
  try {
    const { error, value } = validation.create(req.body);
    if (error) {
      return res.status(400).json({
        error: true,
        message: error.details[0].message,
        data: [],
      });
    }

    const {
      name,
      username,
      password,
      clientId,
      clientSecret,
      grantType,
      apiKey,
      secretKey,
      url,
      authorization,
      apiVersion,
      status,
    } = value;

    const check_name = await knex("apis").where("name", name);
    if (check_name != 0) {
      return res.status(409).json({
        error: true,
        message: "API is already exist",
      });
    }

    const insertData = await knex("apis").insert({
      name,
      username,
      password,
      clientId,
      clientSecret,
      grantType,
      apiKey,
      secretKey,
      url,
      authorization,
      apiVersion,
      status,
    });
    if (!insertData) {
      return res.status(500).json({
        error: true,
        message: "Api details not inserted",
      });
    }
    return res.status(201).json({
      error: false,
      message: "Api details is added successfully.",
      data: {
        insertData,
      },
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: "Could not create record",
      data: JSON.stringify(error),
    });
  }
};

const updateAPI = async (req, res) => {
  try {
    const tableName = "apis";
    const { error, value } = validation.update(req.body);
    if (error) {
      return res.status(400).json({
        error: true,
        message: error.details[0].message,
        data: [],
      });
    }

    const {
      id,
      name,
      username,
      password,
      clientId,
      clientSecret,
      grantType,
      apiKey,
      secretKey,
      url,
      authorization,
      apiVersion,
      status,
    } = value;

    const check_id = await knex(tableName)
      .where("name", name)
      .where("id", "!=", id);

    if (Array.isArray(check_id) && check_id.length != 0) {
      return res.status(409).json({
        error: true,
        message: "Api data is already exist",
      });
    }
    const updationDataIs = await functions.takeSnapShot(tableName, id);

    try {
      await logs.logOldValues(tableName, id, value, req);
    } catch {
      console.log(error);
    }
    const updateData = await knex(tableName).where({ id: id }).update({
      name,
      username,
      password,
      clientId,
      clientSecret,
      grantType,
      apiKey,
      secretKey,
      url,
      authorization,
      apiVersion,
      status,
    });
    if (!updateData) {
      return res.status(404).json({
        error: true,
        message: "API not found",
      });
    }

    //modified by...
    if (id) {
      const modifiedByTable1 = await functions.SetModifiedBy(
        req.headers["authorization"],
        tableName,
        "id",
        id
      );
      console.log("isUpdated:-", modifiedByTable1);
    }
    //modified by... over

    return res.status(200).json({
      error: false,
      message: "Api name is updated successfully.",
      data: value,
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: "Could not update record",
      data: { error: JSON.stringify(error) },
    });
  }
};

const deleteAPI = async (req, res) => {
  try {
    const tableName = "apis";

    const { error, value } = validation.del(req.params);
    if (error) {
      return res.status(400).json({
        error: true,
        message: error.details[0].message,
        data: error,
      });
    }

    const { id } = value;

    console.log(id);

    try {
      await logs.logOldValues(tableName, id, value, req);
    } catch {
      console.log(error);
    }
    const check = await knex(tableName)
      .where({ id })
        .where("status", "0")
        .update("isDeleted", 1);

  
    if (!check) {
      return res.status(500).json({
        error: true,
        message: "Can't Delete",
      });
    }
    return res.status(200).json({
      error: false,
      message: "Deleted Successfully.",
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: "Could not delete record",
      data: { error: JSON.stringify(error) },
    });
  }
};

const viewAPI = async (req, res) => {
  try {
    const tableName = "apis";
    const { error, value } = validation.view(req.params);
    if (error) {
      return res.status(400).json({
        error: true,
        message: error.details[0].message,
        data: error,
      });
    }

    const { id } = value;

    const result = await knex(tableName).where({
      id: id,
    });
    if (result == "") {
      return res.status(404).json({
        error: true,
        message: "Api data does not exist",
      });
    }
    return res.status(200).json({
      error: false,
      message: "Api data is found Successfully",
      data: {
        result,
      },
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: "Could not load record",
      data: JSON.stringify(error),
    });
  }
};

const paginateAPI = async (req, res) => {
  try {
    const tableName = "apis";
    const searchFrom = ["name"];

    const { error, value } = validation.paginate(req.body);
    if (error) {
      return res.status(400).json({
        error: true,
        message: error.details[0].message,
        data: error,
      });
    }

    let { offset, limit, order, sort, search, status } = value;
    let total = 0;
    let results = knex(tableName);

    results = results.where(function () {
      if (search != undefined && search != "") {
        searchFrom.forEach((element) => {
          this.orWhereILike(element, `%${search}%`);
        });
      }
    });

    if (status != "") {
      results = results.where({ status });
    }

    total = await results.count("id as total").first();

    let rows = knex(tableName);

    if (status != "") {
      rows = rows.where({ status });
    }

    rows = rows.where(function () {
      if (search != undefined && search != "") {
        searchFrom.forEach((element) => {
          this.orWhereILike(element, `%${search}%`);
        });
      }
    });
    rows = await rows.orderBy(sort, order).limit(limit).offset(offset);
    let data_rows = [];
    if (order === "desc") {
      let sr = offset + 1;
      await rows.forEach((row) => {
        row.sr = sr;
        //delete row.password;
        data_rows.push(row);
        sr++;
      });
    } else {
      let sr = total.total - limit * offset;
      await rows.forEach((row) => {
        row.sr = sr;
        //delete row.password;
        data_rows.push(row);
        sr--;
      });
    }
    return res.status(200).json({
      error: false,
      message: "Api data is retrieved successfully.",
      data: {
        rows: data_rows,
        total: total.total,
      },
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: "Could not load record",
      data: JSON.stringify(error),
    });
  }
};

//for count of 3rd party api calls:
// const countApiCalls = async (req, res) => {
//   try {
//     const { date, month, year } = req.body;
//     if (month && !year) {
//       return res
//         .json({
//           error: true,
//           message: "Year must be provided along with the month.",
//           listAllApi: [],
//         })
//         .end();
//     }

//     let apiCalls = await knex("api_calls").select("controller", "timestamp");

//     if (date) {
//       apiCalls = apiCalls.filter((call) => {
//         const callDate = new Date(call.timestamp).toISOString().split("T")[0];
//         return callDate === date;
//       });

//       if (apiCalls.length <= 0) {
//         return res
//           .json({
//             error: false,
//             message: `No data found for the date ${date}`,
//             listAllApi: [],
//           })
//           .end();
//       }
//     } else if (month && year) {
//       apiCalls = apiCalls.filter((call) => {
//         const callDate = new Date(call.timestamp);
//         return (
//           callDate.getFullYear() === year && callDate.getMonth() + 1 === month
//         );
//       });

//       if (apiCalls.length <= 0) {
//         return res
//           .json({
//             error: false,
//             message: `No data found for month ${month} of year ${year}`,
//             listAllApi: [],
//           })
//           .end();
//       }
//     } else if (year) {
//       apiCalls = apiCalls.filter((call) => {
//         const callDate = new Date(call.timestamp);
//         return callDate.getFullYear() === year;
//       });

//       if (apiCalls.length <= 0) {
//         return res
//           .json({
//             error: false,
//             message: `No data found for the year ${year}`,
//             listAllApi: [],
//           })
//           .end();
//       }
//     }

//     const controllerCounts = {};
//     apiCalls.forEach((call) => {
//       const { controller } = call;
//       controllerCounts[controller] = (controllerCounts[controller] || 0) + 1;
//     });

//     const responseData = Object.keys(controllerCounts).map((controller) => ({
//       controller,
//       count: controllerCounts[controller],
//     }));

//     return res.json({
//       error: false,
//       listAllApi: responseData,
//     });
//   } catch (error) {
//     return res
//       .json({
//         error: true,
//         message: "Something went wrong",
//       })
//       .end();
//   }
// }

// const countApiCalls = async (req, res) => {
//   try {
//     const { date, month, year } = req.body;
//     if (month && !year) {
//       return res
//         .json({
//           error: true,
//           message: "Year must be provided along with the month.",
//           listAllApi: [],
//         })
//         .end();
//     }

//     let apiCalls = await knex("api_calls").select("controller", "timestamp");

//     if (date) {
//       apiCalls = apiCalls.filter((call) => {
//         const callDate = new Date(call.timestamp).toISOString().split("T")[0];
//         return callDate === date;
//       });

//       if (apiCalls.length <= 0) {
//         return res
//           .json({
//             error: false,
//             message: `No data found for the date ${date}`,
//             listAllApi: [],
//           })
//           .end();
//       }
//     } else if (month && year) {
//       apiCalls = apiCalls.filter((call) => {
//         const callDate = new Date(call.timestamp);
//         return (
//           callDate.getFullYear() === year && callDate.getMonth() + 1 === month
//         );
//       });

//       if (apiCalls.length <= 0) {
//         return res
//           .json({
//             error: false,
//             message: `No data found for month ${month} of year ${year}`,
//             listAllApi: [],
//           })
//           .end();
//       }
//     } else if (year) {
//       apiCalls = apiCalls.filter((call) => {
//         const callDate = new Date(call.timestamp);
//         return callDate.getFullYear() === year;
//       });

//       if (apiCalls.length <= 0) {
//         return res
//           .json({
//             error: false,
//             message: `No data found for the year ${year}`,
//             listAllApi: [],
//           })
//           .end();
//       }
//     }

//     const controllerCounts = {};
//     apiCalls.forEach((call) => {
//       const { controller } = call;
//       controllerCounts[controller] = (controllerCounts[controller] || 0) + 1;
//     });

//     let srno = 1;
//     const responseData = Object.keys(controllerCounts).map((controller) => ({
//       srno: srno++,
//       controller,
//       count: controllerCounts[controller],
//     }));

//     return res.json({
//       error: false,
//       total: responseData.length,
//       listAllApi: responseData,
//     });
//   } catch (error) {
//     return res
//       .json({
//         error: true,
//         message: "Something went wrong",
//       })
//       .end();
//   }
// };

//with pagination
// const countApiCalls = async (req, res) => {
//   // try {
//     const schema = Joi.object({
//       offset: Joi.number().default(0),
//       limit: Joi.number().default(50),
//       sort: Joi.string().default("controller"), // Assuming default sorting by controller
//       order: Joi.string().valid("asc", "desc").default("asc"), // Assuming default order as ascending
//       date: Joi.string().allow('', null).default(null), // Adding date field for filtering
//       month: Joi.number().allow('', null).default(null), // Adding month field for filtering
//       year: Joi.number().allow('', null).default(null), // Adding year field for filtering
//       search: Joi.string().allow('', null).default(null) // Adding search field for filtering
//     });

//     const { error, value } = schema.validate(req.body);
//     if (error) {
//       return res.json({
//         error: true,
//         message: error.details[0].message,
//         data: error,
//       });
//     }

//     const { offset, limit, sort, order, date, month, year, search } = value;

//     let apiCalls = await knex("api_calls").select("controller","serviceName", "timestamp" );

//     // Filtering based on date, month, year, and search query
//     if (date) {
//       apiCalls = apiCalls.filter(call => {
//         const callDate = new Date(call.timestamp).toISOString().split("T")[0];
//         return callDate === date;
//       });
//     } else if (month !== null && month !== '' && year === null) {
//       return res.json({
//         error: true,
//         message: "Please provide the year along with the month.",
//         data: [],
//       });
//     } else if (month !== null && year !== null) {
//       apiCalls = apiCalls.filter(call => {
//         const callDate = new Date(call.timestamp);
//         return callDate.getFullYear() === year && callDate.getMonth() + 1 === month;
//       });
//     } else if (year) {
//       apiCalls = apiCalls.filter(call => {
//         const callDate = new Date(call.timestamp);
//         return callDate.getFullYear() === year;
//       });
//     }

//     if (search) {
//       apiCalls = apiCalls.filter(call => call.controller.includes(search) || call.serviceName.includes(search));
//     }

//     if (apiCalls.length === 0) {
//       let errorMessage = "No data found.";
//       if (date) {
//         errorMessage = `No data found for the date ${date}`;
//       } else if (month !== null && year !== null) {
//         errorMessage = `No data found for month ${month} of year ${year}`;
//       } else if (year) {
//         errorMessage = `No data found for the year ${year}`;
//       }
//       return res.json({
//         error: false,
//         message: errorMessage,
//         data: [],
//       });
//     }

//     // Counting API calls for each controller
//     const controllerCounts = {};
//     apiCalls.forEach((call) => {
//       const { controller } = call;
//       controllerCounts[controller] = (controllerCounts[controller] || 0) + 1;
//     });

//     // Sorting controllers based on the selected sort field
//     const sortedControllers = Object.keys(controllerCounts).sort((a, b) => {
//       if (order === "asc") {
//         return a.localeCompare(b);
//       } else {
//         return b.localeCompare(a);
//       }
//     });

//     // Pagination
//     const paginatedControllers = sortedControllers.slice(offset, offset + limit);

//     // Constructing response data with pagination
//     const responseData = paginatedControllers.map((controller, index) => {
//       const { timestamp, serviceName } = apiCalls.find(call => call.controller === controller);
//       return {
//         sr: offset + index + 1,
//         controller,
//         serviceName,
//         count: controllerCounts[controller],
//         timestamp
//       };
//     });

//     return res.json({
//       error: false,
//       total: Object.keys(controllerCounts).length, // Total number of unique controllers
//       data: responseData,
//     });
//   // } catch (error) {
//   //   console.error(error);
//   //   return res.json({
//   //     error: true,
//   //     message: "Something went wrong",
//   //     data: JSON.stringify(error),
//   //   });
//   // }
// };

//with startdate enddate filetr
const countApiCalls = async (req, res) => {
  try {
    const { error, value } = validation.countApiCalls(req.body);
    if (error) {
      return res.status(400).json({
        error: true,
        message: error.details[0].message,
        data: error,
      });
    }

    const { offset, limit, sort, order, filter, search } = value;
    const { startdate, enddate } = filter;

    let apiCalls = await knex("api_calls").select("controller", "serviceName");

    // Apply date range filter
    if (startdate && enddate) {
      apiCalls = apiCalls.filter((call) => {
        const callDate = new Date(call.timestamp).toISOString().split("T")[0];
        return callDate >= startdate && callDate <= enddate;
      });
    }

    // Apply search filter
    if (search) {
      const searchRegex = new RegExp(search, "i"); // Case-insensitive search
      apiCalls = apiCalls.filter(
        (call) =>
          call.controller.match(searchRegex) ||
          (call.serviceName && call.serviceName.match(searchRegex))
      );
    }

    if (apiCalls.length === 0) {
      return res.status(500).json({
        error: false,
        message: "No data found for the provided criteria",
        data: [],
      });
    }

    // Counting API calls for each controller
    const controllerCounts = {};
    apiCalls.forEach((call) => {
      const { controller } = call;
      controllerCounts[controller] = (controllerCounts[controller] || 0) + 1;
    });

    // Sorting controllers based on the selected sort field
    const sortedControllers = Object.keys(controllerCounts).sort((a, b) => {
      if (order === "asc") {
        return a.localeCompare(b);
      } else {
        return b.localeCompare(a);
      }
    });

    // Pagination
    const paginatedControllers = sortedControllers.slice(
      offset,
      offset + limit
    );

    // Constructing response data with pagination
    const responseData = paginatedControllers.map((controller, index) => {
      const { timestamp, serviceName } = apiCalls.find(
        (call) => call.controller === controller
      );
      return {
        sr: offset + index + 1,
        controller,
        serviceName,
        count: controllerCounts[controller],
      };
    });

    return res.status(200).json({
      error: false,
      total: Object.keys(controllerCounts).length, // Total number of unique controllers
      data: responseData,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      error: true,
      message: "Could not load record(s)",
      data: JSON.stringify(error),
    });
  }
};


const delteMultipleRecords=async(req,res)=>{
  try {
    const tableName = "apis";
    const { ids } = req.body;
  
    const result = await functions.bulkDeleteRecords(tableName, ids, req);
  
    if (result.error) {
      return res.status(400).json({
        error: true,
        message: "Failed to delete one or more records",
        errors: result.errors,
        deltedIds:result.messages,
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
        message: "Could not load record.",
        data: JSON.stringify(error),
      });
    }
}

export default {
  createAPI,
  updateAPI,
  deleteAPI,
  viewAPI,
  paginateAPI,
  countApiCalls,
  delteMultipleRecords
};
