const bodyParser = require("body-parser");
const express = require("express");
require("dotenv").config();
const fs = require("fs");
const mongoose = require("mongoose");
const multer = require("multer");
const path = require("path");
const cors = require("cors");

const lightspeed = require("./lightspeed");
const localPrint = require("./print-automation");

const app = express();
const port = 3000;
const uri = "mongodb://127.0.0.1:27017/image_upload_api";

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cors());


// Mongo Schema for the image
const ImageSchema = new mongoose.Schema({
  email: String,
  filename: String,
  path: String,
});
const Image = mongoose.model("Image", ImageSchema);


// Setup storage for handling image upload from user.
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(
      null,
      file.fieldname + "-" + Date.now() + path.extname(file.originalname)
    );
  },
});
const upload = multer({ storage: storage });


/*
-----------------
  API ENDPOINTS 
----------------- 
*/

// GET / to see if the API is working.
app.get("/", async (req, res) => {
  res.send("Alive");
});

// POST /webhook to catch lightspeed order data and generate PDF
app.post("/webhook", async (req, res) => {
  const order_id = req.body.order.id;
  const pdfFileName = `${order_id}.pdf`;

  lightspeed.generatePDF(order_id).then(({ pdf }) => {
    if (fs.existsSync(pdfFileName)) {
      localPrint.PrintFile(pdfFileName);
    }
  });
  res.sendStatus(200);
});

// POST /upload to handle ID uploaded by the aladdingv user
app.post("/upload", upload.single("image"), async (req, res) => {
  try {
    const { email } = req.body;
    const { filename, path } = req.file;

    // Save the image data to the database
    const image = new Image({ email, filename, path });
    await image.save();

    res.json({ message: "Image uploaded successfully!" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
});

// GET /check/:email for checking if the ID exists in the Mongo Database
app.get("/check/:email", async (req, res) => {
  try {
    const { email } = req.params;

    const image = await Image.findOne({ email });

    if (image) {
      // If the image exists, send the image file
      const imagePath = path.join(__dirname, "uploads", image.filename);
      res.sendFile(imagePath);
    } else {
      res.json({
        exists: false,
        message: "Image does not exist in the database",
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
});

// Function for checking if Node is connected to MongoDB
async function connect() {
  try {
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("Connected to MongoDB");
  } catch (error) {
    console.log("Error", error);
  }
}

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
  connect();
});
