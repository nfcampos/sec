const fetch = require('node-fetch')
const cheerio = require('cheerio')
const express = require('express')
const compression = require('compression')

const app = express()

app.use(compression())

async function transform(url) {
  const res = await fetch(url)
  const prefix = res.url.split('/').slice(0, -1).join('/')
  const $ = cheerio.load(await res.text())
  $('head').append(
'<meta name="viewport" content="initial-scale=1, maximum-scale=1, minimum-scale=1">')
  $('head').append(
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
  )
  // fix img urls
  $('img').attr('src', (i, val) => prefix + '/' + val)
  // remove empty p
  $('p').filter((i, el) => {
    const $el = $(el)
    return $el.children().length === 0 && $el.text().trim() === ''
  }).remove()
  // remove repeated style on every p and table
  $('p').removeAttr('style')
  $('table').removeAttr('style')
  // remove links to TOC
  $('h5').remove()
  // replace light blue table color with class
  $('tr[bgcolor="#cceeff"]').removeAttr('bgcolor').addClass('tr-heading')
  // remove fixed width
  $('div').css({width: 'initial'})

  // add toc button
  $('body').append(`<a class="toc-button button" href="#toc">TOC</a>`)
  // add theme button
  $('body').append(`<div class="wb-button button" onclick="document.body.classList.toggle('wb');">B/W</a>`)
  // set theme to black
  $('body').addClass('wb')
  return $.html()
}

app.get('/', async function(req, res) {
  res.send(`
    <!DOCTYPE html>
    <html lang="en" dir="ltr">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="initial-scale=1, maximum-scale=1, minimum-scale=1">
        <title>Reads</title>
        <style media="screen">
          body {
            margin: 0;
            padding: 0;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen",
              "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue",
              sans-serif;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;

            font-size: 17px;
            line-height: 22px;
            color: #333333;
            background-color: white;
          }

          body.wb {
            background-color: black;
            color: #CCCCCC;
          }

          * {
            box-sizing: border-box;
          }

          input {
            border-radius: 4px;
            border: 1px solid #333333;
            padding: 10px;
            font-size: inherit;
            width: 100%;
            color: inherit;
            background-color: inherit;
          }

          .wb {

          }

          form {
            width: 100%;
            padding: 100px 20px 0;
          }
        </style>
      </head>
      <body class="wb">
        <form action="/s1" method="get">
          <input type="text" name="company" placeholder="eg. farfetch" value="">
        </form>
      </body>
    </html>
`)
})

app.get('/s1', async function(req, res) {
  const html = await transform(`https://www.google.com/search?btnI&q=sec%20s1%20${req.query.company}`)
  res.send(html)
})

app.listen(8002, () => console.log('Listening'))
