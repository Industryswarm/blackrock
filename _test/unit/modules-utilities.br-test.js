const chai = require("chai"), expect = chai.expect;
chai.use(require('chai-uuid'));

var blackrock = require('is-blackrock').init({ silent: true, test: true }, true);


before(function(done){ blackrock.ready(done); });

describe('Blackrock Utilities Module Tests', () => {

    describe('Test uuid4 method', () => {
        it('ensure uuid4 method returns a valid v4 uuid', () => {
            const result = blackrock.module("utilities").uuid4();
            expect(result).to.be.a.uuid('v4');
        });
    });

    describe('Test isJSON method', () => {
        it('ensure isJSON method detects JSON objects correctly', () => {
            const result = blackrock.module("utilities").isJSON({"test": "test"});
            expect(result).to.equal("json_object");
        });
        it('ensure isJSON method detects JSON strings correctly', () => {
            const result = blackrock.module("utilities").isJSON("{\"test\": \"test\"}");
            expect(result).to.equal("json_string");
        });
        it('ensure isJSON method detects standard strings correctly', () => {
            const result = blackrock.module("utilities").isJSON("test string");
            expect(result).to.equal("string");
        });
    });

    describe('Test randomString method', () => {
        it('ensure randomString method returns a string of defined length', () => {
            const result = blackrock.module("utilities").randomString(10);
            expect(result).to.be.a("string").and.to.have.lengthOf(10);
        });
    });

    describe('Test objectLength method', () => {
        it('ensure objectLength method returns the length of a defined object', () => {
            const result = blackrock.module("utilities").objectLength({"param1": "value1", "param2": "value2"});
            expect(result).to.equal(2);
        });
    });

    describe('Test validateString method', () => {
        it('ensure email string validator validates a valid email correctly', () => {
            const result = blackrock.module("utilities").validateString("test@test.com", { "email": true });
            expect(result).to.be.true; ;
        });
        it('ensure email string validator invalidates an invalid email correctly', () => {
            const result = blackrock.module("utilities").validateString("test", { "email": true });
            expect(result).to.be.false;
        });
        it('ensure whitelist string validator validates a string that only uses whitelist characters', () => {
            const result = blackrock.module("utilities").validateString("dcba", { "whitelist": "abcd" });
            expect(result).to.be.true;
        });
        it('ensure whitelist string validator invalidates a string that uses characters outside of the whitelist', () => {
            const result = blackrock.module("utilities").validateString("dcbe", { "whitelist": "abcd" });
            expect(result).to.be.false;
        });
    });

});

after(async () => { await blackrock.shutdown(); });