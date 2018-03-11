# Formbot

This is a Serverless web app that accepts json or form data with a person's information, and adds a [submission](https://actionnetwork.org/docs/v2/submissions) to a [form](https://actionnetwork.org/docs/v2/forms) using the Action Network api.

Once deployed, you can post form data to https://your-api-gateway-endpoint/your-stage/your-action-network-form-id.

## Required values

The Lambda function current requires the following values:

- **name** (must include a space, for splitting first and last)
- **email**
- **zipCode**

and can optionally have:

- **phone**
- **optIn** (`true` or `"true"` or `1` or `"1"`)

They maybe submitted as json or as a regular form post.

## Curl example

    curl -H "Content-Type: application/json" -X POST -d '{"name":"Some Name", "email":"person@example.com", "zipCode":"99999", "phone":"415-555-1212", "optIn": true }' https://your-api-gateway-endpoint/your-stage/your-action-network-form-id

## HTML form example

Take a look at [test.html](test.html).

## API keys

### Local development

When running locally, you'll need a `.env` file in your root directory with your Action Network api key:

    ACTION_NETWORK_API_KEY=your-key-goes-here

### AWS

This project uses [serverless-crypt](https://github.com/marcy-terui/serverless-crypt) to encrypt secrets with AWS encryption keys. Those files can be safely checked in, and then the Lambda jobs can be added as key users in the AWS console, which allows them to decrypt the secrets at run time.

To encrypt your api key, run the following:

    serverless encrypt -n ACTION_NETWORK_API_KEY -t "your-key-goes-here" --save

The resulting `.serverless-secret.json` file is safe to check in.

## TODO
- [ ] add field validation
- [ ] make custom fields a configuration option (currently "optIn" sets a `M4OL text opt-in` custom field)
