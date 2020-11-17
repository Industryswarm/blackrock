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

});

after(async () => { await blackrock.shutdown(); });



