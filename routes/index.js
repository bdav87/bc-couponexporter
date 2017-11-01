const express = require('express');
const router = express.Router();
const https = require('https');
const path = require('path');
const bodyParser = require('body-parser');
const fs = require('fs');
const csv = require('fast-csv');
const dotenv = require('dotenv');
dotenv.load();


router.use(express.static(path.join(__dirname, 'public')));

router.use(bodyParser.json()); // for parsing application/json
router.use(bodyParser.urlencoded({ extended: true }));

const options = {
  host: 'store-hfdehryc.mybigcommerce.com',
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
  let count = 0, pages = 0;
  //Get the count to determine pagination
  function countCoupons() {
    
    options.path = '/api/v2/coupons/count';

    const countRequest = https.request(options, function(response){
      response.on('data', (d) => {
        count = JSON.parse(d).count
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
  //This should invoke the function that calls for a count of coupon codes
  //and then divides by 250 and rounds up to determine number of pages
  //the argument passed is a callback function
  countCoupons();

  //let initiated = false;
  //Retrieve the coupons
  function retrieveCoupons(){

    //establish variables to be used in the nested function
    let body = '', testArr = [];

    function couponsAPIrequest(pagenum){

    options.path = '/api/v2/coupons?limit=250&page=' + pagenum;
    
    const getCoupons = https.request(options, function(response){
      
        response.on('data', (d) => {
          body += d;
          //console.log('test' + JSON.stringify(testArr[0]));
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

    //Initial invoke of API request
    couponsAPIrequest(pages);

  }
    
  
  
let values = [];
const writeToCSV = (responseFromAPI) => {
  //console.log(typeof (responseFromAPI));
  //console.log(JSON.parse(responseFromAPI));
  let couponData = JSON.parse(responseFromAPI);
  let headers = ['id', 'name', 'type',	'amount',	'min_purchase',	'expires',	'enabled', 'code',
  'applies_to',	'num_uses',	'max_uses',	'max_uses_per_customer',	'restricted_to',	'shipping_methods',
  	'date_created'];

  couponData.forEach((element) => {
    values.push(Object.keys(element).map(e => element[e]));
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

res.send('donezo');
});

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
