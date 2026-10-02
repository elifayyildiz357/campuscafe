/**
 * discounts.js
 * STRATEGY PATTERN — one class per discount rule, all behind the same interface.
 *
 * The interface every strategy implements:
 *   get code()                      -> string, e.g. 'STUDENT'
 *   get label()                     -> string shown in the UI
 *   calculate(lines, subtotal)      -> { amount: number, note: string }
 *
 * Nothing outside this file knows how a discount is worked out. The cart and the
 * price calculator just ask the registry for a strategy and call calculate().
 *
 * SOLID — Open/Closed Principle:
 *   a new rule (Alumni? Rainy Tuesday?) is a new class + one register() call.
 *   No existing class is edited, so nothing that already works can break.
 * SOLID — Liskov Substitution Principle:
 *   every strategy can stand in for DiscountStrategy; the caller never type-checks.
 */
(function (global) {
  'use strict';

  function round2(value) {
    return Math.round(value * 100) / 100;
  }

  /** Abstract base. Defines the contract, implements nothing useful. */
  class DiscountStrategy {
    get code() { throw new Error('A discount strategy must expose a code.'); }
    get label() { throw new Error('A discount strategy must expose a label.'); }
    /* eslint-disable-next-line no-unused-vars */
    calculate(lines, subtotal) { throw new Error('A discount strategy must implement calculate().'); }
  }

  class NoDiscount extends DiscountStrategy {
    get code() { return 'NONE'; }
    get label() { return 'No discount'; }
    calculate() {
      return { amount: 0, note: 'Full price.' };
    }
  }

  /** Percentage rules share their maths, so Student and Staff both extend this. */
  class PercentageDiscount extends DiscountStrategy {
    constructor(code, label, percentage) {
      super();
      this._code = code;
      this._label = label;
      this._percentage = percentage;
    }
    get code() { return this._code; }
    get label() { return this._label; }
    get percentage() { return this._percentage; }
    calculate(lines, subtotal) {
      var amount = round2(subtotal * this._percentage);
      return {
        amount: amount,
        note: Math.round(this._percentage * 100) + '% off the whole order.'
      };
    }
  }

  class StudentDiscount extends PercentageDiscount {
    constructor() { super('STUDENT', 'Student (10% off)', 0.10); }
  }

  class StaffDiscount extends PercentageDiscount {
    constructor() { super('STAFF', 'Staff (15% off)', 0.15); }
  }

  /**
   * Happy hour: the second drink is free.
   * "Free" means the cheapest drink in the order, once per order, and only
   * when there are at least two drinks. Food is never discounted.
   */
  class HappyHourDiscount extends DiscountStrategy {
    get code() { return 'HAPPY_HOUR'; }
    get label() { return 'Happy hour (second drink free)'; }
    calculate(lines) {
      var drinkPrices = [];
      lines.forEach(function (line) {
        if (line.item.category !== 'drink') return;
        for (var i = 0; i < line.quantity; i++) {
          drinkPrices.push(line.item.price);
        }
      });

      if (drinkPrices.length < 2) {
        return { amount: 0, note: 'Add a second drink and the cheaper one is free.' };
      }

      drinkPrices.sort(function (a, b) { return a - b; });
      var free = round2(drinkPrices[0]);
      return { amount: free, note: 'Second drink is free (\u2212$' + free.toFixed(2) + ').' };
    }
  }

  /**
   * Holds every available strategy and hands one back by code.
   * The UI builds its discount buttons from registry.all(), so registering a new
   * rule puts a new button on the page with no HTML change.
   */
  class DiscountRegistry {
    constructor(strategies) {
      this._strategies = new Map();
      (strategies || []).forEach(this.register, this);
    }

    register(strategy) {
      this._strategies.set(strategy.code, strategy);
      return this;
    }

    /** Unknown codes fall back to NoDiscount so the app never crashes. */
    get(code) {
      return this._strategies.get(code) || this._strategies.get('NONE') || new NoDiscount();
    }

    has(code) {
      return this._strategies.has(code);
    }

    all() {
      return Array.from(this._strategies.values());
    }
  }

  function createDefaultRegistry() {
    return new DiscountRegistry([
      new NoDiscount(),
      new StudentDiscount(),
      new StaffDiscount(),
      new HappyHourDiscount()
    ]);
  }

  global.Cafe = global.Cafe || {};
  global.Cafe.round2 = round2;
  global.Cafe.DiscountStrategy = DiscountStrategy;
  global.Cafe.NoDiscount = NoDiscount;
  global.Cafe.PercentageDiscount = PercentageDiscount;
  global.Cafe.StudentDiscount = StudentDiscount;
  global.Cafe.StaffDiscount = StaffDiscount;
  global.Cafe.HappyHourDiscount = HappyHourDiscount;
  global.Cafe.DiscountRegistry = DiscountRegistry;
  global.Cafe.createDefaultRegistry = createDefaultRegistry;
})(typeof window !== 'undefined' ? window : globalThis);
