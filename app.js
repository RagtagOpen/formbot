require('dotenv').config()
const serverless = require('serverless-http');
const express = require('express');
const bodyParser = require('body-parser');
const { sign, validate } = require('./sign');
const s3Log = require('./s3-log');
const rp = require('request-promise');

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

app.post('/sign/:formId/wait', function(req, res, wait) {
  console.log("doing the full wait version...")
  getSecrets()
  .then(() => {
    sign(req.body, req.params.formId)
      .then(() => {
        if (process.env.SAVE_SUCCESS) {
          s3Log(req.body, `success/${req.body.email}.json`)
            .then(() => {
              console.log(`Saved success/${req.body.email} to s3`)
              res.sendStatus(201)
            })
            .catch(err => {
              console.log(`Error saving success to s3: ${err}}`)
              res.sendStatus(500)
            })
        } else {
          res.sendStatus(201)
        }
      })
      .catch(err => {
        console.log("error writing:", err)
        console.log("Writing failed body to s3")
        s3Log(req.body, `error/${req.body.email}.json`)
          .then(s3Res => {
            console.log(`Saved error/${req.body.email} to s3`)
            res.status(err && err.status || 500)
            if (err.message) {
              res.json(err)
            } else {
              res.end()
            }
          })
          .catch(s3Error => {
            console.log(`Error saving error to s3: ${s3Error}`)
            res.json(s3Error)
          })
      })
  })
})

app.post('/sign/:formId', function(req, res, next) {
  console.log(`Signing petition for ${JSON.stringify(req.body)}`)
  // if the input is bad, return immediately
  const validationResult = validate(req.body)
  if (validationResult.error) {
    res.status(401)
    return res.json(validationResult)
  } else {
    // fire off the request that will actually process, then return
    const fullUrl = req.protocol + '://' + req.get('host') + (process.env.PATH_PREFIX || '') + req.originalUrl;
    const waitUri = fullUrl + '/wait'
    console.log("Sending new request to", waitUri)
    const result = rp({
      uri: waitUri,
      method: 'POST',
      body: req.body,
      json: true
    }).catch(err => {
      console.log("Error calling wait endpoint", err)
    })
    setTimeout(function() {
      res.sendStatus(201)
    }, 100)
  }
})

module.exports = app
