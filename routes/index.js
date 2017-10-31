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
  let count = 0;
  let pages = 0;
  //Get the count to determine pagination
  function countCoupons(callback) {
    
    options.path = '/api/v2/coupons/count';

    const countRequest = https.request(options, function(response){
      response.on('data', (d) => {
        count = JSON.parse(d).count
        console.log('data: ' + count);

        pages = Math.ceil(count/250);
        console.log('pages: ' + pages);
      })
      .on('end', () => {
        //Invoke callback function and pass page count as an argument
        //callback(pages);
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

  //Retrieve the coupons
  function retrieveCoupons(page){

    //establish variables to be used in the nested function
    console.log(page);
    count = 0;
    let body = '', obj;
    //let newObj = [];
    
    

    function couponsAPIrequest(pagenum){

    options.path = '/api/v2/coupons?limit=250&page=' + pagenum;
    
    const getCoupons = https.request(options, function(response){
      
        response.on('data', (d) => {
          body += d;
          console.log(d);
        })
        .on('end', () => {
          //console.log(body);
          

          /*obj.forEach(function(element) {
            newObj.push(element);
          }, this);*/

          if (count <= 0) {
            obj = body;
            console.log('done in test mode');
            writeToCSV(obj);
            //console.log(body);
          }
          else {

              try {
              obj = body;
              //Logging each page to a text file
              fs.writeFile('testing' + count + '.txt', obj, function(err) {
                if(err) {
                    console.log('there was an error: ', err);
                    return;
                }
                console.log('data was appended to file');
                 
            
                
            });

            } catch (error) {
              console.log("error: " + error);
              
            }
            //Decrements count, so current page number - 1 is included in
            //request URI
            count--;
                
            //call this API request recursively until count is 0
            couponsAPIrequest(count);
            console.log(count);

          }
          
        })
      })
      .on('error', (e) => {
        console.log(e);
      })
      .end();
      //res.send('Request completed');
    }

    //Initial invoke of API request
    //couponsAPIrequest(count);

  }
    
  
  

const writeToCSV = (responseFromAPI) => {
  //console.log(typeof (responseFromAPI));
  //console.log(JSON.parse(responseFromAPI));
  let headers = [];
  let values = [];
  let csvArray = [];
  let toLoop = Object.keys(responseFromAPI[0]);
  for(i=0; i < toLoop.length; i++) {
    headers.push(toLoop[i]);
  }

  responseFromAPI.forEach((element) => {
    values.push([Object.keys(element).map(e => element[e])]);
  })
  //console.log("headers: " + headers);
  //console.log("values: " + values.toString);
  csvArray.push(headers);
  for(i=0;i<values.length; i++){
    csvArray.push(values[i][0])
  }
  //console.log(csvArray[1][0]);

  let ws = fs.createWriteStream('couponExport.csv');

  csv.write(csvArray,{headers: false}).pipe(ws);
  
}

res.send('donezo');
});

module.exports = router;
