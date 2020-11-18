const expect = require('chai').expect;
var blackrock = require('is-blackrock').init({ silent: true, test: true }, true);

before(function(done){ blackrock.ready(done); });

describe('Blackrock Router Module Tests', () => {

    describe('Validate External Router Methods', () => {
        it('ensure that one or more routers have been instantiated', () => {
            const routerList = blackrock.module("router").list();
            expect(routerList).to.have.lengthOf.above(0);
        });
        it('ensure that the count method returns the correct loaded router count', () => {
            const routerList = blackrock.module("router").list();
            const routerCount = blackrock.module("router").count();
            expect(routerCount).to.equal(routerList.length);
        });
        it('ensure that the get method returns a valid router', () => {
            const routerList = blackrock.module("router").list();
            const router = blackrock.module("router").get(routerList[0]);
            expect(router.incoming).to.be.a("function");
        });
        it('ensure that the route method executes services.search and returns a false result for an invalid host', (done) => {
            var evtReceived = false;
            const routerList = blackrock.module("router").list();
            const router = blackrock.module("router").get(routerList[0]);
            router.route("testdsiadsouah.com", "/", function(res) {
                evtReceived = true;
                expect(res).to.be.false;
                done();
            });
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

});

after(async () => { await blackrock.shutdown(); });



