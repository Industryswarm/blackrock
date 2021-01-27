const chai = require("chai"), expect = chai.expect;

const blackrock = require('is-blackrock').init({ silent: true, test: true }, true);

before(function(done){ blackrock.ready(done); });

describe('Blackrock HTTP Interface Tests', () => {

    describe('Test HTTP Server Functionality', () => {
        it('ensure that there is one or more HTTP instance enabled', () => {
            const result = blackrock.module("http", "interface").list();
            expect(result).to.have.lengthOf.above(0);
        });
        it('ensure that the first HTTP instance is listening on a port', () => {
            const instances = blackrock.module("http", "interface").list();
            const instance = blackrock.module("http", "interface").get(instances[0]);
            expect(instance.listening).to.be.true;
        });
        /*it('ensure that a client GET request to the server is received', (done) => {
            var reqReceived = false;
            blackrock.on("HTTP_RECEIVED_INCOMING_REQUEST", function(evt) {
                reqReceived = true;
                expect(evt).to.have.property("url");
                done();
            });
            const instances = blackrock.module("http", "interface").list();
            const instance = blackrock.module("http", "interface").get(instances[0]);
            const port = instance.port;
            const httpClient = blackrock.module("http", "interface").client;
            httpClient.get("http://localhost:" + port + "/test", function(err, res) {});
            var timerCount = 0;
            var interval = setInterval(function(){
                if(reqReceived) {
                    clearInterval(interval);
                }
                if(timerCount >= 2000 && !reqReceived) {
                    clearInterval(interval);
                    done({"error": "no request received"});
                }
                timerCount += 100;
            }, 100);
        });*/
    });

    describe('Test HTTP Client Functionality', () => {
        it('ensure that a client GET request to the server can be made', (done) => {
            const instances = blackrock.module("http", "interface").list();
            const instance = blackrock.module("http", "interface").get(instances[0]);
            const port = instance.port;
            const httpClient = blackrock.module("http", "interface").client;
            httpClient.get("http://localhost:" + port + "/testuiagfasdiu", function(err, res) {
                if(err) { done(err); }
                expect(res).to.be.a("object");
                done();
            });
        });
        it('ensure that a client POST request to the server can be made', (done) => {
            const instances = blackrock.module("http", "interface").list();
            const instance = blackrock.module("http", "interface").get(instances[0]);
            const port = instance.port;
            const httpClient = blackrock.module("http", "interface").client;
            httpClient.post("http://localhost:" + port + "/testuiagfasdiu", {}, {}, function(err, res) {
                if(err) { done(err); }
                expect(res).to.be.a("object");
                done();
            });
        });
        it('ensure that a client PUT request to the server can be made', (done) => {
            const instances = blackrock.module("http", "interface").list();
            const instance = blackrock.module("http", "interface").get(instances[0]);
            const port = instance.port;
            const httpClient = blackrock.module("http", "interface").client;
            httpClient.put("http://localhost:" + port + "/testuiagfasdiu", {}, {}, function(err, res) {
                if(err) { done(err); }
                expect(res).to.be.a("object");
                done();
            });
        });
        it('ensure that a client DELETE request to the server can be made', (done) => {
            const instances = blackrock.module("http", "interface").list();
            const instance = blackrock.module("http", "interface").get(instances[0]);
            const port = instance.port;
            const httpClient = blackrock.module("http", "interface").client;
            httpClient.delete('http://localhost:' + port + "/testuiagfasdiu", {}, {}, function(err, res) {
                if(err) { done(err); }
                expect(res).to.be.a("object");
                done();
            });
        });
    });

});

after(async () => { await blackrock.shutdown(); });
