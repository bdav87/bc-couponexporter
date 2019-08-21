# bc-couponexporter
A Node.js app you can run locally to export BigCommerce coupon codes to a CSV.

# Prerequisites
You need an API account with the Marketing scope generated from your BigCommerce control panel.

For detailed instructions on setting up a BigCommerce API account, check the developer docs: https://developer.bigcommerce.com/api-docs

# Instructions
Create a file with the name `.env` in the root directory of the app. This is used to set the store URL and credentials for API requests.

## .env values
CLIENT={Your client ID}

STOREHASH={Your store hash}

TOKEN={Your auth token}

## Running the app
Once you've set up your .env file and installed dependencies with `npm install`, run `npm start` and a CSV file with your store's coupon codes will be generated in the app directory.