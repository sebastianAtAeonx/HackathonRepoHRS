import _ from "lodash";
import AWS from "aws-sdk";
import constant from "../helpers/constants.js";
import {
  AnalyzeExpenseCommand,
  TextractClient,
} from "@aws-sdk/client-textract";

// const Textract = async (filename) => {
//   console.log(filename);
//   AWS.config.update({
//     accessKeyId: constant.s3Creds.accessKey,
//     secretAccessKey: constant.s3Creds.secret,
//     region: constant.aws.region,
//   });

//   const textract = new AWS.Textract();
//   const getText = (result, blocksMap) => {
//     let text = "";

//     if (_.has(result, "Relationships")) {
//       result.Relationships.forEach((relationship) => {
//         if (relationship.Type === "CHILD") {
//           relationship.Ids.forEach((childId) => {
//             const word = blocksMap[childId];
//             if (word.BlockType === "WORD") {
//               text += `${word.Text} `;
//             }
//             if (word.BlockType === "SELECTION_ELEMENT") {
//               if (word.SelectionStatus === "SELECTED") {
//                 text += `X `;
//               }
//             }
//           });
//         }
//       });
//     }

//     return text.trim();
//   };

//   const findValueBlock = (keyBlock, valueMap) => {
//     let valueBlock;
//     keyBlock.Relationships.forEach((relationship) => {
//       if (relationship.Type === "VALUE") {
//         // eslint-disable-next-line array-callback-return
//         relationship.Ids.every((valueId) => {
//           if (_.has(valueMap, valueId)) {
//             valueBlock = valueMap[valueId];
//             return false;
//           }
//         });
//       }
//     });

//     return valueBlock;
//   };

//   const getKeyValueRelationship = (keyMap, valueMap, blockMap) => {
//     const keyValues = {};

//     const keyMapValues = _.values(keyMap);
//     keyMapValues.forEach((keyMapValue) => {
//       const valueBlock = findValueBlock(keyMapValue, valueMap);
//       const key = getText(keyMapValue, blockMap);
//       const value = getText(valueBlock, blockMap);
//       keyValues[key] = value;
//     });

//     return keyValues;
//   };

//   const getKeyValueMap = (blocks) => {
//     const keyMap = {};
//     const valueMap = {};
//     const blockMap = {};

//     let blockId;
//     blocks.forEach((block) => {
//       blockId = block.Id;
//       blockMap[blockId] = block;

//       if (_.includes(block.EntityTypes, "KEY")) {
//         keyMap[blockId] = block;
//       } else {
//         valueMap[blockId] = block;
//       }
//     });

//     return { keyMap, valueMap, blockMap };
//   };

//   const getTable = (blocksMap, tableResult) => {
//     const table = [];
//     if (_.has(tableResult, "Relationships")) {
//       tableResult.Relationships.forEach((relationship) => {
//         if (relationship.Type === "CHILD") {
//           relationship.Ids.forEach((childId) => {
//             const tableCell = blocksMap[childId];
//             if (tableCell.BlockType === "CELL") {
//               let row = table[tableCell.RowIndex] || [];
//               row[tableCell.ColumnIndex] = getText(tableCell, blocksMap);
//               table[tableCell.RowIndex] = row;
//             }
//           });
//         }
//       });
//     }
//     return table;
//   };

//   const buffer = async () => {
//     const bucket = constant.bucket;
//     const name = "tax-invoices/" + filename;
//     const params = {
//       Document: {
//         S3Object: {
//           Bucket: bucket,
//           Name: name,
//         },
//       },
//       FeatureTypes: ["TABLES", "FORMS", "SIGNATURES"],
//     };

//     const request =textract.analyzeDocument(params);

//     const data = await request.promise();
//     if (data && data.Blocks) {
//       const { keyMap, valueMap, blockMap } = getKeyValueMap(data.Blocks);
//       const keyValues = getKeyValueRelationship(keyMap, valueMap, blockMap);

//       Object.keys(keyValues).forEach((key) => {
//         if (keyValues[key] === "") {
//           delete keyValues[key];
//         }
//       });

//       const tables = [];
//       if (data && data.Blocks) {
//         const { blockMap } = getKeyValueMap(data.Blocks);
//         data.Blocks.forEach((block) => {
//           if (block.BlockType === "TABLE") {
//             const table = getTable(blockMap, block);
//             tables.push(table);
//           }
//         });
//       }

//       const processTableData = (tables) => {
//         const processedTables = [];
//         tables.forEach((table) => {
//           const processedTable = [];
//           let headerRow = null;
//           table.forEach((row) => {
//             if (!headerRow) {
//               headerRow = row;
//             } else {
//               processedTable.push(row.slice(1)); // Exclude the first element (null)
//             }
//           });

//           if (headerRow) {
//             processedTable.unshift(headerRow.slice(1)); // Exclude the first element (null)
//           }

//           processedTables.push(processedTable);
//         });

//         return processedTables;
//       };

//       // Usage:
//       const processedTables = processTableData(tables);

//       const isMatched = (rowData) => {
//         for (const value of rowData) {
//           for (const key in keyValues) {
//             if (keyValues[key] === value) {
//               delete keyValues[key];
//               return true;
//             }
//           }
//         }
//         return false;
//       };

//       // Loop through each row in the table array
//       for (const row of processedTables) {
//         for (let i = 0; i < row.length; i++) {
//           isMatched(row[i]);
//         }
//       }

//       let header = [];
//       let rows = [];
//       const formCondition = async (table) => {
//         //console.log(table)
//         for (let i = 0; i < table.length; i++) {
//           header.push(table[i][0]);
//           let row = [];
//           for (let j = 1; j < table[i].length; j++) {
//             row.push(table[i][j]);
//           }
//           rows[i] = row;
//         }
//       };
//       await formCondition(processedTables);

//       return {
//         error: false,
//         message: "Inserting in the database successful",
//         data: keyValues,
//         header,
//         rows,
//       };
//     }

//     return {
//       error: true,
//       data: undefined,
//     };
//   };

//   const data = await buffer();

//   return {
//     data,
//   };
// };

const Textract = async (filename) => {
  console.log(filename);
  AWS.config.update({
    accessKeyId: constant.s3Creds.accessKey,
    secretAccessKey: constant.s3Creds.secret,
    region: constant.aws.region,
  });

  const textract = new AWS.Textract();

  const getText = (result, blocksMap) => {
    let text = "";

    if (_.has(result, "Relationships")) {
      result.Relationships.forEach((relationship) => {
        if (relationship.Type === "CHILD") {
          relationship.Ids.forEach((childId) => {
            const word = blocksMap[childId];
            if (word.BlockType === "WORD") {
              text += `${word.Text} `;
            }
            if (word.BlockType === "SELECTION_ELEMENT") {
              if (word.SelectionStatus === "SELECTED") {
                text += `X `;
              }
            }
          });
        }
      });
    }

    return text.trim();
  };

  const getKeyValueMap = (blocks) => {
    const keyValues = {};

    blocks.forEach((block) => {
      if (block.BlockType === "KEY_VALUE_SET") {
        const key = getText(block.Key, blocks);
        const value = getText(block.Value, blocks);
        keyValues[key] = value;
      }
    });

    return keyValues;
  };

  const getTable = (tableResult, blocks) => {
    const table = [];
    if (tableResult && tableResult.Relationships) {
      tableResult.Relationships.forEach((relationship) => {
        if (relationship.Type === "CHILD") {
          relationship.Ids.forEach((childId) => {
            const tableCell = blocks[childId];
            if (tableCell && tableCell.BlockType === "CELL") {
              let row = table[tableCell.RowIndex] || [];
              row[tableCell.ColumnIndex] = getText(tableCell, blocks);
              table[tableCell.RowIndex] = row;
            }
          });
        }
      });
    }
    return table;
  };

  const buffer = async () => {
    const bucket = constant.bucket;
    const name = "tax-invoices/" + filename;
    const params = {
      Document: {
        S3Object: {
          Bucket: bucket,
          Name: name,
        },
      },
      FeatureTypes: ["TABLES", "FORMS", "SIGNATURES"],
    };

    const request = textract.analyzeDocument(params);

    const data = await request.promise();
    if (data && data.Blocks) {
      const keyValues = getKeyValueMap(data.Blocks);

      const tables = [];
      if (data && data.Blocks) {
        data.Blocks.forEach((block) => {
          if (block.BlockType === "TABLE") {
            const table = getTable(block, data.Blocks);
            tables.push(table);
          }
        });
      }

      const processTableData = (tables) => {
        const processedTables = [];
        tables.forEach((table) => {
          const processedTable = [];
          let headerRow = null;
          table.forEach((row) => {
            if (!headerRow) {
              headerRow = row;
            } else {
              processedTable.push(row.slice(1)); // Exclude the first element (null)
            }
          });

          if (headerRow) {
            processedTable.unshift(headerRow.slice(1)); // Exclude the first element (null)
          }

          processedTables.push(processedTable);
        });

        return processedTables;
      };

      const processedTables = processTableData(tables);

      let header = [];
      let rows = [];
      const formCondition = async (table) => {
        for (let i = 0; i < table.length; i++) {
          header.push(table[i][0]);
          let row = [];
          for (let j = 1; j < table[i].length; j++) {
            row.push(table[i][j]);
          }
          rows[i] = row;
        }
      };
      await formCondition(processedTables);

      return {
        error: false,
        message: "Inserting in the database successful",
        data: keyValues,
        header,
        rows,
      };
    }

    return {
      error: true,
      message: "Textract analysis failed",
    };
  };

  const data = await buffer();

  return {
    data,
  };
};

const Textract2 = async (filename,temp) => {
  AWS.config.update({
    accessKeyId: constant.s3Creds.accessKey,
    secretAccessKey: constant.s3Creds.secret,
    region: constant.aws.region,
  });

  const textract = new AWS.Textract();
  const textractClient = new TextractClient({
    region: constant.aws.region,
    credentials: {
      accessKeyId: constant.s3Creds.accessKey,
      secretAccessKey: constant.s3Creds.secret,
    },
  });

  const getText = (result, blocksMap) => {
    let text = "";

    if (_.has(result, "Relationships")) {
      result.Relationships.forEach((relationship) => {
        if (relationship.Type === "CHILD") {
          relationship.Ids.forEach((childId) => {
            const word = blocksMap[childId];
            if (word.BlockType === "WORD") {
              text += `${word.Text} `;
            }
            if (word.BlockType === "SELECTION_ELEMENT") {
              if (word.SelectionStatus === "SELECTED") {
                text += `X `;
              }
            }
          });
        }
      });
    }

    return text.trim();
  };

  const getKeyValueMap = (blocks) => {
    const keyValues = {};

    blocks.forEach((block) => {
      if (block.BlockType === "KEY_VALUE_SET") {
        const key = getText(block.Key, blocks);
        const value = getText(block.Value, blocks);
        keyValues[key] = value;
      }
    });

    return keyValues;
  };

  const getTable = (tableResult, blocks) => {
    const table = [];
    if (tableResult && tableResult.Relationships) {
      tableResult.Relationships.forEach((relationship) => {
        if (relationship.Type === "CHILD") {
          relationship.Ids.forEach((childId) => {
            const tableCell = blocks[childId];
            if (tableCell && tableCell.BlockType === "CELL") {
              let row = table[tableCell.RowIndex] || [];
              row[tableCell.ColumnIndex] = getText(tableCell, blocks);
              table[tableCell.RowIndex] = row;
            }
          });
        }
      });
    }
    return table;
  };

  const buffer = async () => {
    const bucket = constant.bucket;
    const name = temp + filename;
    const params = {
      Document: {
        S3Object: {
          Bucket: bucket,
          Name: name,
        },
      },
      FeatureTypes: ["TABLES", "FORMS", "SIGNATURES"],
    };

    const aExpense = new AnalyzeExpenseCommand(params);
    const data = await textractClient.send(aExpense);

    // if (data && data.ExpenseDocuments[0].Blocks) {
    //   const keyValues = getKeyValueMap(data.ExpenseDocuments[0].Blocks);

    //   const tables = [];
    //   if (data && data.ExpenseDocuments[0].Blocks) {
    //     data.ExpenseDocuments[0].Blocks.forEach((block) => {
    //       if (block.BlockType === "TABLE") {
    //         const table = getTable(block, data.ExpenseDocuments[0].Blocks);
    //         tables.push(table);
    //       }
    //     });
    //   }

    //   const processTableData = (tables) => {
    //     const processedTables = [];
    //     tables.forEach((table) => {
    //       const processedTable = [];
    //       let headerRow = null;
    //       table.forEach((row) => {
    //         if (!headerRow) {
    //           headerRow = row;
    //         } else {
    //           processedTable.push(row.slice(1)); // Exclude the first element (null)
    //         }
    //       });

    //       if (headerRow) {
    //         processedTable.unshift(headerRow.slice(1)); // Exclude the first element (null)
    //       }

    //       processedTables.push(processedTable);
    //     });

    //     return processedTables;
    //   };

    //   const processedTables = processTableData(tables);

    //   let header = [];
    //   let rows = [];
    //   const formCondition = async (table) => {
    //     for (let i = 0; i < table.length; i++) {
    //       header.push(table[i][0]);
    //       let row = [];
    //       for (let j = 1; j < table[i].length; j++) {
    //         row.push(table[i][j]);
    //       }
    //       rows[i] = row;
    //     }
    //   };
    //   await formCondition(processedTables);

    //   return {
    //     error: false,
    //     message: "Inserting in the database successful",
    //     data:keyValues,
    //     header,
    //     rows,
    //   };
    // }

    if(data){

      function parseSummaryFields(summaryFields) {
        let parsedData = {};
        for (const summaryField of summaryFields) {
          const { LabelDetection, ValueDetection } = summaryField;
          let label = LabelDetection ? LabelDetection.Text : "Label";
          let value = ValueDetection ? ValueDetection.Text : "";
    
          const parsedField = {};
          parsedField[label] = value;
          // Add more fields as needed
  
          const parsedDataCopy = {
            ...parsedData,
            ...parsedField,
          };
          parsedData = {};
          parsedData = parsedDataCopy;
        }
        return parsedData;
      }
    //   function parseSummaryFields(summaryFields) {
    //     let parsedData = {};
    //     let keyValueCount = {}; // To track occurrences of each key-value pair
    
    //     for (const summaryField of summaryFields) {
    //         const { LabelDetection, ValueDetection } = summaryField;
    //         let label = LabelDetection ? LabelDetection.Text.trim().toLowerCase() : "label";
    //         let value = ValueDetection ? ValueDetection.Text.trim() : "";
    
    //         // Create a unique identifier for the key-value pair
    //         let uniqueIdentifier = `${label}:${value}`;
    
    //         // Check if the unique identifier already exists
    //         if (keyValueCount[uniqueIdentifier]) {
    //             keyValueCount[uniqueIdentifier]++;
    //             // Append the counter to the label
    //             label = `${label}:${keyValueCount[uniqueIdentifier]}`;
    //         } else {
    //             keyValueCount[uniqueIdentifier] = 1;
    //         }
    
    //         // Add the label and value to parsedData
    //         parsedData[label] = value;
    //     }
    
    //     return parsedData;
    // }
    
  
      function parseLineItemGroups(lineItemGroups) {
        const parsedData = [];
        const headers = new Set(); // Use a Set to ensure unique headers
  
        // Iterate over each line item group
        for (const lineItemGroup of lineItemGroups) {
          const { LineItems } = lineItemGroup;
  
          // Iterate over each line item
          for (const lineItem of LineItems) {
            const { LineItemExpenseFields } = lineItem;
            const parsedLineItem = {};
  
            // Iterate over each expense field
            for (const field of LineItemExpenseFields) {
              // Use the Type.Text as the key and ValueDetection.Text as the value
              parsedLineItem[field.Type.Text] = field.ValueDetection.Text;
              // Add the Type.Text as a header
              headers.add(field.Type.Text);
            }
  
            parsedData.push(parsedLineItem);
          }
        }
  
        // Convert the Set of headers to an array
        const headerArray = [...headers];
  
        return { data2: parsedData, headers: headerArray };
      }
  
      // Parse LineItemGroups data
      const { data2, headers } = parseLineItemGroups(
        data.ExpenseDocuments[0].LineItemGroups
      );
  
      // Display LineItemGroups data as a table
  
      // const parsedExpenseDocuments1 = parseExpenseDocuments(data.ExpenseDocuments[0].Blocks);
      const parsedLineItemGroups2 = parseLineItemGroups(
        data.ExpenseDocuments[0].LineItemGroups
      );
      const parsedSummaryFields3 = parseSummaryFields(
        data.ExpenseDocuments[0].SummaryFields
      );
  
      let headers2 = []
    
      const keys =data2[0]? Object.keys(data2[0]):[]
      keys.pop()
      headers2.push(keys)
     
      let rows = [];
      data2.forEach((obj,index) => {
        let row = [];
        for (const key in obj) {
          row.push(obj[key]);
      }
      row.pop()
      rows.push(row);
      });
      // return data.ExpenseDocuments[0].SummaryFields
      return {
        error: false,
        data: {
          ...parsedSummaryFields3,
        },
        headers: headers2,
        rows: [rows],
      };
    }

    return {
      error: true,
      message: "No data found",
    }
   
  };

  const data = await buffer();

  return {
    data,
  };
};

const uploadToS3 = async (uploadParams) => {
  const credentials = new AWS.Credentials({
    accessKeyId: constant.s3Creds.accessKey,
    secretAccessKey: constant.s3Creds.secret,
    region: constant.aws.region,
  });
  AWS.config.credentials = credentials;

  const s3 = new AWS.S3({
    credentials: credentials,
  });

  const upload = s3.upload(uploadParams).promise();

  const response = await upload
    .then((data) => {
      return {
        error: false,
        message: "Upload Success",
        data: data.Location,
      };
    })
    .catch((err) => {
      return {
        error: true,
        message: "Upload failed",
        data: err.message,
      };
    });

  return response;
};

const pdf = async (filename) => {
  AWS.config.update({
    accessKeyId: constant.s3Creds.accessKey,
    secretAccessKey: constant.s3Creds.secret,
    region: constant.aws.region,
  });

  const textract = new AWS.Textract();

  const bucket = constant.bucket;
  const name = "tax-invoices/" + filename;

  let nextToken = null;
  let pages = [];

  const analyzeDocument = async (bucket, name) => {
    try {
      const params = {
        DocumentLocation: {
          S3Object: {
            Bucket: bucket,
            Name: name,
          },
        },
        // FeatureTypes: ["TABLES", "FORMS", "SIGNATURES"],
      };

      const data = await textract.startExpenseAnalysis(params).promise();

      if (data && data.JobId) {
        let response = await textract
        .getExpenseAnalysis({ JobId: data.JobId, NextToken: nextToken })
        .promise();
        
        do {
          const rep = async () => {
            return await textract
                .getExpenseAnalysis({ JobId: data.JobId, NextToken: nextToken })
                .promise();
        };
    
        if (response.JobStatus == "IN_PROGRESS") {
            console.log("Waiting for 2 seconds...");
            await new Promise(resolve => setTimeout(resolve, 3000));
            response = await rep();
            console.log("this is response",response)
        }
          if (response.JobStatus == "FAILED") {
            break;
          }
          if (response && response.ExpenseDocuments) {
            pages.push(response); 
          }

          nextToken = response.NextToken; 

        } while (nextToken);

        // console.log("Document analysis completed successfully.");
        return pages;
      }
    } catch (err) {
      //  console.error("Error analyzing document:", err);
      //throw err;
    }
  };

  pages = await analyzeDocument(bucket, name);
  
  const getText = (result, blocksMap) => {
    let text = "";

    if (_.has(result, "Relationships")) {
      result.Relationships.forEach((relationship) => {
        if (relationship.Type === "CHILD") {
          relationship.Ids.forEach((childId) => {
            const word = blocksMap[childId];
            if (word.BlockType === "WORD") {
              text += `${word.Text} `;
            }
            if (word.BlockType === "SELECTION_ELEMENT") {
              if (word.SelectionStatus === "SELECTED") {
                text += ` `;
              }
            }
          });
        }
      });
    }

    return text.trim();
  };

  const findValueBlock = (keyBlock, valueMap) => {
    let valueBlock;
    keyBlock.Relationships.forEach((relationship) => {
      if (relationship.Type === "VALUE") {
        // eslint-disable-next-line array-callback-return
        relationship.Ids.every((valueId) => {
          if (_.has(valueMap, valueId)) {
            valueBlock = valueMap[valueId];
            return false;
          }
        });
      }
    });

    return valueBlock;
  };

  const getKeyValueRelationship = (keyMap, valueMap, blockMap) => {
    const keyValues = {};
    const keyMapValues = _.values(keyMap);
    keyMapValues.forEach((keyMapValue) => {
      const valueBlock = findValueBlock(keyMapValue, valueMap);
      const key = getText(keyMapValue, blockMap);
      const value = getText(valueBlock, blockMap);
      keyValues[key] = value;
    });
    return keyValues;
  };

  const getKeyValueMap = (blocks) => {
    const keyMap = {};
    const valueMap = {};
    const blockMap = {};

    let blockId;
    blocks.forEach((block) => {
      blockId = block.Id;
      blockMap[blockId] = block;
      //console.log(block.EntityTypes)
      if (_.includes(block.EntityTypes, "KEY")) {
        keyMap[blockId] = block;
      } else {
        valueMap[blockId] = block;
      }
    });
    return { keyMap, valueMap, blockMap };
  };

  const getTable = (blocksMap, tableResult) => {
    const table = [];
    if (_.has(tableResult, "Relationships")) {
      tableResult.Relationships.forEach((relationship) => {
        if (relationship.Type === "CHILD") {
          relationship.Ids.forEach((childId) => {
            const tableCell = blocksMap[childId];
            if (tableCell.BlockType === "CELL") {
              let row = table[tableCell.RowIndex] || [];
              row[tableCell.ColumnIndex] = getText(tableCell, blocksMap);
              table[tableCell.RowIndex] = row;
            }
          });
        }
      });
    }
    return table;
  };

  // const buffer = async (data) => {
  //   if (data && data.Blocks) {
  //     const { keyMap, valueMap, blockMap } = getKeyValueMap(data.Blocks);
  //     const keyValues = getKeyValueRelationship(keyMap, valueMap, blockMap);

  //     const tables = [];
  //     if (data && data.Blocks) {
  //       const { blockMap } = getKeyValueMap(data.Blocks);
  //       data.Blocks.forEach(async (block) => {
  //         if (block.BlockType === "TABLE") {
  //           const table = getTable(blockMap, block);
  //           tables.push(table);
  //         }
  //       });
  //     }

  //     const processTableData = async (tables) => {
  //       const processedTables = [];
  //       tables.forEach((table) => {
  //         const processedTable = [];
  //         let headerRow = null;
  //         table.forEach((row) => {
  //           if (!headerRow) {
  //             headerRow = row;
  //           } else {
  //             processedTable.push(row.slice(1)); // Exclude the first element (null)
  //           }
  //         });

  //         if (headerRow) {
  //           processedTable.unshift(headerRow.slice(1)); // Exclude the first element (null)
  //         }

  //         processedTables.push(processedTable);
  //       });

  //       return processedTables;
  //     };

  //     // Usage:
  //     const processedTables = await processTableData(tables);

  //     const isMatched = (rowData) => {
  //       for (const value of rowData) {
  //         for (const key in keyValues) {
  //           if (keyValues[key] === value) {
  //             delete keyValues[key];
  //             return true;
  //           }
  //         }
  //       }
  //       return false;
  //     };

  //     // Loop through each row in the table array
  //     for (const row of processedTables) {
  //       for (let i = 0; i < row.length; i++) {
  //         isMatched(row[i]);
  //       }
  //     }

  //     let header = [];
  //     let rows = [];
  //     const formCondition = async (table) => {
  //       //console.log(table)
  //       for (let i = 0; i < table.length; i++) {
  //         header.push(table[i][0]);
  //         let row = [];
  //         for (let j = 1; j < table[i].length; j++) {
  //           row.push(table[i][j]);
  //         }
  //         rows[i] = row;
  //       }
  //     };
  //     await formCondition(processedTables);

  //     header.forEach((item, index) => {
  //       // console.log(item)
  //       //  console.log(rows[index])
  //     });

  //     return {
  //       error: false,
  //       data: keyValues,
  //       header,
  //       rows,
  //     };
  //   }

  //   return {
  //     error: true,
  //     data: undefined,
  //     header,
  //     rows,
  //   };
  // };


  const buffer = async (data) => {
    // const bucket = constant.bucket;
    // const name = "tax-invoices/" + filename;
    // const params = {
    //   Document: {
    //     S3Object: {
    //       Bucket: bucket,
    //       Name: name,
    //     },
    //   },
    //   FeatureTypes: ["TABLES", "FORMS", "SIGNATURES"],
    // };

    // const aExpense = new AnalyzeExpenseCommand(params);
    // const data = await textractClient.send(aExpense);

    // if (data && data.ExpenseDocuments[0].Blocks) {
    //   const keyValues = getKeyValueMap(data.ExpenseDocuments[0].Blocks);

    //   const tables = [];
    //   if (data && data.ExpenseDocuments[0].Blocks) {
    //     data.ExpenseDocuments[0].Blocks.forEach((block) => {
    //       if (block.BlockType === "TABLE") {
    //         const table = getTable(block, data.ExpenseDocuments[0].Blocks);
    //         tables.push(table);
    //       }
    //     });
    //   }

    //   const processTableData = (tables) => {
    //     const processedTables = [];
    //     tables.forEach((table) => {
    //       const processedTable = [];
    //       let headerRow = null;
    //       table.forEach((row) => {
    //         if (!headerRow) {
    //           headerRow = row;
    //         } else {
    //           processedTable.push(row.slice(1)); // Exclude the first element (null)
    //         }
    //       });

    //       if (headerRow) {
    //         processedTable.unshift(headerRow.slice(1)); // Exclude the first element (null)
    //       }

    //       processedTables.push(processedTable);
    //     });

    //     return processedTables;
    //   };

    //   const processedTables = processTableData(tables);

    //   let header = [];
    //   let rows = [];
    //   const formCondition = async (table) => {
    //     for (let i = 0; i < table.length; i++) {
    //       header.push(table[i][0]);
    //       let row = [];
    //       for (let j = 1; j < table[i].length; j++) {
    //         row.push(table[i][j]);
    //       }
    //       rows[i] = row;
    //     }
    //   };
    //   await formCondition(processedTables);

    //   return {
    //     error: false,
    //     message: "Inserting in the database successful",
    //     data:keyValues,
    //     header,
    //     rows,
    //   };
    // }

    if(data){

      function parseSummaryFields(summaryFields) {
        let parsedData = {};
        for (const summaryField of summaryFields) {
          const { LabelDetection, ValueDetection } = summaryField;
          const label = LabelDetection ? LabelDetection.Text : "x";
          const value = ValueDetection ? ValueDetection.Text : "";
          const parsedField = {};
          parsedField[label] = value;
          // Add more fields as needed
  
          const parsedDataCopy = {
            ...parsedData,
            ...parsedField,
          };
          parsedData = {};
          parsedData = parsedDataCopy;
        }
        return parsedData;
      }
  
      function parseLineItemGroups(lineItemGroups) {
        const parsedData = [];
        const headers = new Set(); // Use a Set to ensure unique headers
  
        // Iterate over each line item group
        for (const lineItemGroup of lineItemGroups) {
          const { LineItems } = lineItemGroup;
  
          // Iterate over each line item
          for (const lineItem of LineItems) {
            const { LineItemExpenseFields } = lineItem;
            const parsedLineItem = {};
  
            // Iterate over each expense field
            for (const field of LineItemExpenseFields) {
              // Use the Type.Text as the key and ValueDetection.Text as the value
              parsedLineItem[field.Type.Text] = field.ValueDetection.Text;
              // Add the Type.Text as a header
              headers.add(field.Type.Text);
            }
  
            parsedData.push(parsedLineItem);
          }
        }
  
        // Convert the Set of headers to an array
        const headerArray = [...headers];
  
        return { data2: parsedData, headers: headerArray };
      }
  
      // Parse LineItemGroups data
      const { data2, headers } = parseLineItemGroups(
        data.ExpenseDocuments[0].LineItemGroups
      );
  
      // Display LineItemGroups data as a table
  
      // const parsedExpenseDocuments1 = parseExpenseDocuments(data.ExpenseDocuments[0].Blocks);
      const parsedLineItemGroups2 = parseLineItemGroups(
        data.ExpenseDocuments[0].LineItemGroups
      );
      const parsedSummaryFields3 = parseSummaryFields(
        data.ExpenseDocuments[0].SummaryFields
      );
  
      let headers2 = []
      const keys = Object.keys(data2[0])
      keys.pop()
      headers2.push(keys)
     
      let rows = [];
      data2.forEach((obj,index) => {
        let row = [];
        for (const key in obj) {
          row.push(obj[key]);
      }
      row.pop()
      rows.push(row);
      });
      // return data.ExpenseDocuments[0].SummaryFields
      return {
        error: false,
        data: {
          ...parsedSummaryFields3,
        },
        headers: headers2,
        rows: [rows],
      };
    }

    return {
      error: true,
      message: "No data found",
    }
   
  };

  const temp = {
    Blocks: pages[0],
  };
  //console.log(temp)
  const data = await buffer(pages[0]);
  // data.data = temp

  return {
    data,
  };
};



export default {
  Textract,
  uploadToS3,
  pdf,
  Textract2,
};
