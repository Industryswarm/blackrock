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

});

after(async () => { await blackrock.shutdown(); });