require('dotenv').config()
const serverless = require('serverless-http');
const express = require('express');
const bodyParser = require('body-parser');
const sign = require('./sign');
const s3Log = require('./s3-log');

const getSecrets = function() {
  return new Promise((resolve, reject) => {
    if (!process.env.ACTION_NETWORK_API_KEY) {
      const slscrypt = require('slscrypt')
      slscrypt.get('ACTION_NETWORK_API_KEY').then((key) => {
        process.env.ACTION_NETWORK_API_KEY = key
        resolve()
      })
    } else {
      resolve()
    }
  })
}

const app = express()

app.use(bodyParser.json({ strict: false }));
app.use(bodyParser.urlencoded({ extended: false }));

app.get('/', function (req, res) {
  res.send('Hello World!')
})

app.post('/sign/:formId', function(req, res, next) {
  console.log(`Signing petition for ${JSON.stringify(req.body)}`)
  let responseSent = false
  const timer = setTimeout(() => {
    res.sendStatus(201)
    responseSent = true
  }, process.env.SOFT_TIMEOUT || 1000)
  getSecrets()
  .then(() => {
    sign(req.body, req.params.formId)
      .then(() => {
        if (!responseSent) {
          console.log("Succeeded without delay, all is well")
          res.sendStatus(201)
          responseSent = true
          clearTimeout(timer)
        } else {
          console.log("Delayed submission succeeded, all is well")
          s3Log(req.body, `success/${req.body.email}.json`)
            .then(res => console.log(`Saved ${req.body.email} to s3`))
            .catch(err => console.log(`Error saving to s3: ${JSON.stringify(err)}`))
        }
      })
      .catch(err => {
        console.log("Catching error. Response already sent?", responseSent)
        console.log("Writing failed body to s3")
        s3Log(req.body, `error/${req.body.email}.json`)
          .then(res => console.log(`Saved ${req.body.email} to s3`))
          .catch(err => console.log(`Error saving to s3: ${JSON.stringify(err)}`))

        if (!responseSent) {
          res.status(err && err.status || 500)
          if (err.message) {
            res.json(err)
          } else {
            res.end()
          }
          responseSent = true
        } else {
          console.log(`Delayed submission failed: ${JSON.stringify(err)}`)
        }
      })
  })
})

module.exports = app
