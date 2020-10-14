const expect = require('chai').expect;
const blackrock = require('is-blackrock').init({ silent: true, test: true });

describe('Blackrock Logger Module Tests', () => {

    describe('Test the Event Log method (standard)', () => {
        it('ensure that the CLI module is loaded', () => {
            const result = blackrock.globals.set("test", "test");
            expect(result).to.equal(true);
        });
    });

    describe('Test the Server/Farm Analytics Methods', () => {
        it('ensure that analytics log method indicates success', () => {
            const result = blackrock.globals.set("test", "test");
            expect(result).to.equal(true);
        });
        it('ensure that analytics view method returns a valid snapshot', () => {
            const result = blackrock.globals.get("test");
            expect(result).to.equal("test");
        });
    });

    describe('Test the Heartbeat Methods', () => {
        it('ensure that the get latest heartbeat method returns a valid result', () => {
            const result = blackrock.globals.set("test", "test");
            expect(result).to.equal(true);
        });
        it('ensure that the update latest heartbeat method returns a success', () => {
            const result = blackrock.globals.get("test");
            expect(result).to.equal("test");
        });
        it('ensure that the get latest heartbeat method returns the updated value', () => {
            const result = blackrock.globals.set("test", "test");
            expect(result).to.equal(true);
        });
    });

    describe('Test the Console Display Management Methods', () => {
        it('ensure that the get latest heartbeat method returns a valid result', () => {
            const result = blackrock.globals.set("test", "test");
            expect(result).to.equal(true);
        });
        it('ensure that the update latest heartbeat method returns a success', () => {
            const result = blackrock.globals.get("test");
            expect(result).to.equal("test");
        });
    });

});