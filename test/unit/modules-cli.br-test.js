const expect = require('chai').expect;
const blackrock = require('is-blackrock').init({ silent: true, test: true });

describe('Blackrock CLI Module Tests', () => {

    describe('Test CLI Module...', () => {
        it('ensure that the CLI module is loaded', () => {
            const result = blackrock.globals.set("test", "test");
            expect(result).to.equal(true);
        });
        it('ensure that there are no external methods exposed on the CLI module', () => {
            const result = blackrock.globals.get("test");
            expect(result).to.equal("test");
        });
    });

});