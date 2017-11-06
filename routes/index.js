const express = require('express');
const router = express.Router();
const https = require('https');
const path = require('path');
const bodyParser = require('body-parser');
const fs = require('fs');
const csv = require('fast-csv');
const dotenv = require('dotenv');
dotenv.load();

const options = {
  host: process.env.BC_URL,
  path: '/api/v2/coupons',
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': process.env.BC_AUTH,
    'Accept': 'application/json'
  }
};

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Coupon CSV Exporter' });
});

router.get('/generate', function(req, res) {
  // Variable declarations
  // count will be the total number of coupons on the store
  // pages is used to in a URI parameter to paginate API requests
  // values will populate with the data that is pushed to the CSV
  let count = 0, pages = 0, values = [];
  
  //Get the total number of coupons to determine pagination
  function countCoupons() {
    
    options.path = '/api/v2/coupons/count';

    const countRequest = https.request(options, function(response){
      response.on('data', (d) => {
        count = JSON.parse(d).count;
        console.log('Total Coupons: ' + count);

        pages = Math.ceil(count/250);
        console.log('Pages: ' + pages);
      })
      .on('end', () => {
        //Invoke callback function
        retrieveCoupons();
      })
    })
      .on('error', (e) => {
        console.log("error: " + e);
      })
      .end();
    
  };
  //Invoking the countCoupons function to start the whole process
  countCoupons();

  //Retrieve the coupons
  function retrieveCoupons(){

    let body = '';

    // This function will be invoked multiple times if there are more than 250 coupons.
    // The current page is passed in the pagenum parameter.
    function couponsAPIrequest(pagenum){

    options.path = '/api/v2/coupons?limit=250&page=' + pagenum;
    
    const getCoupons = https.request(options, function(response){
      
        response.on('data', (d) => {
          body += d;
        })
        .on('end', () => {
            pages--;
            writeToCSV(body);
        })
      })
      .on('error', (e) => {
        console.log(e);
      })
      .end();
    }

    //Invoke the API request, passing in the pages variable set in countRequest
    couponsAPIrequest(pages);

  }

const writeToCSV = (responseFromAPI) => {

  let couponData = JSON.parse(responseFromAPI);
  let headers = ['id', 'name', 'type',	'amount',	'min_purchase',	'expires',	'enabled', 'code',
  'applies_to',	'num_uses',	'max_uses',	'max_uses_per_customer',	'restricted_to',	'shipping_methods',
  	'date_created'];

  couponData.forEach((element) => {

    (function checkForObjects(){
      
      //This defines the overall row of items added to the CSV
      let row = Object.keys(element).map(e => element[e]);
      
      //This index refers to product and category restrictions
      row[8] = row[8]['entity'] + ': ' + row[8]['ids'];
      
      //Checks if there are any state, country or zip restrictions
      if (Object.keys(row[12]).length > 0){
        
        let sub = Object.keys(row[12]);
        row[12] = sub + ': ' + JSON.stringify(row[12][sub]).toString();
      }
      values.push(row);
    }());
  })

  let csvStream = csv.createWriteStream({headers: true}),
      writableStream = fs.createWriteStream('couponExport.csv');

  writableStream.on('finish', function(){
    console.log('Done with CSV');
  });
  csvStream.pipe(writableStream);
  csvStream.write(headers);
  buildOnCSV();

  function buildOnCSV(){
    
    if (pages < 1) {
      for (i = 0; i<values.length; i++) {
        csvStream.write(values[i]);
      }
      csvStream.end(); 
    } else {
      retrieveCoupons(); 
    }
  }

}

res.send('CSV generated');
});

// This lets you display the data for a single coupon on the app page.
// I used this to help determine how to format the CSV
router.post('/query', function(req,res){
  console.log(req.body.id);
  let body = '';
  options.path = '/api/v2/coupons/' + req.body.id;
  const getCouponData = https.request(options, function(response){
    response.on('data', (d)=> {
      body += d;
      console.log(body);
    })
    .on('end', () => {
      res.send(body);
    })
  })
  .on('error', (e) => {
    console.log('error: ' + e);
  })
  .end();
  
});

module.exports = router;
