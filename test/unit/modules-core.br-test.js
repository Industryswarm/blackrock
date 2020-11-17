const expect = require('chai').expect;
var blackrock = require('is-blackrock').init({ silent: true, test: true }, true);

before(function(done){ blackrock.ready(done); });

describe('Blackrock Core Module Tests', () => {

    describe('Set & Get Globals', () => {
        it('return success after setting global', () => {
            const result = blackrock.globals.set("test", "test");
            expect(result).to.equal(true);
        });
        it('return previously set global', () => {
            const result = blackrock.globals.get("test");
            expect(result).to.equal("test");
        });
    });

    describe('Check on config and package file', () => {
        it('ensure the config file is loaded', () => {
            const result = blackrock.cfg();
            expect(result).to.have.property("core");
        });
        it('ensure the package file is loaded', () => {
            const result = blackrock.pkg();
            expect(result).to.have.property("name");
        });
    });

    describe('Test the fetchBasePath method', () => {
        it('ensure the module base path is set', () => {
            const result = blackrock.fetchBasePath("module");
            expect(result).to.be.a("string");
        });
        it('ensure the root base path is set', () => {
            const result = blackrock.fetchBasePath("root");
            expect(result).to.be.a("string");
        });
        it('ensure the config base path is set', () => {
            const result = blackrock.fetchBasePath("config");
            expect(result).to.be.a("string");
        });
        it('ensure the services base path is set', () => {
            const result = blackrock.fetchBasePath("services");
            expect(result).to.be.a("string");
        });
        it('ensure the cache base path is set', () => {
            const result = blackrock.fetchBasePath("cache");
            expect(result).to.be.a("string");
        });
    });

    describe('Test that the standard classes/prototypes have been made available', () => {
        it('ensure Base class is present', () => {
            expect(blackrock.Base).to.be.a("function");
        });
        it('ensure Core class is present', () => {
            expect(blackrock.Core).to.be.a("function");
        });
        it('ensure Mod class is present', () => {
            expect(blackrock.Mod).to.be.a("function");
        });
        it('ensure Interface class is present', () => {
            expect(blackrock.Interface).to.be.a("function");
        });
    });

    describe('Test module count', () => {
        it('ensure there are one or more standard modules loaded', () => {
            const result = blackrock.moduleCount("modules");
            expect(result).to.be.above(1);
        });
        it('ensure there are one or more interface modules loaded', () => {
            const result = blackrock.moduleCount("interfaces");
            expect(result).to.be.above(1);
        });
    });

});

after(async () => { await blackrock.shutdown(); });



