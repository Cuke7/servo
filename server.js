// http-server -p8000 -c-1

const express = require("express");
const app = express();
var router = express.Router();


app.listen(process.env.PORT || 8080, () => {
    console.log("Listening to requests on" + process.env.PORT);
});

const sendSeekable = require("send-seekable");
app.use(sendSeekable);

app.use("/", require("./API"));
app.use(express.static("public"));
