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
var user = express.Router();
var vm = express.Router();
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

user
    .post("/login", (req, res) => {
        connection.query("SELECT * FROM USERS WHERE USER_ID = '" + req.body.user + "' AND USER_PASSWORD = '" + req.body.password + "'", function (err, rows, fields) {
            if (err) throw err
            if (rows.length > 0) {
                return res.json({success: true});
            }
            return res.json({success: false});
          })
    })
    .post("/charges", (req, res) => {
        connection.query("SELECT EVENT_TYPE, EVENT_TIME, VM_TYPE FROM cloudass2.EVENTS WHERE CC_ID = '" + req.body.user + "'", (err, rows, fields) => {
            if (err) throw err;
            var totalCharges = 0;
            if (rows.length > 0) {
                try {
                    var prevEventType = rows[0].EVENT_TYPE;
                    var vmType = rows[0].VM_TYPE;
                    var prevTime = new Date(rows[0].EVENT_TIME).getTime();
                    for (var i = 1; i < rows.length; i++) {
                        var currTime = new Date(rows[i].EVENT_TIME).getTime();
                        var currType = rows[i].EVENT_TYPE;

                        // This is probably broken a lil
                        if (!(prevEventType == "STOP" || currType == "START")) {
                            var deltaTime = (currTime-prevTime)/60000;
                            prevTime = currTime;
                            switch (vmType) {
                                case "BASIC":
                                    totalCharges += deltaTime*0.05;
                                    break;
                                case "LARGE":
                                    totalCharges += deltaTime*0.10;
                                    break;
                                case "ULTRA":
                                    totalCharges += deltaTime*0.15;
                                    break;
                                default:
                                    break;
                            }
                        } else if (prevEventType == "STOP" && currType == "START") {
                            prevTime = currTime;
                        }

                        vmType = rows[i].VM_TYPE;
                        prevEventType = currType;
                    }
                    return res.json({charges: totalCharges})
                } catch (e) {
                    console.log(e);
                    return res.json({error: e});
                }
            }
        });
    });

vm
    .post("/create", (req, res) => {
        return res.json({success: false});
    })
    .post("/start", (req, res) => {
        return res.json({success: false});
    })
    .post("/stop", (req, res) => {
        return res.json({success: false});
    })
    .post("/delete", (req, res) => {
        return res.json({success: false});
    })
    .post("/upgrade", (req, res) => {
        return res.json({success: false});
    })
    .post("/downgrade", (req, res) => {
        return res.json({success: false});
    })
    .post("/usage", (req, res) => {
        return res.json({success: false});
    });

// This will serve the webpage
app.use(express.static("./src"));
app.use("/api", router);
app.use("/user", user);
app.use("/vm", vm);
app.listen(port, () => console.log("Listening on port " + port));
