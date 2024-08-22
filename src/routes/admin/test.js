import express from "express";
import knex from "../../../src/config/mysql_db.js";
const router = express.Router();

router.get("/test", (req, res) => {
  res.send("Hello Node js!");
});

router.post("/image", async (req, res) => {
  console.log(req.body.tax_details);
  try {
    // Read the image file as a buffer
    const imageBuffer = req.body.tax_details[0];
    const imageBuffer2 = req.body.tax_details[1];

    //const imageBuffer = "123";

    // Insert the blob data into the database using Knex
    const result = await knex("images").insert({ image: imageBuffer });
    const result2 = await knex("images").insert({ image: imageBuffer2 });

    console.log("Image inserted successfully. Inserted ID:", result[0]);
    return res.json({ insertedId: result[0], insertid2nd: result2[0] });
  } catch (error) {
    console.error("Error inserting image:", error);
  } finally {
    // Close the database connection
    // knex.destroy();
  }

  return res.json({ message: "nothing happened" });
});

export default router;
