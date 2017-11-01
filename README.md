# bc-couponexporter
A Node.js app you can run locally to export BigCommerce coupon codes to a CSV.

# Prerequisites
Node.JS v6.11.1 LTS

npm 3.10.10

# Instructions
Run `npm install` when you're in the app directory.

Create a file with the name '.env' in the root directory of the app. This is used to set the store URL and authentication token for API requests.

### .env values

BC_URL={store URL}

BC_AUTH={basic auth token}

The store URL should use your domain name without any paths to the API. For example, if you use the shared SSL certificate, your URL would look like this:

'store-t35t3x4mpl.mybigcommerce.com'

The auth token should be formatted in base64 per the basic auth instructinos at https://developer.bigcommerce.com/api/#obtaining-basic-auth-api-tokens. 

Javascript has a handy built in method to convert strings to base64: https://developer.mozilla.org/en-US/docs/Web/API/WindowBase64/Base64_encoding_and_decoding

### Running the app

Once you've set up your .env file, run `npm start`

View the app at localhost and click Generate to retrieve all your coupon codes and create a CSV file in the app's root directory.
