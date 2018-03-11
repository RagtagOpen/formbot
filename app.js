require('dotenv').config()
const serverless = require('serverless-http');
const express = require('express');
const bodyParser = require('body-parser');
const sign = require('./sign');

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

app.post('/sign/:petitionId', function(req, res, next) {
  const { name, email, zipCode } = req.body
  console.log(`Signing petition for ${name} ${email} ${zipCode}`)
  getSecrets()
  .then(() => {
    sign({ name, email, zipCode}, req.params.petitionId)
      .then(() => {
        res.sendStatus(201)
      })
      .catch(err => {
        res.status(err && err.status || 500)
        if (err.message) {
          res.json(err)
        } else {
          res.end()
        }
      })
  })
})

module.exports = app