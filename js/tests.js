/**
 * tests/tests.js
 * 16 unit tests, no install, no framework, no build step.
 * Open tests.html in a browser (or visit it on the live site) and read the list.
 *
 * The tests only touch the logic files: discounts, cart, pricing and placeOrder.
 * That is possible because none of those files know the DOM exists.
 */
(function (global) {
  'use strict';

  var Cafe = global.Cafe;
  var results = [];

  // ------------------------------------------------------------- tiny runner
  function test(name, fn) {
    try {
      fn();
      results.push({ name: name, passed: true });
    } catch (error) {
      results.push({ name: name, passed: false, message: error.message });
    }
  }

  function assert(condition, message) {
    if (!condition) throw new Error(message || 'Expected the condition to be true.');
  }

  function assertEqual(actual, expected, message) {
    if (actual !== expected) {
      throw new Error((message ? message + ' — ' : '') + 'expected ' + JSON.stringify(expected) +
        ' but got ' + JSON.stringify(actual));
    }
  }

  function assertClose(actual, expected, message) {
    if (Math.abs(actual - expected) > 0.005) {
      throw new Error((message ? message + ' — ' : '') + 'expected about ' + expected + ' but got ' + actual);
    }
  }

  // ---------------------------------------------------------------- fixtures
  var LATTE     = { id: 'lat', name: 'Flat white',       price: 4.00, category: 'drink', inStock: true };
  var TEA       = { id: 'tea', name: 'Fresh mint tea',   price: 2.00, category: 'drink', inStock: true };
  var CROISSANT = { id: 'crs', name: 'Butter croissant', price: 3.00, category: 'food',  inStock: true };
  var SOLD_OUT  = { id: 'brw', name: 'Walnut brownie',   price: 5.00, category: 'food',  inStock: false };

  function buildMenu() {
    return new Cafe.MenuRepository([LATTE, TEA, CROISSANT, SOLD_OUT]);
  }

  function buildCalculator() {
    return new Cafe.PriceCalculator(Cafe.createDefaultRegistry());
  }

  function buildService(menu) {
    return new Cafe.OrderService(menu || buildMenu(), buildCalculator(), new Cafe.SequentialOrderNumbers(1));
  }

  function lines(pairs) {
    return pairs.map(function (pair) { return { item: pair[0], quantity: pair[1] }; });
  }

  // ======================================================= totals & discounts
  test('Subtotal adds up every line', function () {
    var totals = buildCalculator().calculate(lines([[LATTE, 2], [CROISSANT, 1]]), 'NONE');
    assertClose(totals.subtotal, 11.00);
    assertClose(totals.total, 11.00);
  });

  test('An empty cart costs nothing', function () {
    var totals = buildCalculator().calculate([], 'NONE');
    assertClose(totals.subtotal, 0);
    assertClose(totals.total, 0);
  });

  test('Student discount takes 10% off', function () {
    var totals = buildCalculator().calculate(lines([[LATTE, 2], [CROISSANT, 1]]), 'STUDENT');
    assertClose(totals.discount, 1.10);
    assertClose(totals.total, 9.90);
  });

  test('Staff discount takes 15% off', function () {
    var totals = buildCalculator().calculate(lines([[LATTE, 2], [CROISSANT, 1]]), 'STAFF');
    assertClose(totals.discount, 1.65);
    assertClose(totals.total, 9.35);
  });

  test('Happy hour makes the cheaper of two drinks free', function () {
    var totals = buildCalculator().calculate(lines([[LATTE, 1], [TEA, 1]]), 'HAPPY_HOUR');
    assertClose(totals.discount, 2.00);
    assertClose(totals.total, 4.00);
  });

  test('Happy hour needs a second drink', function () {
    var totals = buildCalculator().calculate(lines([[LATTE, 1], [CROISSANT, 2]]), 'HAPPY_HOUR');
    assertClose(totals.discount, 0);
    assertClose(totals.total, 10.00);
  });

  test('Happy hour never discounts food', function () {
    var totals = buildCalculator().calculate(lines([[CROISSANT, 4]]), 'HAPPY_HOUR');
    assertClose(totals.discount, 0);
  });

  test('Two of the same drink still count as two drinks', function () {
    var totals = buildCalculator().calculate(lines([[TEA, 2]]), 'HAPPY_HOUR');
    assertClose(totals.discount, 2.00);
    assertClose(totals.total, 2.00);
  });

  test('An unknown discount code falls back to full price', function () {
    var totals = buildCalculator().calculate(lines([[LATTE, 1]]), 'NOT_A_REAL_CODE');
    assertEqual(totals.discountCode, 'NONE');
    assertClose(totals.total, 4.00);
  });

  test('A new discount rule needs no change to old code (Open/Closed)', function () {
    var registry = Cafe.createDefaultRegistry();
    registry.register({
      code: 'ALUMNI',
      label: 'Alumni (50% off)',
      calculate: function (unusedLines, subtotal) {
        return { amount: subtotal / 2, note: 'Half price.' };
      }
    });
    var totals = new Cafe.PriceCalculator(registry).calculate(lines([[LATTE, 1]]), 'ALUMNI');
    assertClose(totals.total, 2.00);
  });

  // ================================================================= observer
  test('The cart notifies its observers when a line is added', function () {
    var cart = new Cafe.Cart();
    var calls = 0;
    cart.subscribe(function () { calls++; });
    cart.subscribe(function () { calls++; });
    cart.add(LATTE, 1);
    assertEqual(calls, 2, 'both observers should run');
  });

  test('An observer can unsubscribe', function () {
    var cart = new Cafe.Cart();
    var calls = 0;
    var stop = cart.subscribe(function () { calls++; });
    cart.add(LATTE, 1);
    stop();
    cart.add(TEA, 1);
    assertEqual(calls, 1, 'the observer should only have heard the first change');
  });

  // ================================================== placeOrder contract
  test('placeOrder refuses an empty cart', function () {
    var result = buildService().placeOrder(new Cafe.Cart());
    assertEqual(result.ok, false);
    assertEqual(result.error.code, Cafe.ERROR_CODES.EMPTY_CART);
  });

  test('placeOrder refuses a quantity outside 1 to 10', function () {
    var cart = new Cafe.Cart();
    cart.add(LATTE, 1).setQuantity('lat', 11);
    var tooMany = buildService().placeOrder(cart);
    assertEqual(tooMany.error.code, Cafe.ERROR_CODES.INVALID_QUANTITY);
    assertEqual(tooMany.error.itemId, 'lat');

    cart.setQuantity('lat', 0);
    assertEqual(buildService().placeOrder(cart).error.code, Cafe.ERROR_CODES.INVALID_QUANTITY);
  });

  test('placeOrder refuses an item that sold out after it was added', function () {
    var menu = buildMenu();
    var cart = new Cafe.Cart();
    cart.add(menu.findById('lat'), 2);
    menu.setStock('lat', false); // the counter runs out while the customer decides
    var result = buildService(menu).placeOrder(cart);
    assertEqual(result.ok, false);
    assertEqual(result.error.code, Cafe.ERROR_CODES.OUT_OF_STOCK);
    assertEqual(result.error.itemId, 'lat');
  });

  test('A good order comes back with a number, a total and an untouched cart', function () {
    var cart = new Cafe.Cart();
    cart.add(LATTE, 2).add(CROISSANT, 1).setDiscount('STUDENT');
    var result = buildService().placeOrder(cart);

    assertEqual(result.ok, true);
    assertEqual(result.order.id, 'CAFE-0001');
    assertClose(result.order.total, 9.90);
    assertEqual(result.order.lines.length, 2);
    assertClose(result.order.lines[0].lineTotal, 8.00);
    assertEqual(cart.lines.length, 2, 'placeOrder must not empty the cart itself');
  });

  // ------------------------------------------------------------------ report
  var passed = results.filter(function (r) { return r.passed; }).length;
  var failed = results.length - passed;

  if (typeof document !== 'undefined') {
    var list = document.getElementById('test-results');
    var scoreboard = document.getElementById('scoreboard');
    if (scoreboard) {
      scoreboard.textContent = passed + ' of ' + results.length + ' tests passing';
      scoreboard.className = failed ? 'score score--bad' : 'score score--good';
    }
    if (list) {
      results.forEach(function (result) {
        var row = document.createElement('li');
        row.className = result.passed ? 'pass' : 'fail';
        row.innerHTML = '<span class="mark">' + (result.passed ? 'PASS' : 'FAIL') + '</span> ' + result.name +
          (result.passed ? '' : '<div class="why">' + result.message + '</div>');
        list.appendChild(row);
      });
    }
  }

  if (typeof console !== 'undefined') {
    console.log('Campus Café tests: ' + passed + '/' + results.length + ' passing');
    results.filter(function (r) { return !r.passed; })
      .forEach(function (r) { console.error('FAIL ' + r.name + ': ' + r.message); });
  }

  global.CafeTestResults = results;
})(typeof window !== 'undefined' ? window : globalThis);
