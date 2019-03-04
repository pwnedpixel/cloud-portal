const express = require("express");
const os = require("os");
const app = express();
var bodyParser = require("body-parser");
const format = require("util").format;
var uuid = require("uuid");
var mysql = require('mysql');

var CloudUsageHelper = require('./CloudUsageHelper.js');
var ChargeCalculator = require('./ChargeCalculator.js');

if (process.env.ENVIRO != "PROD") {
    require('dotenv').config()
}

var CUH = new CloudUsageHelper(process.env.CUM_HOST);
var ChargeCalc = new ChargeCalculator();

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
    });

user
    .post("/login", (req, res) => {
        var insertParams = [req.body.user, req.body.password];
        connection.query("SELECT * FROM USERS WHERE USER_ID = ? AND USER_PASSWORD = ?", insertParams, function (err, rows, fields) {
            if (err) throw err;
            if (rows.length > 0) {
                return res.json({success: true, cc_id: rows[0].CC_ID});
            }
            return res.json({success: false});
          })
    })
    .post("/charges", (req, res) => {
        connection.query("SELECT EVENT_TYPE, EVENT_TIME, VM_TYPE FROM cloudass2.EVENTS WHERE CC_ID = ?", req.body.cc_id, (err, rows, fields) => {
            if (err) throw err;
            try {
                var totalCharges = ChargeCalc.calculateCharges(rows);
                return res.json({charges: totalCharges})
            } catch (e) {
                console.log(e);
                return res.json({error: e});
            }
        });
    });

vm
    .post("/create", (req, res) => {
        var insertParams = [req.body.cc_id, req.body.vm_type];
        connection.query("INSERT INTO `cloudass2`.`VIRTUAL_MACHINES` (`CC_ID`, `VM_TYPE`) VALUES (?, ?)", insertParams, function (err, rows, fields) {
            if (err) {
                return res.json({success: false});
                throw err;
            } else {
                CUH.logEvent(req.body.cc_id, rows.insertId, "CREATE", req.body.vm_type);
                return res.json({success: true});
            }
          });
    })
    .post("/start", (req, res) => {
        CUH.logEvent(req.body.cc_id, req.body.vm_id, "START", req.body.vm_type);
        return res.json({success: true});
    })
    .post("/stop", (req, res) => {
        CUH.logEvent(req.body.cc_id, req.body.vm_id, "STOP", req.body.vm_type);
        return res.json({success: false});
    })
    .post("/delete", (req, res) => {
        var insertParams = [req.body.vm_id, req.body.cc_id];
        connection.query("DELETE FROM `cloudass2`.`VIRTUAL_MACHINES` WHERE (`VM_ID` = ? AND `CC_ID` = ?)", insertParams, function (err, rows, fields) {
            if (err) {
                throw err;
                return res.json({success: false});
            } else {
                CUH.logEvent(req.body.cc_id, req.body.vm_id, "DELETE", req.body.vm_type);
                return res.json({success: true});
            }
          });
    })
    .post("/upgrade", (req, res) => {
        var insertParams = [req.body.vm_type, req.body.vm_id];
        connection.query("UPDATE `cloudass2`.`VIRTUAL_MACHINES` SET `VM_TYPE` = ? WHERE (`VM_ID` = ?)", insertParams, function (err, rows, fields) {
            if (err) throw err;
            else {
                CUH.logEvent(req.body.cc_id, req.body.vm_id, "SCALE", req.body.vm_type);
                return res.json({success: true});
            }
        });
    })
    .post("/downgrade", (req, res) => {
        var insertParams = [req.body.vm_type, req.body.vm_id];
        connection.query("UPDATE `cloudass2`.`VIRTUAL_MACHINES` SET `VM_TYPE` = ? WHERE (`VM_ID` = ?)", insertParams, function (err, rows, fields) {
            if (err) throw err;
            else {
                CUH.logEvent(req.body.cc_id, req.body.vm_id, "SCALE", req.body.vm_type);
                return res.json({success: true});
            }
        });
    })
    .post("/usage", (req, res) => {
        var insertParams = [req.body.user, req.body.vm_id];
        connection.query("SELECT EVENT_TIME, EVENT_TYPE, VM_TYPE FROM cloudass2.EVENTS WHERE CC_ID = ? AND VM_ID = ?", insertParams, (err, rows, fields) => {
            if (err) throw err;
            try {
                var totalCharges = ChargeCalc.calculateCharges(rows);
                return res.json({charges: totalCharges})
            } catch (e) {
                console.log(e);
                return res.json({error: e});
            }
        });
    });

// This will serve the webpage
app.use(express.static("./src"));
app.use("/api", router);
app.use("/user", user);
app.use("/vm", vm);
app.listen(port, () => console.log("Listening on port " + port));
