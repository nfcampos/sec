const fetch = require("node-fetch");
const cheerio = require("cheerio");
const express = require("express");

async function transform(url) {
  const res = await fetch(url, { compress: true });
  const prefix = res.url
    .split("/")
    .slice(0, -1)
    .join("/");
  const $ = cheerio.load(await res.text());
  $("head").append(
    '<meta name="viewport" content="initial-scale=1, maximum-scale=1, minimum-scale=1">'
  );
  $("head").append(
    `
<style>
* {
  box-sizing: border-box;
}

body {
  padding: 0;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen",
    "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue",
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;

  font-size: 18px;
  line-height: 29px;
  color: #333333;
  background-color: white;
  max-width: 800px;
  margin: 0 auto;
}

body.wb {
  background-color: black;
  color: #f2f2f2;
}

text {
  display: block;
  padding-left: 19px;
  padding-right: 19px;
}

font {
  font: inherit;
}

text > div {
  border: none !important;
}

table {
  color: inherit;
  font-size: inherit;
  line-height: inherit;
  border-collapse: collapse;
}

text > p, table {
  margin-top: 1em;
  margin-bottom: 1em;
}

.wb a {
  color: aqua;
}

.button {
  position: fixed;
  opacity: 1;
  background-color: #333333;
  color: white;
  padding: 5px 10px;
  text-decoration: underline;
  width: 55px;
  cursor: pointer;
  user-select: none;
  right: 0;

}

.wb .button {
  color: black;
  background-color: #AAAAAA;
}

.toc-button {
  bottom: 30px;
}

.wb-button {
  bottom: 70px;
}

.tr-heading {
  background-color: #cceeff;
}

.wb .tr-heading {
  background-color: rgb(3, 62, 170);
}
</style>
`
  );
  // fix img urls
  $("img").attr("src", (i, val) => prefix + "/" + val);
  // remove empty p, font
  $("font")
    .filter((i, el) => {
      const $el = $(el);
      return $el.children().length === 0 && $el.text().trim() === "";
    })
    .remove();
  $("p")
    .filter((i, el) => {
      const $el = $(el);
      return $el.children().length === 0 && $el.text().trim() === "";
    })
    .remove();
  // remove repeated style on every p and table
  $("p").removeAttr("style");
  $("font").removeAttr("size");
  $("font").removeAttr("style");
  $("table").removeAttr("style");
  // remove links to TOC
  $("h5").remove();
  // replace light blue table color with class
  $('tr[bgcolor="#cceeff"]')
    .removeAttr("bgcolor")
    .addClass("tr-heading");
  // remove fixed width
  $("div").css({ width: "initial" });

  // add toc button
  $("body").append(`<a class="toc-button button" href="#toc">TOC</a>`);
  // add theme button
  $("body").append(
    `<div class="wb-button button" onclick="document.body.classList.toggle('wb');">B/W</a>`
  );
  // set theme to black
  $("body").addClass("wb");
  return $.html();
}

const app = express();

app.get("*", async function search(req, res) {
  const html = await transform(
    req.query.q.startsWith("http")
      ? req.query.q
      : `https://www.google.com/search?btnI&q=sec%20s1%20${req.query.q}`
  );
  res.send(html);
});

module.exports = app;
