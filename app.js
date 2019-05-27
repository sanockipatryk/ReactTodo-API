const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");

const app = express();
app.use(cors());

app.get("/api/", (req, res) => {
  res.json({
    message: "Welcome!"
  });
});

app.listen(5000);
