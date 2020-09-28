const expect = require('chai').expect;
const blackrock = require('is-blackrock').init({ silent: true, test: true });

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

});

after(async () => {  
  await blackrock.shutdown();
});