const http = require("http");
const url = require("url");

/* global suite, test */

//
// Note: This example test is leveraging the Mocha test framework.
// Please refer to their documentation on https://mochajs.org/ for help.
//

// The module 'assert' provides assertion methods from node
const assert = require('assert');

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
// const vscode = require('vscode');
// const myExtension = require('../extension');

suite("openfaas provider tests", function () {
    test("should be able to fetch credentials token from config", (done) => {
        const OpenFaasProvider = require("../providers/openfaas-provider");
        const target = new OpenFaasProvider();
        const token = target.getAuthenticationToken("http://127.0.0.1:31112");
        assert.notEqual(token, null);
        done();
    });
    test("should be able to list configured gateways", (done) => {
        const OpenFaasProvider = require("../providers/openfaas-provider");
        const target = new OpenFaasProvider();
        const gateways = target.getGateways();
        assert.notEqual(gateways, null);
        assert.equal(gateways.length, 1);
        done();
    });
    test("should call openfaas list mock api", function (done) {
        const server = http.createServer(function (req, res) {
            assert.equal(url.parse(req.url).path, "/system/functions");
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.write(JSON.stringify([{
                "name": "haveibeenpwned",
                "image": "functions/haveibeenpwned:0.13.0",
                "invocationCount": 23,
                "replicas": 1,
                "envProcess": "",
                "availableReplicas": 1,
                "labels": { "faas_function": "haveibeenpwned" },
                "annotations": { "prometheus.io.scrape": "false" }
            }]));
            res.end();
        }).listen(22222);
        const OpenFaasProvider = require("../providers/openfaas-provider");
        const target = new OpenFaasProvider();
        target.list("http://localhost:22222")
            .then((functions) => {
                assert.equal(1, functions.length, "mocked response contains 1 function");
                done();
            })
            .catch((error) => {
                done(error);
            })
            .finally(() => {
                server.close();
            });
    });
});
