const fs = require('fs');
const csv = require('fast-csv');
const BigCommerce = require('./BC');

class Coupon {
    constructor(rate = 1) {
        this.bc = BigCommerce;
        this.Streams = {};
        this.state = {
            totalPages: 0,
            queue: [],
            rate: rate,
            startTime: 0
        };
    }

    CreateCSVFile() {
        const date = new Date().toDateString().split(' ').join('_');
        const filename = `coupon-export-${date}.csv`;
        return filename;
    }

    InitExportStream() {
        const filename = this.CreateCSVFile();
        const writableStream = fs.createWriteStream(filename);
        const csvStream = csv.format({headers: true});
        csvStream.pipe(writableStream);

        const Streams = {
            writableStream: writableStream,
            csvStream: csvStream,
            filename: filename
        }
        return Streams;
    }

    InitExport() {
        this.state.startTime = Date.now();
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
        .then(this.PrepareQueue.bind(this))
    }

    /**
     * Create a new generator that increments 1 at a time until the total is reached
     * @param {Number} total - The total number of iterations
     */
    SpawnGenerator(total) {
        function* generator(total) {
            for (let i = 0; i < total; i++) {
                yield i;
            }
        }

        return generator(total);
    }

    /**
     * Sets up the API request queue based on the total number of pages
     * @param {Number} pages
     */
    PrepareQueue(pages) {
        this.state.totalPages = pages;
        for (let pageNumber = 1; pageNumber < pages + 1; pageNumber++) {
            this.state.queue.push(pageNumber);
        }
        return this.SetupRequestBlock();
    }

    /**
     * Create a block of page numbers from the queue to request over the API
     */
    SetupRequestBlock() {
        const block = this.state.queue.splice(0, this.state.rate);
        const start = block[0];
        const end = block[block.length - 1] + 1;
        console.log('Queue:', this.state.queue);
        console.log('Page(s) being requested:', block);

        const requestGroup = [];
        for (let index = start; index < end; index++) {
            requestGroup.push(this.GetPage(index))
        }

        if (block.length) {
            return this.ExecuteAPIRequests(requestGroup);
        } else {
            const finishTime = Date.now();
            console.log(`Time elapsed: ${Math.floor(finishTime - this.state.startTime) / 1000} seconds`);
        }
        
    }

    async ExecuteAPIRequests(requestGroup) {
        try {
            const couponPages = await Promise.all(requestGroup);
            return this.WriteEachResultToCSV(couponPages);
        } catch(err) {
            console.log('Error executing requests: ',err)
        }
    }

    /**
     * Iterate over the pages of responses and write them to a CSV
     * @param {Object[]} pagesOfCoupons - Collection of arrays, each array containing a page of coupons from the API
     */
    WriteEachResultToCSV(pagesOfCoupons) {
        const total = pagesOfCoupons.length;
        const generator = this.SpawnGenerator(total);

        return this.CyclePages(generator, pagesOfCoupons);
    }
    /**
     * Recursively called to write each page returned by API to a CSV file
     * @param {Object} generator - A generator that increments 1 at a time
     * @param {Object[]} pagesOfCoupons
     */
    CyclePages(generator, pagesOfCoupons) {
        const cycle = generator.next();

        if (!cycle.done) {
            const currentCouponPage = cycle.value;
            let counter = 0;
            pagesOfCoupons[currentCouponPage].forEach((coupon, _, page) => {
                this.WriteToCSV(coupon);
                counter++;
                if (counter == page.length) {
                    this.CyclePages(generator, pagesOfCoupons);
                }
            });
        } else {
            this.SetupRequestBlock();
        }
    }

    WriteToCSV(coupon) {
        this.Streams.csvStream.write(this.FormatExportContent(coupon));
    }
    /**
     * Takes a coupon returned from API and formats it for CSV. Object keys are used as CSV headers.
     * @param {Object} coupon - A coupon returned from the API
     */
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