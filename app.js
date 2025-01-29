const express = require("express");
const cors = require("cors");
const fs = require("fs");
const multer = require("multer");
const path = require("path");
const Tesseract = require("tesseract.js");
const sharp = require("sharp");

const tessdataPath = path.join(__dirname, "tessdata");

const app = express();
app.use(cors());
app.use(express.json());

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./tiff");
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  },
});

const upload = multer({
  storage: storage,
  fileFilter: function (req, file, cb) {
    const filetype = file.originalname.split(".").pop();
    if (filetype !== "jpg") {
    }
    cb(null, true);
  },
});

app.post("/upload", upload.single("file"), (req, res) => {
  res.json({ file: req.file });
});

app.post("/ocrData", async (req, res) => {
  const images = req.body.filenames;
  var result = [];
  

  for(let index=0;index<images.length;index++) {
   
      

      const imagePath = path.join(__dirname, "tiff", images[index].filename);
     
      try{

      
      const { data: { text } } =await Tesseract.recognize(
        imagePath, // Path to the image
        "e13b", // Custom language traineddata file
        {
          // logger: (info) => console.log(info), // Log progress
          langPath: tessdataPath, // Path to the tessdata folder
        }
      );
      const value = text.split("\n").filter((line) => line.trim().length > 0);
      const ocrData = value.pop();
      // console.log(ocrData.length);
      if(ocrData!=null && ocrData.length>5){

        result.push(ocrData);
      }
    }catch(error){
      console.error("Error:", error);
    }

    
  };
  res.json({ result: result.filter((data) => data!=null) });
});

app.post("/toJpg", (req, res) => {
  const images = req.body.filenames;

  images.forEach((image) => {
    try {
      const input = path.join(__dirname, "tiff", image.filename);
      const output = path.join(
        __dirname,
        "images",
        image.filename.replace(".tif", ".jpg")
      );
      const output2 = path.join(
        __dirname,
        "B&Wimages",
        image.filename.replace(".tif", ".jpg")
      );
      sharp(input)
        .jpeg({ quality: 100 })
        .toFile(output, (err, info) => {
          // console.log(err, info);
        });
      sharp(input)
        .greyscale()
        .jpeg({ quality: 100 })
        .toFile(output2, (err, info) => {
          // console.log(err, info);
        });
    } catch (error) {
      console.error(error);
    }
  });
  res.json({ message: "Success" });
});
// app.get("/images/:file", (req, res) => {
//   const image = path.join(__dirname, "images", req.params.file);
//   res.sendFile(image);
// })

app.post("uploadthis" , upload.single("file"), (req, res) => {
  res.json({ file: req.file });
});

app.use("/images", express.static(path.join(__dirname, "images")));
app.use("/tiff", express.static(path.join(__dirname, "tiff")));
app.use("/B&Wimages", express.static(path.join(__dirname, "B&Wimages")));

app.listen(5000, () => {
  console.log("Server started on port 5000");
});
