/**
 * order-service.js
 * THE CONTRACT for placeOrder(cart).
 *
 * ---------------------------------------------------------------------------
 * placeOrder(cart)
 *
 * TAKES
 *   cart : Cart — must expose .lines (array of { item, quantity }) and
 *                 .discountCode (string). Nothing else is read.
 *
 * RETURNS ON SUCCESS
 *   {
 *     ok: true,
 *     order: {
 *       id: 'CAFE-0431',          // order number shown to the customer
 *       placedAt: Date,
 *       lines: [{ item, quantity, lineTotal }],
 *       subtotal: 12.75,
 *       discount: 1.28,
 *       total: 11.47,
 *       discountCode: 'STUDENT',
 *       discountLabel: 'Student (10% off)'
 *     }
 *   }
 *
 * RETURNS ON FAILURE  (it never throws for an expected problem)
 *   { ok: false, error: { code, message, itemId? } }
 *
 *   EMPTY_CART        the cart has no lines.
 *   INVALID_QUANTITY  a quantity is not a whole number between 1 and 10.
 *                     error.itemId says which line.
 *   OUT_OF_STOCK      an item is no longer available at the counter.
 *                     error.itemId says which line.
 *
 * ORDER OF CHECKS: EMPTY_CART, then INVALID_QUANTITY, then OUT_OF_STOCK.
 *   The first failure is returned; later checks are not run.
 *
 * GUARANTEES
 *   The cart is never modified by this function, on success or on failure.
 *   Stock is read from the menu repository at the moment of ordering, not from
 *   the copy stored in the cart, so an item that sold out while the customer
 *   was deciding is still caught.
 * ---------------------------------------------------------------------------
 */
(function (global) {
  'use strict';

  var round2 = global.Cafe.round2;

  var ERROR_CODES = {
    EMPTY_CART: 'EMPTY_CART',
    INVALID_QUANTITY: 'INVALID_QUANTITY',
    OUT_OF_STOCK: 'OUT_OF_STOCK'
  };

  var MIN_QUANTITY = 1;
  var MAX_QUANTITY = 10;

  function failure(code, message, itemId) {
    var error = { code: code, message: message };
    if (itemId) error.itemId = itemId;
    return { ok: false, error: error };
  }

  /** Sequential order numbers, kept out of OrderService so it can be faked in tests. */
  class SequentialOrderNumbers {
    constructor(start) {
      this._next = start || 431;
    }
    next() {
      var number = this._next++;
      return 'CAFE-' + String(number).padStart(4, '0');
    }
  }

  /**
   * SOLID — Dependency Inversion Principle:
   *   OrderService is given a menu repository, a price calculator and a number
   *   generator. It depends on what they do, not on how they are built, which is
   *   why the unit tests can hand it stubs with no DOM in sight.
   * SOLID — Single Responsibility Principle:
   *   it validates and assembles an order. Pricing lives in PriceCalculator,
   *   rendering lives in ui.js.
   */
  class OrderService {
    constructor(menuRepository, priceCalculator, orderNumbers) {
      this._menu = menuRepository;
      this._prices = priceCalculator;
      this._numbers = orderNumbers || new SequentialOrderNumbers();
    }

    placeOrder(cart) {
      var lines = cart.lines;

      if (!lines.length) {
        return failure(ERROR_CODES.EMPTY_CART, 'Your cart is empty. Add something from the menu first.');
      }

      for (var i = 0; i < lines.length; i++) {
        var quantity = lines[i].quantity;
        if (!Number.isInteger(quantity) || quantity < MIN_QUANTITY || quantity > MAX_QUANTITY) {
          return failure(
            ERROR_CODES.INVALID_QUANTITY,
            'Quantity for ' + lines[i].item.name + ' must be a whole number between ' +
              MIN_QUANTITY + ' and ' + MAX_QUANTITY + '. You asked for ' + quantity + '.',
            lines[i].item.id
          );
        }
      }

      for (var j = 0; j < lines.length; j++) {
        var current = this._menu.findById(lines[j].item.id);
        if (!current || !current.inStock) {
          return failure(
            ERROR_CODES.OUT_OF_STOCK,
            lines[j].item.name + ' just sold out. Remove it to place the order.',
            lines[j].item.id
          );
        }
      }

      var totals = this._prices.calculate(lines, cart.discountCode);

      return {
        ok: true,
        order: {
          id: this._numbers.next(),
          placedAt: new Date(),
          lines: lines.map(function (line) {
            return {
              item: line.item,
              quantity: line.quantity,
              lineTotal: round2(line.item.price * line.quantity)
            };
          }),
          subtotal: totals.subtotal,
          discount: totals.discount,
          total: totals.total,
          discountCode: totals.discountCode,
          discountLabel: totals.discountLabel
        }
      };
    }
  }

  global.Cafe.ERROR_CODES = ERROR_CODES;
  global.Cafe.MIN_QUANTITY = MIN_QUANTITY;
  global.Cafe.MAX_QUANTITY = MAX_QUANTITY;
  global.Cafe.SequentialOrderNumbers = SequentialOrderNumbers;
  global.Cafe.OrderService = OrderService;
})(typeof window !== 'undefined' ? window : globalThis);
