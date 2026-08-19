const multer = require("multer");
const path = require("path");

const storage = multer.memoryStorage();

const upload = multer({
  storage,

  limits: {
    fileSize: 5 * 1024 * 1024,
  },

  fileFilter: (req, file, cb) => {
    console.log("📁 File received:");
    console.log("Name:", file.originalname);
    console.log("MIME:", file.mimetype);

    const allowedExtensions = [
      ".jpeg",
      ".jpg",
      ".png",
      ".gif",
      ".webp",
    ];

    const extension = path.extname(file.originalname).toLowerCase();

    const isValidExtension =
      allowedExtensions.includes(extension);

    const isValidMime =
      file.mimetype.startsWith("image/") ||
      file.mimetype === "application/octet-stream";

    if (isValidExtension && isValidMime) {
      cb(null, true);
    } else {
      cb(
        new Error(
          "Only JPEG, JPG, PNG, GIF, and WEBP images are allowed"
        )
      );
    }
  },
});

module.exports = upload;