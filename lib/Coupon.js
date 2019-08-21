const fs = require('fs');
const csv = require('fast-csv');
const BigCommerce = require('./BC');

class Coupon {
    constructor(isConcurrent = false) {
        this.bc = BigCommerce;
        this.isConcurrent = isConcurrent;
        this.Streams = {};
    }

    CreateCSVFile() {
        const date = new Date().toDateString().split(' ').join('_');
        const filename = `coupon-export-${date}.csv`;
        return filename;
    }

    InitExportStream() {
        const filename = this.CreateCSVFile();
        const writableStream = fs.createWriteStream(filename);
        const csvStream = csv.createWriteStream({headers: true});
        csvStream.pipe(writableStream);

        const Streams = {
            writableStream: writableStream,
            csvStream: csvStream,
            filename: filename
        }
        return Streams;
    }

    InitExport() {
        this.Streams = this.InitExportStream();
        this.GetAllCoupons();
    }

    CouponCount() {
        return this.bc.get(`/coupons/count`);
    }

    CountPages() {
        return (async () => {
            const { count } = await this.CouponCount();
            return Math.ceil(count / 250);
        })();
    }

    GetPage(page) {
        return this.bc.get(`/coupons?limit=250&page=${page}`);
    }

    GetAllCoupons() {
        this.CountPages()
        .then(this.PrepareRequests.bind(this))
        .then(async requests => {
            try {
                const couponPages = await Promise.all(requests);
                return this.WriteEachResultToCSV(couponPages);
            } catch(err) {
                console.log(err)
            }
        });
    }

    PrepareRequests(pages) {
        const complete = pages + 1;
        const requestGroup = [];
        // TODO: Set up limiting so that only X amount of pages are pushed to the returned requestGroup before another cycle
        for (let page = 1; page < complete; page++) {
            requestGroup.push(this.GetPage(page))
        }
        return requestGroup;
    }

    /**
     * Iterate over the pages of responses and write them to a CSV
     * @param {Object[]} pagesOfCoupons - Collection of arrays, each array containing a page of results from the API
     */
    WriteEachResultToCSV(pagesOfCoupons) {
       
        // TODO: Set as different method or abstract into module
        function* createGenerator(len){
            for (let i = 0; i < len; i++) {
                yield i
            }
        }
        const pagesToIterate = pagesOfCoupons.length;
        const generator = createGenerator(pagesToIterate);

        return this.CyclePages(generator, pagesOfCoupons);
    }

    // Recursively called to go through each page, using generator to keep track of pages
    CyclePages(generator, pagesOfCoupons) {
        const cycle = generator.next();
        if(!cycle.done) {
            const currentCouponPage = cycle.value;
            pagesOfCoupons[currentCouponPage].forEach(coupon => this.WriteAndPublishCSV(coupon));
            this.CyclePages(generator, pagesOfCoupons);
        } else {
            console.log(`Export completed!\nFilename: ${this.Streams.filename}`);
        }
    }

    WriteAndPublishCSV(coupon) {
        this.Streams.csvStream.write(this.FormatExportContent(coupon));
    }

    FormatExportContent(coupon) {
        return {
            'Coupon ID': parseInt(coupon['id']),
            'Coupon Name': coupon['name'],
            'Discount Type': coupon['type'],
            'Min Purchase': coupon['min_purchase'],
            'Expires': coupon['expires'],
            'Enabled': coupon['enabled'],
            'Coupon Code': coupon['code'],
            'Applies To': JSON.stringify(coupon['applies_to']),
            'Number of Uses': coupon['num_uses'],
            'Max Uses': coupon['max_uses'],
            'Max Uses per Customer': coupon['max_uses_per_customer'],
            'Restricted to': coupon['restricted_to'],
            'Shipping Methods': coupon['shipping_methods'],
            'Date Created': coupon['date_created'],
        };
    }

}

module.exports = Coupon;