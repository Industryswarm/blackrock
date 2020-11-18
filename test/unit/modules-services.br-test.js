const expect = require('chai').expect;
var blackrock = require('is-blackrock').init({ silent: true, test: true }, true);

before(function(done){ blackrock.ready(done); });

describe('Blackrock Services Module Tests', () => {

    describe('Validate Service Information', () => {
        it('ensure that one or more services are loaded', () => {
            const result = blackrock.module("services").serviceList();
            expect(result).to.have.lengthOf.above(0);
        });
        it('ensure that total route count across services is one or more', () => {
            const result = blackrock.module("services").serviceStats();
            expect(result.servicesRouteCount).is.above(0);
        });
    });

    describe('Validate Service Endpoint Methods', () => {
        it('ensure that a service variable can be set', () => {
            const serviceList = blackrock.module("services").serviceList();
            const service = blackrock.module("services").service(serviceList[0]);
            const result = service.vars.set("test", "test");
            expect(result).to.be.true;
        });
        it('ensure that previously set service variable can be fetched', () => {
            const serviceList = blackrock.module("services").serviceList();
            const service = blackrock.module("services").service(serviceList[0]);
            const result = service.vars.get("test");
            expect(result).to.equal("test");
        });
        it('ensure that middleware can be added to a service', () => {
            const serviceList = blackrock.module("services").serviceList();
            const service = blackrock.module("services").service(serviceList[0]);
            const result = service.use(function(req, res, next) { next(); });
            expect(result).to.be.true;
        });
        it('ensure that middleware count can be retrieved', () => {
            const serviceList = blackrock.module("services").serviceList();
            const service = blackrock.module("services").service(serviceList[0]);
            const result = service.middleware.count();
            expect(result).to.be.above(0);
        });
        it('ensure that service config is present', () => {
            const serviceList = blackrock.module("services").serviceList();
            const service = blackrock.module("services").service(serviceList[0]);
            const result = service.cfg();
            expect(result).to.have.property("name");
        });
        it('ensure that model can be added to service', () => {
            const serviceList = blackrock.module("services").serviceList();
            const service = blackrock.module("services").service(serviceList[0]);
            const result = service.models.add("test", function(param) { return (param + 1); });
            expect(result).to.be.true;
        });
        it('ensure that previously defined model can be fetched from service', () => {
            const serviceList = blackrock.module("services").serviceList();
            const service = blackrock.module("services").service(serviceList[0]);
            const model = service.models.get("test");
            const result = model(1);
            expect(result).to.equal(2);
        });
    });

    describe('Validate Service Search', () => {
        it('ensure that the search method returns a result', (done) => {
            var evtReceived = false;
            const servicesMod = blackrock.module("services");
            servicesMod.search({"services": "*", "hostname": "testdsiadsouah.com", "url": "/"}, function(res) {
                evtReceived = true;
                if(res === false || res) {
                    expect(1).to.equal(1);
                } else {
                    expect(1).to.equal(0);
                }
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



