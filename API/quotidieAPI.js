var express = require("express");
var router = express.Router();

// Endpoints
router.route("/get_evangile").get(return_evangile_API);
router.route("/get_saint").get(return_saint_API);

const rp = require("request-promise");
const cheerio = require("cheerio");
const request = require("request");
const Parser = require("rss-parser");
let parser = new Parser();

const allowedOrigins = ["http://127.0.0.1:8000", "http://127.0.0.1:8080", "https://quotidie.netlify.app", "http://127.0.0.1:3000", "https://quotidiev2.netlify.app", "https://quotidie.fr"];

// For the get_saint API
const days = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];
const months = ["janvier", "fevrier", "mars", "avril", "mai", "juin", "juillet", "aout", "septembre", "octobre", "novembre", "decembre"];

// send notifs to user stored in firebase

function return_evangile_API(req, resp) {
    // Allow CORS stuff
    const origin = req.headers.origin;
    if (allowedOrigins.includes(origin)) {
        resp.setHeader("Access-Control-Allow-Origin", origin);
    }
    resp.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, PATCH, DELETE");
    resp.setHeader("Access-Control-Allow-Headers", "X-Requested-With,content-type");
    resp.setHeader("Access-Control-Allow-Credentials", true);

    (async () => {
        let evangile = await get_evangile_promise();
        resp.json(evangile);
    })().catch((err) => resp.json(null));
}

function get_evangile_promise() {
    return new Promise(function (resolve, reject) {
        (async () => {
            let feed = await parser.parseURL("https://rss.aelf.org/evangile");
            let evangile = {};
            evangile.title = "Title not found.";
            evangile.text = "Text not found.";
            if (feed.items.length == 1 || feed.items.length == 2) {
                evangile.title = feed.items[0].title;
                evangile.text = feed.items[0].content;
            } else {
                evangile.title = feed.items[3].title;
                evangile.text = feed.items[3].content;
            }
            resolve(evangile);
        })().catch((err) => {
            console.error(err);
            reject();
        });
    });
}

function return_saint_API(req, resp) {
    // Allow CORS stuff
    const origin = req.headers.origin;
    if (allowedOrigins.includes(origin)) {
        resp.setHeader("Access-Control-Allow-Origin", origin);
    }
    resp.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, PATCH, DELETE");
    resp.setHeader("Access-Control-Allow-Headers", "X-Requested-With,content-type");
    resp.setHeader("Access-Control-Allow-Credentials", true);

    (async () => {
        let evangile = await get_saint_promise();
        resp.json(evangile);
    })().catch((err) => resp.json(null));
}

function get_saint_promise() {
    var d = new Date();
    var day_m = d.getDate();
    var day = d.getDay();
    var month = d.getMonth();
    let url2 = days[day] + "-" + day_m + "-" + months[month];
    let url = "https://fr.aleteia.org/daily-prayer/" + url2 + "/";

    return new Promise(function (resolve, reject) {
        console.log(url);
        rp(url)
            .then(function (body) {
                const $ = cheerio.load(body);
                console.log($(".css-1tmjk0q")["0"]);
                let saint = {};
                saint.title = $(".css-18agi3i")["0"].children[0].data;
                saint.subtitle = $(".css-ygkx0p")["0"].children[0] != undefined ? $(".css-ygkx0p")["0"].children[0].data : "";
                saint.image_url = $(".css-7rn6ci")["0"].attribs.src;
                resolve(saint);
            })
            .catch(function (err) {
                console.log(err);
                reject();
            });
    });
}

module.exports = router;
