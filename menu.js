/**
 * menu.js
 * The menu and the one object allowed to read or change it.
 *
 * SOLID — Single Responsibility Principle:
 *   MenuRepository only answers "what is on the menu and is it in stock?".
 *   It never prices an order, never renders HTML.
 *
 * It also extends Subject (Observer pattern) so the menu board redraws itself
 * when the counter marks something sold out.
 */
(function (global) {
  'use strict';

  var Subject = global.Cafe.Subject;

  // 8 items, 2 of them sold out on purpose so the OUT_OF_STOCK error is easy to demo.
  var MENU_ITEMS = [
    { id: 'esp', name: 'Espresso',             price: 2.50, category: 'drink', inStock: true },
    { id: 'flw', name: 'Flat white',           price: 3.75, category: 'drink', inStock: true },
    { id: 'ica', name: 'Iced americano',       price: 3.25, category: 'drink', inStock: true },
    { id: 'mnt', name: 'Fresh mint tea',       price: 2.25, category: 'drink', inStock: true },
    { id: 'chi', name: 'Masala chai',          price: 3.50, category: 'drink', inStock: false },
    { id: 'crs', name: 'Butter croissant',     price: 3.00, category: 'food',  inStock: true },
    { id: 'sim', name: 'Sesame simit',         price: 2.75, category: 'food',  inStock: true },
    { id: 'hal', name: 'Halloumi sandwich',    price: 6.50, category: 'food',  inStock: true },
    { id: 'brw', name: 'Walnut brownie',       price: 2.95, category: 'food',  inStock: false }
  ];

  class MenuRepository extends Subject {
    constructor(items) {
      super();
      this._items = (items || MENU_ITEMS).map(function (item) { return Object.assign({}, item); });
    }

    /** @returns {Array} copies, so no view can mutate the menu by accident */
    all() {
      return this._items.map(function (item) { return Object.assign({}, item); });
    }

    findById(id) {
      var found = this._items.find(function (item) { return item.id === id; });
      return found ? Object.assign({}, found) : null;
    }

    /** The counter ran out of something (or restocked it). */
    setStock(id, inStock) {
      var item = this._items.find(function (i) { return i.id === id; });
      if (!item) return null;
      item.inStock = Boolean(inStock);
      this.notify(this.all());
      return Object.assign({}, item);
    }
  }

  global.Cafe.MENU_ITEMS = MENU_ITEMS;
  global.Cafe.MenuRepository = MenuRepository;
})(typeof window !== 'undefined' ? window : globalThis);
