const expect = require('chai').expect;
var blackrock = require('is-blackrock').init({ silent: true, test: true }, true);


before(function(done){ blackrock.ready(done); });

describe('Blackrock Logger Module Tests', () => {

    describe('Test logging functionality', () => {
        it('ensure that log message can be published successfully to core object', (done) => {
            var evtReceived = false;
            blackrock.on("TESTS_LOG_MSG", function(evt) {
                evtReceived = true;
                expect(evt.level).to.equal("test");
                done();
            });
            const result = blackrock.module("logger").log("test", "Test Log Message", {"testAttr": "testVal"}, "TESTS_LOG_MSG");
            var timer = 0;
            var interval = setInterval(function(){
                if(evtReceived) { clearInterval(interval); }
                if(timer > 1000) {
                    clearInterval(interval);
                    done({"error": "timed out"});
                }
                timer ++;
            }, 10);
        });
    });

    describe('Test view analytics functionality', () => {
        it('ensure that view analytics object contains the date of last boot', () => {
            const result = blackrock.module("logger").analytics.view();
            expect(result.server).to.have.property("dateLastBoot");
        });
        it('ensure that view analytics object contains the date cache last saved', () => {
            const result = blackrock.module("logger").analytics.view();
            expect(result.server).to.have.property("dateCacheLastSaved");
        });
        it('ensure that view analytics object contains the total request size', () => {
            const result = blackrock.module("logger").analytics.view();
            expect(result.msgs).to.have.property("totalReqSize");
        });
        it('ensure that view analytics object contains the total response size', () => {
            const result = blackrock.module("logger").analytics.view();
            expect(result.msgs).to.have.property("totalResSize");
        });
        it('ensure that view analytics object contains the total request count', () => {
            const result = blackrock.module("logger").analytics.view();
            expect(result.msgs).to.have.property("totalReqCount");
        });
        it('ensure that view analytics object contains the total response count', () => {
            const result = blackrock.module("logger").analytics.view();
            expect(result.msgs).to.have.property("totalResCount");
        });
        it('ensure that view analytics object contains the average request size', () => {
            const result = blackrock.module("logger").analytics.view();
            expect(result.msgs).to.have.property("avgReqSize");
        });
        it('ensure that view analytics object contains the average response size', () => {
            const result = blackrock.module("logger").analytics.view();
            expect(result.msgs).to.have.property("avgResSize");
        });
        it('ensure that view analytics object contains the average processing time', () => {
            const result = blackrock.module("logger").analytics.view();
            expect(result.msgs).to.have.property("avgProcessingTime");
        });
        it('ensure that view analytics object contains the average memory used', () => {
            const result = blackrock.module("logger").analytics.view();
            expect(result.msgs).to.have.property("avgMemUsed");
        });
        it('ensure that view analytics object contains the average CPU load', () => {
            const result = blackrock.module("logger").analytics.view();
            expect(result.msgs).to.have.property("avgCpuLoad");
        });
    });

});

after(async () => { await blackrock.shutdown(); });