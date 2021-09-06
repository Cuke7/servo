var express = require("express");
var router = express.Router();

const rp = require("request-promise");
const request = require("request");

const ytdl = require("ytdl-core");
const sendSeekable = require("send-seekable");

const allowedOrigins = ["http://127.0.0.1:8000", "http://127.0.0.1:8080", "https://auditere.netlify.app", "http://127.0.0.1:3000", "https://auditerev2.netlify.app"];

// Endpoints
router.route("/get_playlist").get(get_playlist);
router.route("/get_audio").get(get_audio);
router.route("/get_infos").get(get_infos);
router.route("/get_search_results").get(get_search_results);
router.route("/get_refinements").get(get_refinements);

// Get youtube search suggestions
async function get_refinements(req, resp) {
    const origin = req.headers.origin;
    if (allowedOrigins.includes(origin)) {
        resp.setHeader("Access-Control-Allow-Origin", origin);
    }
    resp.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, PATCH, DELETE");
    resp.setHeader("Access-Control-Allow-Headers", "X-Requested-With,content-type");
    resp.setHeader("Access-Control-Allow-Credentials", true);

    let body = await rp("https://www.youtube.com/results?search_query=" + decodeURI(req.query.search));

    start = body.indexOf("var ytInitialData = ");
    end = body.indexOf("</script>", start);

    let obj = body.substring(start + 20, end - 1);
    let data = JSON.parse(obj);

    //let data2 = data.contents.twoColumnSearchResultsRenderer.primaryContents.sectionListRenderer.contents[0].itemSectionRenderer.contents;

    let refinements = data.refinements;

    if (refinements == undefined) {
        refinements = [];
    }

    //console.log(results)
    resp.json(refinements);
}

// Get playlist object from playlist url
async function get_playlist(req, resp) {
    const origin = req.headers.origin;
    if (allowedOrigins.includes(origin)) {
        resp.setHeader("Access-Control-Allow-Origin", origin);
    }
    resp.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, PATCH, DELETE");
    resp.setHeader("Access-Control-Allow-Headers", "X-Requested-With,content-type");
    resp.setHeader("Access-Control-Allow-Credentials", true);

    if (decodeURI(req.query.url.length) > 0) {
        //console.log(decodeURI(req.query.url));

        let body = await rp(decodeURI(req.query.url));

        let start = body.indexOf("var ytInitialData = ");
        let end = body.indexOf("</script>", start);
        let obj = body.substring(start + 20, end - 1);

        let ytdata = JSON.parse(obj);

        if (ytdata.contents == undefined) {
            resp.json(null);
            return;
        }

        let data = ytdata.contents.twoColumnBrowseResultsRenderer.tabs[0].tabRenderer.content.sectionListRenderer.contents[0].itemSectionRenderer.contents[0].playlistVideoListRenderer.contents;

        let playlist = [];

        for (const item of data) {
            playlist.push({
                title: item.playlistVideoRenderer.title.runs[0].text,
                thumbnail: item.playlistVideoRenderer.thumbnail.thumbnails[0].url,
                id: item.playlistVideoRenderer.videoId,
                duration: item.playlistVideoRenderer.lengthText.simpleText,
                artist: item.playlistVideoRenderer.shortBylineText.runs[0].text,
            });
        }

        resp.json({ name: ytdata.metadata.playlistMetadataRenderer.title, playlist: playlist });
    } else {
        resp.json(null);
    }
}

// Pipe audio buffer corresponding to the video ID to the client

// keep user agent up to date with some magic
const DEFAULT_HEADERS = {
    "User-Agent": getFirefoxUserAgent(),
    "Accept-Language": "en-US,en;q=0.5",
};
function getFirefoxUserAgent() {
    let date = new Date();
    let version = (date.getFullYear() - 2018) * 4 + Math.floor(date.getMonth() / 4) + 58 + ".0";
    return `Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:${version} Gecko/20100101 Firefox/${version}`;
}

async function get_audio(req, resp) {
    const origin = req.headers.origin;
    if (allowedOrigins.includes(origin)) {
        resp.setHeader("Access-Control-Allow-Origin", origin);
    }
    resp.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, PATCH, DELETE");
    resp.setHeader("Access-Control-Allow-Headers", "X-Requested-With,content-type");
    resp.setHeader("Access-Control-Allow-Credentials", true);
    let id = decodeURI(req.query.id);
    let url = "https://www.youtube.com/watch?v=" + id;

    let info = await ytdl.getInfo(id);

    let format = ytdl.chooseFormat(info.formats, { quality: "highestaudio" });
    let type = "audio/mpeg";
    let size = format.contentLength;

    let stream = ytdl(url, {
        format: format,
        requestOptions: {
            headers: DEFAULT_HEADERS,
        },
    });

    resp.sendSeekable(stream, {
        type: type,
        length: size,
    });
}

async function get_search_results(req, resp) {
    const origin = req.headers.origin;
    if (allowedOrigins.includes(origin)) {
        resp.setHeader("Access-Control-Allow-Origin", origin);
    }
    resp.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, PATCH, DELETE");
    resp.setHeader("Access-Control-Allow-Headers", "X-Requested-With,content-type");
    resp.setHeader("Access-Control-Allow-Credentials", true);

    let body = await rp("https://www.youtube.com/results?search_query=" + decodeURI(req.query.search));

    start = body.indexOf("var ytInitialData = ");
    end = body.indexOf("</script>", start);

    let obj = body.substring(start + 20, end - 1);
    let data = JSON.parse(obj);

    //let data2 = data.contents.twoColumnSearchResultsRenderer.primaryContents.sectionListRenderer.contents[0].itemSectionRenderer.contents;

    let contents = data.contents.twoColumnSearchResultsRenderer.primaryContents.sectionListRenderer.contents;

    for (const content of contents) {
        if (content.hasOwnProperty("itemSectionRenderer")) {
            if (content.itemSectionRenderer.contents.length > 1) {
                data2 = content.itemSectionRenderer.contents;
            }
        }
    }

    let results = [];

    for (const item of data2) {
        if (item.hasOwnProperty("videoRenderer")) {
            if (item.videoRenderer.lengthText) {
                if (item.videoRenderer.ownerBadges) {
                    if (item.videoRenderer.ownerBadges[0].metadataBadgeRenderer.icon.iconType == "OFFICIAL_ARTIST_BADGE")
                        results.push({
                            title: item.videoRenderer.title.runs[0].text,
                            thumbnail: item.videoRenderer.thumbnail.thumbnails[1].url,
                            id: item.videoRenderer.videoId,
                            duration: item.videoRenderer.lengthText.simpleText,
                            artist: item.videoRenderer.ownerText.runs[0].text,
                        });
                }
            }
        }
    }
    //console.log(results)
    resp.json(results);
}

async function get_infos(req, resp) {
    const origin = req.headers.origin;
    if (allowedOrigins.includes(origin)) {
        resp.setHeader("Access-Control-Allow-Origin", origin);
    }
    resp.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, PATCH, DELETE");
    resp.setHeader("Access-Control-Allow-Headers", "X-Requested-With,content-type");
    resp.setHeader("Access-Control-Allow-Credentials", true);
    let id = decodeURI(req.query.id);
    let url = "https://www.youtube.com/watch?v=" + id;

    let info = await ytdl.getInfo(id);

    resp.json({ title: info.videoDetails.title, artist: info.videoDetails.ownerChannelName, id: id, thumbnail: info.videoDetails.thumbnails[info.videoDetails.thumbnails.length - 1].url, duration: Math.floor(info.videoDetails.lengthSeconds/60)+':'+info.videoDetails.lengthSeconds%60 });
}

module.exports = router;
