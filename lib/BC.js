const nodebc = require('node-bigcommerce');
const dotenv = require('dotenv');
dotenv.config();

const BigCommerce = new nodebc({
    clientId: process.env.CLIENT,
    accessToken: process.env.TOKEN,
    storeHash: process.env.STOREHASH,
    responseType: 'json'
})

module.exports = BigCommerce;