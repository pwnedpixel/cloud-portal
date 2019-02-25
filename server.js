const express = require("express");
const os = require("os");
const app = express();
var bodyParser = require("body-parser");
const format = require("util").format;
var uuid = require("uuid");

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

var port = process.env.PORT || 3003;
var router = express.Router();

app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

router
    .get("/", (req, res) => {
        res.send("success");
    })

	// Sample post
    .post("/test", (req, res) => {
        res.send(req.body.paramname);
    });

// This will serve the webpage
app.use(express.static("./public"));
app.use("/api", router);
app.listen(port, () => console.log("Listening on port " + port));
