const rp = require('request-promise');
const createError = require('http-errors');

const createPerson = function(personInfo) {
  return new Promise((resolve, reject) => {
    if (!personInfo.name || !personInfo.email || !personInfo.zipCode) {
      return reject(createError(400, "name, email, and zipCode are all required"))
    }
    let nameParts = personInfo.name.split(' ')
    const firstName = nameParts.shift()
    const lastName = nameParts.join(' ')
    if (!lastName) {
      return reject(createError(400, `Full name required, only got ${personInfo.name}`))
    }
    // console.log("creating with", firstName, lastName, personInfo.zipCode, personInfo.email)
    options = {
      method: 'POST',
      uri: 'https://actionnetwork.org/api/v2/people/',
      body: {
        person : {
          family_name : lastName,
          given_name : firstName,
          postal_addresses : [ { postal_code : personInfo.zipCode }],
          email_addresses : [ { address : personInfo.email }]
        },
        "add_tags": [
          "resistbot",
          "ragtag"
        ]
      },
      headers: {
        'OSDI-API-Token': process.env.ACTION_NETWORK_API_KEY
      },
      json: true
    };
    // console.log("posting with options:", options)
    rp(options)
      .then(body => {
        // console.log("got response:", body)
        resolve(body._links.self.href)
      })
      .catch(err => {
        console.log("error posting", err)
        reject(err)
      })
  })
}

const signForPerson = function(personHref, formId) {
  return new Promise((resolve, reject) => {
    if (!personHref) {
      return reject("Must provide href to person")
    }
    options = {
      method: 'POST',
      uri: `https://actionnetwork.org/api/v2/forms/${formId}/submissions/`,
      body: {
        _links: {
          'osdi:person': {
            href: personHref
          }
        }
      },
      headers: {
        'OSDI-API-Token': process.env.ACTION_NETWORK_API_KEY
      },
      json: true
    };
    rp(options)
      .then(body => {
        console.log("added submission to form:", body)
        resolve()
      })
      .catch(err => {
        console.log("Error adding submission to form", err)
        reject("Error signing")
      })
  })
}

const sign = function(personInfo, petitionId) {
  return createPerson(personInfo)
    .then(href => signForPerson(href, petitionId))
}

module.exports = sign
