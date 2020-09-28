const chai = require('chai'), expect = chai.expect, blackrock = require('is-blackrock').init({ silent: true, test: true, accessInternalMethods: true });
chai.use(require('chai-uuid')); 

describe('Blackrock Utilities Module Tests', () => {

    describe('uuid4() - Generate UUID4', () => {
        it('return a properly formatted UUID4 identifier', () => {
            const result = blackrock.module("utilities").uuid4();
            expect(result).to.be.a.uuid('v4');
        });
    });
/*
    describe('isJSON() - Test if variable is JSON and if so of what type', () => {
        it('return a properly formatted UUID4 identifier', () => {
            const result = blackrock.globals.set("test", "test");
            expect(result).to.equal(true);
        });
    });

    describe('randomString() - Generate a random string of a given length', () => {
        it('return a properly formatted UUID4 identifier', () => {
            const result = blackrock.globals.set("test", "test");
            expect(result).to.equal(true);
        });
    });

    describe('objectLength() - Returns the length of an object', () => {
        it('return a properly formatted UUID4 identifier', () => {
            const result = blackrock.globals.set("test", "test");
            expect(result).to.equal(true);
        });
    });

    describe('getCurrentDateInISO() - Returns the current date in ISO format', () => {
        it('return a properly formatted UUID4 identifier', () => {
            const result = blackrock.globals.set("test", "test");
            expect(result).to.equal(true);
        });
    });

    describe('validateString() - Validates a string', () => {
        it('return a properly formatted UUID4 identifier', () => {
            const result = blackrock.globals.set("test", "test");
            expect(result).to.equal(true);
        });
    });

    describe('cloneObject() - Deep clones an object', () => {
        it('return a properly formatted UUID4 identifier', () => {
            const result = blackrock.globals.set("test", "test");
            expect(result).to.equal(true);
        });
    });

    describe('modules.loadModule() - Loads a Node.JS module', () => {
        it('return a properly formatted UUID4 identifier', () => {
            const result = blackrock.globals.set("test", "test");
            expect(result).to.equal(true);
        });
    });

    describe('csv.parse() - Parses a CSV file in to an object', () => {
        it('return a properly formatted UUID4 identifier', () => {
            const result = blackrock.globals.set("test", "test");
            expect(result).to.equal(true);
        });
    });

    describe('crypto.encrypt() - Encrypts an input', () => {
        it('return a properly formatted UUID4 identifier', () => {
            const result = blackrock.globals.set("test", "test");
            expect(result).to.equal(true);
        });
    });

    describe('crypto.decrypt() - Decrypts an input', () => {
        it('return a properly formatted UUID4 identifier', () => {
            const result = blackrock.globals.set("test", "test");
            expect(result).to.equal(true);
        });
    });

    describe('system.getMemoryUse() - Gets RAM/Memory use for Node.JS process', () => {
        it('return a properly formatted UUID4 identifier', () => {
            const result = blackrock.globals.set("test", "test");
            expect(result).to.equal(true);
        });
    });

    describe('system.getCpuLoad() - Gets CPU Load', () => {
        it('return a properly formatted UUID4 identifier', () => {
            const result = blackrock.globals.set("test", "test");
            expect(result).to.equal(true);
        });
    });

    describe('system.getStartTime() - Gets start time for timer', () => {
        it('return a properly formatted UUID4 identifier', () => {
            const result = blackrock.globals.set("test", "test");
            expect(result).to.equal(true);
        });
    });

    describe('system.getEndTime() - Gets an end time for timer', () => {
        it('return a properly formatted UUID4 identifier', () => {
            const result = blackrock.globals.set("test", "test");
            expect(result).to.equal(true);
        });
    });

    describe('system.getObjectMemoryUsage() - Gets memory usage for a javascript object', () => {
        it('return a properly formatted UUID4 identifier', () => {
            const result = blackrock.globals.set("test", "test");
            expect(result).to.equal(true);
        });
    });

    describe('isUndefined() - Checks if a value is undefined', () => {
        it('return a properly formatted UUID4 identifier', () => {
            const result = blackrock.globals.set("test", "test");
            expect(result).to.equal(true);
        });
    });

    describe('isNull() - Checks if a value is NULL', () => {
        it('return a properly formatted UUID4 identifier', () => {
            const result = blackrock.globals.set("test", "test");
            expect(result).to.equal(true);
        });
    });

    describe('isNil() - Checks if a value is NIL', () => {
        it('return a properly formatted UUID4 identifier', () => {
            const result = blackrock.globals.set("test", "test");
            expect(result).to.equal(true);
        });
    });

    describe('path() - Gets the value of a deep attribute within an object, taking an array of keys', () => {
        it('return a properly formatted UUID4 identifier', () => {
            const result = blackrock.globals.set("test", "test");
            expect(result).to.equal(true);
        });
    });

    describe('prop() - Gets the value of a deep attribute within an object, taking the keys as a single string', () => {
        it('return a properly formatted UUID4 identifier', () => {
            const result = blackrock.globals.set("test", "test");
            expect(result).to.equal(true);
        });
    });

    describe('assign() - Assigns a value to a deep attribute of an object', () => {
        it('return a properly formatted UUID4 identifier', () => {
            const result = blackrock.globals.set("test", "test");
            expect(result).to.equal(true);
        });
    });

*/
});