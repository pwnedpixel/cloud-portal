const express = require("express");
const os = require("os");
const app = express();
var bodyParser = require("body-parser");
const format = require("util").format;
var uuid = require("uuid");
var mysql = require('mysql');

var CloudUsageHelper = require('./CloudUsageHelper.js');
var UsageCalculator = require('./UsageCalculator.js');

if (process.env.ENVIRO != "PROD") {
    require('dotenv').config()
}

var CUH = new CloudUsageHelper(process.env.CUM_HOST);
var UsageCalc = new UsageCalculator();

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
        connection.query("SELECT EVENT_TYPE, EVENT_TIME, VM_TYPE, VM_ID FROM cloudass2.EVENTS WHERE CC_ID = ? ORDER BY VM_ID,EVENT_TIME", req.body.cc_id, (err, rows, fields) => {
            if (err) throw err;
            try {
                // VMs are returned in order of VM_ID
                // Partitioning into groups based on VM_ID.
                var uniqueVMs = new Set();
                var switchIndices = [];
                for (var i = 0; i < rows.length; i++) {
                    if (!(uniqueVMs.has(rows[i].VM_ID))){
                        uniqueVMs.add(rows[i].VM_ID);
                        switchIndices.push(i);
                    }
                }
                // Add VM groupings.
                var groups = [];
                for (var i = 0; i < switchIndices.length-1; i++) {
                    groups.push(rows.slice(switchIndices[i], switchIndices[i+1]));
                }
                // Add last VM event grouping.
                if (switchIndices[switchIndices.length-1] != rows.length-1) {
                    groups.push(rows.slice(switchIndices[switchIndices.length-1], rows.length));
                }
                else {
                    groups.push([rows[rows.length-1]]);
                }

                var totalUsage = {
                    basic: 0,
                    large: 0,
                    ultra: 0
                };
                // Calculate usages for each VM.
                for (var i = 0; i < groups.length; i++) {
                    var usages = UsageCalc.calculateUsages(groups[i]);
                    totalUsage.basic += usages.basicUsage;
                    totalUsage.large += usages.largeUsage;
                    totalUsage.ultra += usages.ultraUsage;
                }
                // Calculate total charges by multiplying by specified rate.
                var charges = {
                    basicCharges: Math.floor(totalUsage.basic*0.05 * 100) / 100,
                    largeCharges: Math.floor(totalUsage.large*0.10 * 100) / 100,
                    ultraCharges: Math.floor(totalUsage.ultra*0.15 * 100) / 100
                }
                return res.json(charges);
            } catch (e) {
                console.log(e);
                return res.json({error: e});
            }
        });
    });

vm
    .get("/:cc_id", (req, res) => {
        var cc_id = req.params.cc_id;
        connection.query("SELECT * FROM cloudass2.VIRTUAL_MACHINES WHERE CC_ID = '"+cc_id+"';", function (err, rows, fields) {
            if (err) {
                return res.json({success: false});
            } else {
                var vmList = []
                for (var row of rows) {
                    vmList.push(row);
                }
                res.json(JSON.stringify(vmList));
            }
        });
    })
    .post("/create", (req, res) => {
        connection.query("INSERT INTO `cloudass2`.`VIRTUAL_MACHINES` (`CC_ID`, `VM_TYPE`, `VM_STATE`) VALUES ('"+req.body.cc_id+"', '"+req.body.vm_type+"', 'STOP');", function (err, rows, fields) {
            if (err) {
                console.log(err)
                return res.json({success: false});
                throw err;
            } else {
                CUH.logEvent(req.body.cc_id, rows.insertId, "CREATE", req.body.vm_type);
                return res.json({success: true});
            }
          });
    })
    .post("/start", (req, res) => {
        connection.query("UPDATE `cloudass2`.`VIRTUAL_MACHINES` SET `VM_STATE` = 'START' WHERE (`VM_ID` = ?)", req.body.vm_id, function (err, rows, fields) {
            if (err) {
                throw err;
                return res.json({success: false});
            } else {
                CUH.logEvent(req.body.cc_id, req.body.vm_id, "START", req.body.vm_type);
                return res.json({success: true});
            }
          });
    })
    .post("/stop", (req, res) => {
        connection.query("UPDATE `cloudass2`.`VIRTUAL_MACHINES` SET `VM_STATE` = 'STOP' WHERE (`VM_ID` = ?)", req.body.vm_id, function (err, rows, fields) {
            if (err) {
                throw err;
                return res.json({success: false});
            } else {
                CUH.logEvent(req.body.cc_id, req.body.vm_id, "STOP", req.body.vm_type);
                return res.json({success: true});
            }
          });
    })
    .post("/delete", (req, res) => {
        var insertParams = [req.body.vm_id, req.body.cc_id];
        connection.query("DELETE FROM `cloudass2`.`VIRTUAL_MACHINES` WHERE (`VM_ID` = '"+req.body.vm_id+"');", function (err, rows, fields) {
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
        var insertParams = [req.body.cc_id, req.body.vm_id];
        connection.query("SELECT EVENT_TIME, EVENT_TYPE, VM_TYPE FROM cloudass2.EVENTS WHERE CC_ID = ? AND VM_ID = ?", insertParams, (err, rows, fields) => {
            if (err) throw err;
            try {
                var usages = UsageCalc.calculateUsages(rows);
                return res.json(usages);
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
