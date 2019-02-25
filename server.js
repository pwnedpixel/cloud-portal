const express = require("express");
const os = require("os");
const app = express();
var bodyParser = require("body-parser");
const format = require("util").format;
var uuid = require("uuid");
var mysql = require('mysql');

if (process.env.ENVIRO != "PROD") {
    require('dotenv').config()
}

var connection = mysql.createConnection({
    host     : process.env.DB_HOST,
    user     : process.env.DB_USER,
    password : process.env.DB_PASS,
    database : process.env.DB
  });

connection.connect()

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

var port = process.env.PORT || 3003;
var login = express.Router();
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

login
    .post("/", (req, res) => {
        connection.query("SELECT * FROM USERS WHERE USER_ID = '" + req.body.user + "' AND USER_PASSWORD = '" + req.body.password + "'", function (err, rows, fields) {
            if (err) throw err
            if (rows.length > 0) {
                return res.send("True");
            }
            return res.send("False");
          })
    });

// This will serve the webpage
app.use(express.static("./src"));
app.use("/api", router);
app.use("/login", login);
app.listen(port, () => console.log("Listening on port " + port));
