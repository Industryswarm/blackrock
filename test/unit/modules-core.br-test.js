const expect = require('chai').expect;
require('is-blackrock').init({ silent: true, test: true, return: "promise" }).then(function(blackrock) {


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

        describe('Check on modules', () => {
            it('ensure the correct number of modules are loaded', () => {
                const result = blackrock.globals.set("test", "test");
                expect(result).to.equal(true);
            });
            it('ensure the correct number of interfaces are loaded', () => {
                const result = blackrock.globals.get("test");
                expect(result).to.equal("test");
            });
        });

        describe('Check on config and package file', () => {
            it('ensure the correct number of modules are loaded', () => {
                const result = blackrock.globals.set("test", "test");
                expect(result).to.equal(true);
            });
            it('ensure the correct number of interfaces are loaded', () => {
                const result = blackrock.globals.get("test");
                expect(result).to.equal("test");
            });
        });

        describe('Test the getBasePath method', () => {
            it('ensure the correct number of modules are loaded', () => {
                const result = blackrock.globals.set("test", "test");
                expect(result).to.equal(true);
            });
            it('ensure the correct number of interfaces are loaded', () => {
                const result = blackrock.globals.get("test");
                expect(result).to.equal("test");
            });
        });

        describe('Test that the standard classes/prototypes have been made available', () => {
            it('ensure Base class is present', () => {
                const result = blackrock.globals.set("test", "test");
                expect(result).to.equal(true);
            });
            it('ensure ISNode class is present', () => {
                const result = blackrock.globals.get("test");
                expect(result).to.equal("test");
            });
            it('ensure ISMod class is present', () => {
                const result = blackrock.globals.get("test");
                expect(result).to.equal("test");
            });
            it('ensure ISInterface class is present', () => {
                const result = blackrock.globals.get("test");
                expect(result).to.equal("test");
            });
        });

    });


    after(async () => {  
      await blackrock.shutdown();
    });


}).catch(function(blackrock) {
    null;
});



