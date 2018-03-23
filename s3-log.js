const AWS = require('aws-sdk')
const s3 = new AWS.S3()

module.exports = function(originalBody, key) {
  const params = {
      Bucket: process.env.BUCKET,
      Key: `${process.env.KEY_PREFIX || ''}${key}`,
      Body: JSON.stringify(originalBody)
    }
  return s3.putObject(params).promise()
}
