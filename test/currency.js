'use strict';

var should = require('should');
var sinon = require('sinon');

var CurrencyController = require('../lib/currency');
var proxyquire = require('proxyquire');

describe('Currency', function() {

  var krakenData = {
    "error":[],
    "result": {
      "BCHUSD": {
        "a":["448.800000","2","2.000"],
        "b":["448.500000","1","1.000"],
        "c":["448.600000","0.57800000"],
        "v":["2244.24941029","2889.88796717"],
        "p":["436.475903","438.858681"],
        "t":[2162,2725],
        "l":["411.900000","411.900000"],
        "h":["456.800000","460.300000"],
        "o":"449.000000"
      }
    }
  };

  it.skip('will make live request to kraken', function(done) {
    var currency = new CurrencyController({});
    var req = {};
    var res = {
      jsonp: function(response) {
        response.status.should.equal(200);
        should.exist(response.data.rates.USD[0].rate);
        (typeof response.data.rates.USD[0].rate).should.equal('number');
        done();
      }
    };
    currency.index(req, res);
  });

  it('will retrieve a fresh value', function(done) {
    var requestStub = sinon.stub();
    requestStub.onCall(0).callsArgWith(1, null, {statusCode: 200}, JSON.stringify(krakenData));
    requestStub.onCall(1).callsArgWith(1, null, {statusCode: 200}, JSON.stringify(krakenData));
    requestStub.returns(2);

    var TestCurrencyController = proxyquire('../lib/currency', {
      request: requestStub
    });
    var node = {
      log: {
        error: sinon.stub()
      }
    };
    var currency = new TestCurrencyController({node: node});
    currency.rates = {
      USD: [{
        name: 'Kraken',
        rate: 190.10
      }],
      EUR: [{
        name: 'Kraken',
        rate: 190.10
      }]
    };
    currency.timestamp = Date.now() - 61000 * CurrencyController.DEFAULT_CURRENCY_DELAY;
    var req = {};
    var res = {
      jsonp: function(response) {
        response.status.should.equal(200);
        should.exist(response.data.rates.USD[0].rate);
        response.data.rates.USD[0].rate.should.equal(448.60);
        done();
      }
    };
    currency.index(req, res);
  });

  it('will log an error from request', function(done) {
    var TestCurrencyController = proxyquire('../lib/currency', {
      request: sinon.stub().callsArgWith(1, new Error('test'))
    });
    var node = {
      log: {
        error: sinon.stub()
      }
    };
    var currency = new TestCurrencyController({node: node});
    currency.rates = {
      USD: [{
        name: 'Kraken',
        rate: 448.60
      }],
      EUR: [{
        name: 'Kraken',
        rate: 190.10
      }]
    };
    currency.timestamp = Date.now() - 65000 * CurrencyController.DEFAULT_CURRENCY_DELAY;
    var req = {};
    var res = {
      jsonp: function(response) {
        response.status.should.equal(200);
        should.exist(response.data.rates.USD[0].rate);
        response.data.rates.USD[0].rate.should.equal(448.60);
        node.log.error.called;
        done();
      }
    };
    currency.index(req, res);
  });

  it('will retrieve a cached value', function(done) {
    var request = sinon.stub();
    var TestCurrencyController = proxyquire('../lib/currency', {
      request: request
    });
    var node = {
      log: {
        error: sinon.stub()
      }
    };
    var currency = new TestCurrencyController({node: node});
    currency.rates = {
      USD: [{
        name: 'Kraken',
        rate: 448.60
      }],
      EUR: [{
        name: 'Kraken',
        rate: 190.10
      }]
    };
    currency.timestamp = Date.now();
    var req = {};
    var res = {
      jsonp: function(response) {
        response.status.should.equal(200);
        should.exist(response.data.rates.USD[0].rate);
        response.data.rates.USD[0].rate.should.equal(448.60);
        request.callCount.should.equal(0);
        done();
      }
    };
    currency.index(req, res);
  });

});
