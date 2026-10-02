/**
 * cart.js
 * The cart (a Subject) and the price calculator.
 *
 * SOLID — Single Responsibility Principle:
 *   Cart holds lines and announces changes. It does not know about prices,
 *   discount rules, HTML or order numbers.
 *   PriceCalculator does arithmetic only.
 *
 * OBSERVER PATTERN:
 *   every mutating method ends with this._changed(), which notifies the total
 *   view, the receipt view and anything else that subscribed.
 *
 * Note on quantities: the cart stores exactly what the customer typed, even 0
 * or 11. Validation is the job of placeOrder(), which is where the contract is.
 */
(function (global) {
  'use strict';

  var Subject = global.Cafe.Subject;
  var round2 = global.Cafe.round2;

  class Cart extends Subject {
    constructor() {
      super();
      this._lines = new Map(); // itemId -> { item, quantity }
      this._discountCode = 'NONE';
    }

    get lines() {
      return Array.from(this._lines.values()).map(function (line) {
        return { item: Object.assign({}, line.item), quantity: line.quantity };
      });
    }

    get discountCode() {
      return this._discountCode;
    }

    get isEmpty() {
      return this._lines.size === 0;
    }

    /** Total number of units in the cart (used for the counter badge). */
    get itemCount() {
      var count = 0;
      this._lines.forEach(function (line) { count += line.quantity; });
      return count;
    }

    add(item, quantity) {
      if (!item || !item.id) throw new TypeError('add() needs a menu item.');
      var amount = quantity === undefined ? 1 : Number(quantity);
      var existing = this._lines.get(item.id);
      if (existing) {
        existing.quantity += amount;
      } else {
        this._lines.set(item.id, { item: Object.assign({}, item), quantity: amount });
      }
      this._changed('add', item.id);
      return this;
    }

    setQuantity(itemId, quantity) {
      var line = this._lines.get(itemId);
      if (!line) return this;
      line.quantity = Number(quantity);
      this._changed('quantity', itemId);
      return this;
    }

    remove(itemId) {
      if (this._lines.delete(itemId)) this._changed('remove', itemId);
      return this;
    }

    setDiscount(code) {
      this._discountCode = code;
      this._changed('discount', code);
      return this;
    }

    clear() {
      this._lines.clear();
      this._discountCode = 'NONE';
      this._changed('clear', null);
      return this;
    }

    _changed(reason, subject) {
      this.notify({ reason: reason, subject: subject, lines: this.lines, discountCode: this._discountCode });
    }
  }

  /**
   * Works out what the order costs.
   * SOLID — Dependency Inversion Principle: it is handed a registry (an
   * abstraction over "some set of discount rules"), it never builds one itself,
   * so tests can pass in a fake registry.
   */
  class PriceCalculator {
    constructor(discountRegistry) {
      if (!discountRegistry) throw new TypeError('PriceCalculator needs a discount registry.');
      this._registry = discountRegistry;
    }

    subtotal(lines) {
      var total = lines.reduce(function (sum, line) {
        return sum + line.item.price * line.quantity;
      }, 0);
      return round2(total);
    }

    /**
     * @returns {{subtotal:number, discount:number, total:number, discountCode:string, discountLabel:string, discountNote:string}}
     */
    calculate(lines, discountCode) {
      var subtotal = this.subtotal(lines);
      var strategy = this._registry.get(discountCode);
      var result = strategy.calculate(lines, subtotal);
      var discount = round2(Math.min(Math.max(result.amount, 0), Math.max(subtotal, 0)));

      return {
        subtotal: subtotal,
        discount: discount,
        total: round2(subtotal - discount),
        discountCode: strategy.code,
        discountLabel: strategy.label,
        discountNote: result.note
      };
    }
  }

  global.Cafe.Cart = Cart;
  global.Cafe.PriceCalculator = PriceCalculator;
})(typeof window !== 'undefined' ? window : globalThis);
