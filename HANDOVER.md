# Campus Café Order Page — full project review

Everything in one document: the brief, how each graded requirement is met, every file
with its complete source, and what is still left for the team to do. Read top to bottom,
or jump to "Review checklist" at the end if you only have ten minutes.

**Live page:** `https://USERNAME.github.io/campus-cafe-order/` — fill in after Pages is on
**Tests:** `https://USERNAME.github.io/campus-cafe-order/tests.html`
**Repository:** `https://github.com/USERNAME/campus-cafe-order`

---

## 1. The brief, and where each requirement is met

| The assignment asks for | Points | Where it is in this project |
|---|---|---|
| Menu of 6+ items with name, price, stock | 35 | `js/menu.js` — 9 items, two of them out of stock on purpose |
| Cart: add, remove, change quantity, total updates by itself | 35 | `js/cart.js` (state) and `js/ui.js` (the views that redraw) |
| Four discount choices | 35 | `js/discounts.js` — None, Student 10%, Staff 15%, Happy hour |
| Place order with clear errors | 35 | `js/order-service.js` validates, `js/ui.js` displays |
| Strategy pattern for discounts | 20 | `js/discounts.js`, one class per rule behind one interface |
| Observer pattern for cart changes | 20 | `js/observable.js` + `js/cart.js`, four views subscribe in `js/ui.js` |
| Two SOLID principles | 20 | Single Responsibility and Open/Closed — section 4 below |
| `placeOrder(cart)` contract with three error codes | 15 | Header comment of `js/order-service.js`, section 5 below |
| The page handles each error code | 15 | `showError()` in `js/ui.js` |
| 3+ passing unit tests | 15 | `tests/tests.js` — 16 tests, all passing |
| README and commits from every member | 10 | `README.md`; commits are the team's job, see section 8 |
| Presentation and live demo | 5 | Six-slide deck with speaker notes, plus the demo script in `TEAM-PLAN.md` |

---

## 2. How to run it

**The app.** Open the live link, or download the repository and double-click `index.html`.
There is nothing to install, no build step, no server, no npm. Plain HTML, CSS and
JavaScript loaded with `<script>` tags, which is why double-clicking works.

**The tests.** Open `tests.html` the same way, or add `/tests.html` to the live link. It
runs all 16 tests on load and prints `16 of 16 tests passing` at the top, one line per
test, red with an explanation if any fails. The same summary goes to the browser console.

---

## 3. How the pieces fit together

```
      MenuRepository                DiscountRegistry
      (what's on the board,         (which discount rules exist)
       what's in stock)                     |
            |                               |
            |                        PriceCalculator
            |                        (subtotal, discount, total)
            |                               |
            +------------ OrderService -----+
                          (validates, assembles the order)
                                 ^
                                 | placeOrder(cart)
                                 |
   Cart  ---- notifies ---->  ui.js
  (lines, (four observers)   (the only file that touches the DOM)
   discount
   code)
```

The arrows only point one way. `cart.js` has no idea `ui.js` exists; `discounts.js` has no
idea either file exists. That is what makes the unit tests possible with no browser page
loaded at all.

---

## 4. The two SOLID principles we claim

**Single Responsibility.** Each file has one reason to change.

- `Cart` stores lines and announces that they changed. It does not price anything.
- `PriceCalculator` does arithmetic and nothing else.
- `OrderService` validates and assembles an order.
- `MenuRepository` owns the menu and stock.
- `ui.js` is the only file that reads or writes the DOM.

The proof is practical: `tests/tests.js` exercises the whole pricing and validation engine
without a single DOM element, because none of those files reference one.

**Open/Closed.** The discount system is open to new rules and closed to edits of existing
ones. Adding a rule means writing a new class and calling `registry.register(...)`. No
existing class is touched, and the page grows a new radio button on its own, because
`ui.js` builds the discount list from `registry.all()` rather than from hard-coded HTML.
The test named *"A new discount rule needs no change to old code"* registers an Alumni
rule at runtime and proves the pricing picks it up.

*(Bonus, if the instructor asks for a third: Dependency Inversion. `OrderService` is handed
a menu repository, a price calculator and an order-number generator through its
constructor, so the tests pass in a fixed number generator and get predictable order ids.)*

---

## 5. The `placeOrder(cart)` contract

**Takes:** a `cart` exposing `.lines` — an array of `{ item, quantity }` — and
`.discountCode`. Nothing else is read.

**Returns on success:**

```js
{
  ok: true,
  order: {
    id: 'CAFE-0431',
    placedAt: Date,
    lines: [{ item, quantity, lineTotal }],
    subtotal: 12.75,
    discount: 1.28,
    total: 11.47,
    discountCode: 'STUDENT',
    discountLabel: 'Student (10% off)'
  }
}
```

**Returns on failure** — it never throws for an expected problem:

```js
{ ok: false, error: { code, message, itemId? } }
```

| Code | When it fires | What the page does |
|---|---|---|
| `EMPTY_CART` | no lines on the ticket | red message: add something from the menu first |
| `INVALID_QUANTITY` | quantity is not a whole number from 1 to 10 | red message naming the item and the number refused; that ticket line is highlighted |
| `OUT_OF_STOCK` | the item is no longer available at the counter | red message naming the item; that ticket line is highlighted |

**Order of checks:** empty cart, then quantities, then stock. The first failure returns and
later checks do not run.

**Guarantees:** the cart is never modified, on success or on failure — the page decides to
clear it afterwards. Stock is read from the menu repository at the moment of ordering, not
from the copy stored in the cart, so an item that sold out while the customer was deciding
is still caught. There is a unit test for exactly that case.

---

## 6. Every file, with its source

Thirteen files. The six in `js/` hold the logic, `tests/` holds the tests, and the three
Markdown files are documentation for the team and the instructor.

---

### `index.html`

**The page itself**

Structure only: the menu board on the left, the order ticket on the right, and the six script tags at the bottom in dependency order. Every element the JavaScript needs is addressed by id. No inline JavaScript and no inline styles.

*What a reviewer should look at:* the script tag order at the bottom — `observable.js` must load before `menu.js` and `cart.js`, because both extend `Subject`.

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>Campus Café — order at the counter</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Archivo:wght@400;500;600;700&family=Courier+Prime:wght@400;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="styles.css">
</head>
<body>

<header class="counter">
  <div class="counter-inner">
    <h1>Campus Café</h1>
    <p class="counter-note">Order from the board, pay at the till. Open 7:30 to 16:00.</p>
  </div>
</header>

<main class="room">

  <section class="board" aria-labelledby="board-heading">
    <div class="board-head">
      <h2 id="board-heading">Today's board</h2>
      <p class="board-hint">Tap an item to put it on the ticket. <em>Sell out</em> is there so you can see what happens when the kitchen runs out mid-order.</p>
    </div>
    <ul class="menu" id="menu-board"></ul>
  </section>

  <section class="ticket" aria-labelledby="ticket-heading">
    <div class="ticket-head">
      <h2 id="ticket-heading">Your ticket</h2>
      <span class="count" id="item-count">0 items</span>
    </div>

    <ul class="ticket-list" id="ticket-lines"></ul>

    <fieldset class="discounts">
      <legend>Discount</legend>
      <div id="discount-choices"></div>
    </fieldset>

    <div class="totals" id="totals"></div>

    <p class="summary" id="summary"></p>

    <div class="actions">
      <button type="button" id="place-order" class="primary">Place order</button>
      <button type="button" id="clear-cart" class="quiet">Clear ticket</button>
    </div>

    <div class="message" id="message" role="status" aria-live="polite"></div>

    <details class="observer-proof">
      <summary>What the cart just told its observers</summary>
      <ul id="event-log"></ul>
      <p>Four views subscribe to the cart: the line list, the total, the summary sentence and this log. The cart calls none of them by name.</p>
    </details>
  </section>

</main>

<footer class="colophon">
  <p>Built for the software engineering team project — Strategy, Observer, SOLID, a documented <code>placeOrder</code> contract and unit tests. <a href="tests.html">Run the tests</a>.</p>
</footer>

<script src="js/observable.js"></script>
<script src="js/menu.js"></script>
<script src="js/discounts.js"></script>
<script src="js/cart.js"></script>
<script src="js/order-service.js"></script>
<script src="js/ui.js"></script>
</body>
</html>
```

---

### `styles.css`

**All styling**

A café menu board and a paper order ticket. Responsive down to a phone, keyboard focus rings on every control, and reduced motion respected.

*What a reviewer should look at:* nothing in particular; no logic lives here.

```css
/* Campus Café — a menu board on the wall, a paper ticket on the counter. */

:root {
  --paper:    #edefe9;
  --card:     #fbfaf6;
  --ink:      #18211d;
  --teal:     #0e3b35;
  --mint:     #8fe3c8;
  --amber:    #e8a317;
  --poppy:    #b8321f;
  --rule:     rgba(24, 33, 29, 0.14);
  --muted:    rgba(24, 33, 29, 0.6);

  box-sizing: border-box;
  padding-top: env(safe-area-inset-top, 0px);
  padding-bottom: env(safe-area-inset-bottom, 0px);
}

*, *::before, *::after { box-sizing: inherit; }

body {
  margin: 0;
  background: var(--paper);
  color: var(--ink);
  font-family: 'Archivo', system-ui, -apple-system, 'Segoe UI', sans-serif;
  font-size: 16px;
  line-height: 1.5;
  -webkit-font-smoothing: antialiased;
}

h1, h2 { margin: 0; font-weight: 700; letter-spacing: -0.015em; }

/* ------------------------------------------------------------- the counter */
.counter {
  background: var(--teal);
  color: var(--card);
  padding: clamp(1.75rem, 5vw, 3rem) 1.25rem;
  border-bottom: 6px solid var(--mint);
}
.counter-inner { max-width: 1060px; margin: 0 auto; }
.counter h1 {
  font-size: clamp(2.3rem, 7vw, 4rem);
  line-height: 0.95;
  letter-spacing: -0.04em;
}
.counter-note {
  margin: 0.6rem 0 0;
  max-width: 46ch;
  color: var(--mint);
  font-size: 1rem;
}

/* ------------------------------------------------------------------ layout */
.room {
  max-width: 1060px;
  margin: 0 auto;
  padding: clamp(1.25rem, 4vw, 2.5rem) 1.25rem 3rem;
  display: grid;
  gap: clamp(1.25rem, 4vw, 2.5rem);
  grid-template-columns: 1fr;
  align-items: start;
}
@media (min-width: 900px) {
  .room { grid-template-columns: minmax(0, 1.35fr) minmax(330px, 1fr); }
  .ticket { position: sticky; top: calc(1.5rem + env(safe-area-inset-top, 0px)); }
}

/* -------------------------------------------------------------- menu board */
.board-head h2 { font-size: 1.45rem; }
.board-hint {
  margin: 0.35rem 0 1.25rem;
  color: var(--muted);
  max-width: 60ch;
  font-size: 0.93rem;
}
.board-hint em { font-style: normal; font-weight: 600; color: var(--ink); }

.menu { list-style: none; margin: 0; padding: 0; }

.menu-row {
  display: flex;
  align-items: baseline;
  gap: 0.75rem;
  padding: 0.3rem 0;
  border-bottom: 1px dashed var(--rule);
}

.menu-add {
  flex: 1 1 auto;
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
  min-width: 0;
  padding: 0.55rem 0.1rem;
  background: none;
  border: 0;
  border-radius: 3px;
  color: inherit;
  font: inherit;
  text-align: left;
  cursor: pointer;
}
.menu-add:hover:not(:disabled) .menu-name { color: var(--teal); }
.menu-add:hover:not(:disabled) .menu-price { background: var(--mint); }
.menu-add:disabled { cursor: not-allowed; opacity: 0.45; }

.menu-name { font-weight: 600; font-size: 1.07rem; }
.menu-leader {
  flex: 1 1 auto;
  min-width: 1.5rem;
  border-bottom: 1px dotted var(--rule);
  transform: translateY(-0.2em);
}
.menu-price {
  font-family: 'Courier Prime', ui-monospace, monospace;
  font-weight: 700;
  padding: 0 0.2rem;
}

.stock-toggle {
  flex: 0 0 auto;
  background: none;
  border: 1px solid var(--rule);
  border-radius: 999px;
  padding: 0.18rem 0.6rem;
  font: inherit;
  font-size: 0.74rem;
  color: var(--muted);
  cursor: pointer;
}
.stock-toggle:hover { border-color: var(--teal); color: var(--teal); }

.sold-stamp {
  flex: 0 0 auto;
  font-family: 'Courier Prime', monospace;
  font-size: 0.74rem;
  color: var(--poppy);
  border: 1.5px solid var(--poppy);
  padding: 0 0.3rem;
  transform: rotate(-4deg);
}
.menu-row.is-sold-out .menu-name { text-decoration: line-through; }

/* ------------------------------------------------------------- the ticket */
.ticket {
  background: var(--card);
  border: 1px solid var(--rule);
  box-shadow: 0 18px 30px -26px rgba(14, 59, 53, 0.9);
  padding: 1.25rem;
}
.ticket-head {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 1rem;
  padding-bottom: 0.75rem;
  border-bottom: 2px solid var(--ink);
}
.ticket-head h2 { font-size: 1.2rem; }
.count {
  font-family: 'Courier Prime', monospace;
  font-size: 0.85rem;
  color: var(--muted);
}

.ticket-list { list-style: none; margin: 0; padding: 0.5rem 0; }
.ticket-empty {
  padding: 1rem 0;
  color: var(--muted);
  font-size: 0.93rem;
}
.ticket-line {
  display: grid;
  grid-template-columns: 1fr 4rem 4.2rem;
  grid-template-areas: 'name qty total' 'remove remove remove';
  gap: 0.3rem 0.5rem;
  align-items: center;
  padding: 0.5rem 0.4rem;
  border-bottom: 1px dotted var(--rule);
}
@media (min-width: 420px) {
  .ticket-line {
    grid-template-columns: 1fr 3.6rem 4rem auto;
    grid-template-areas: 'name qty total remove';
  }
}
.ticket-line.is-flagged {
  background: rgba(184, 50, 31, 0.09);
  box-shadow: inset 3px 0 0 var(--poppy);
}
.ticket-name { grid-area: name; font-weight: 500; }
.ticket-quantity {
  grid-area: qty;
  width: 100%;
  padding: 0.25rem 0.35rem;
  border: 1px solid var(--rule);
  border-radius: 3px;
  background: #fff;
  font-family: 'Courier Prime', monospace;
  font-size: 0.95rem;
}
.ticket-line-total {
  grid-area: total;
  text-align: right;
  font-family: 'Courier Prime', monospace;
}
.ticket-remove {
  grid-area: remove;
  justify-self: start;
  background: none;
  border: 0;
  padding: 0.1rem 0;
  font: inherit;
  font-size: 0.8rem;
  color: var(--muted);
  text-decoration: underline;
  cursor: pointer;
}
.ticket-remove:hover { color: var(--poppy); }

/* ---------------------------------------------------------------- discounts */
.discounts {
  margin: 1rem 0 0;
  padding: 0.75rem 0 0;
  border: 0;
  border-top: 1px solid var(--rule);
}
.discounts legend {
  padding: 0;
  font-size: 0.8rem;
  color: var(--muted);
}
.discount-choice {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.22rem 0;
  font-size: 0.93rem;
  cursor: pointer;
}
.discount-choice input { accent-color: var(--teal); margin: 0; }

/* ------------------------------------------------------------------ totals */
.totals { margin-top: 1rem; border-top: 2px solid var(--ink); padding-top: 0.6rem; }
.total-row {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  font-family: 'Courier Prime', monospace;
  font-size: 0.95rem;
  padding: 0.15rem 0;
}
.total-row--discount span:last-child { color: var(--poppy); }
.total-row--grand {
  margin-top: 0.35rem;
  padding-top: 0.35rem;
  border-top: 1px dashed var(--rule);
  font-size: 1.3rem;
  font-weight: 700;
}
.discount-note {
  margin: 0.4rem 0 0;
  font-size: 0.8rem;
  color: var(--muted);
}

.summary {
  margin: 0.9rem 0 0;
  padding: 0.6rem 0.7rem;
  background: rgba(143, 227, 200, 0.28);
  font-size: 0.9rem;
}

/* ----------------------------------------------------------------- buttons */
.actions { display: flex; gap: 0.6rem; margin-top: 1rem; flex-wrap: wrap; }
.primary {
  flex: 1 1 auto;
  background: var(--teal);
  color: #fff;
  border: 0;
  border-radius: 3px;
  padding: 0.8rem 1.2rem;
  font: inherit;
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
}
.primary:hover { background: #12514a; }
.quiet {
  background: none;
  border: 1px solid var(--rule);
  border-radius: 3px;
  padding: 0.8rem 1rem;
  font: inherit;
  color: var(--muted);
  cursor: pointer;
}
.quiet:hover { color: var(--ink); border-color: var(--ink); }

:where(button, input, a, summary):focus-visible {
  outline: 3px solid var(--amber);
  outline-offset: 2px;
}

/* ---------------------------------------------------------------- messages */
.message:empty { display: none; }
.message {
  margin-top: 1rem;
  padding: 0.8rem 0.9rem;
  font-size: 0.92rem;
  background: rgba(24, 33, 29, 0.05);
}
.message--error {
  background: rgba(184, 50, 31, 0.1);
  border-left: 4px solid var(--poppy);
  display: grid;
  gap: 0.3rem;
}
.message-code {
  font-family: 'Courier Prime', monospace;
  font-weight: 700;
  font-size: 0.78rem;
  color: var(--poppy);
}
.message--success {
  background: #fff;
  border: 1px solid var(--rule);
  border-left: 4px solid var(--teal);
}
.receipt-title { margin: 0 0 0.6rem; font-weight: 600; }
.receipt { font-family: 'Courier Prime', monospace; font-size: 0.88rem; }
.receipt-line { display: flex; justify-content: space-between; gap: 1rem; padding: 0.08rem 0; }
.receipt-line--rule { margin-top: 0.4rem; padding-top: 0.4rem; border-top: 1px dashed var(--rule); }
.receipt-line--total { margin-top: 0.3rem; font-weight: 700; font-size: 1.05rem; }

/* ------------------------------------------------------- observer evidence */
.observer-proof {
  margin-top: 1.1rem;
  border-top: 1px solid var(--rule);
  padding-top: 0.7rem;
  font-size: 0.82rem;
  color: var(--muted);
}
.observer-proof summary { cursor: pointer; color: var(--teal); font-weight: 600; }
.observer-proof ul {
  list-style: none;
  margin: 0.6rem 0;
  padding: 0;
  font-family: 'Courier Prime', monospace;
  font-size: 0.76rem;
}
.observer-proof li { padding: 0.1rem 0; }
.observer-proof p { margin: 0.4rem 0 0; }

/* --------------------------------------------------------------- colophon */
.colophon {
  border-top: 1px solid var(--rule);
  padding: 1.5rem 1.25rem 2.5rem;
  font-size: 0.85rem;
  color: var(--muted);
}
.colophon p { max-width: 70ch; margin: 0 auto; }
.colophon code { font-family: 'Courier Prime', monospace; }
.colophon a { color: var(--teal); }

@media (prefers-reduced-motion: reduce) {
  * { animation: none !important; transition: none !important; }
}
```

---

### `js/observable.js`

**Observer pattern, the subject half**

A `Subject` keeps a list of listener functions and calls every one when something changes. It knows nothing about the views that listen to it, which is the whole point of the pattern.

*What a reviewer should look at:* `subscribe()` returns a function that unsubscribes — there is a unit test for it.

```javascript
/**
 * observable.js
 * OBSERVER PATTERN — the "subject" half.
 *
 * A Subject keeps a list of listener functions and calls every one of them
 * when something changes. It knows nothing about the views that listen to it,
 * so we can add a new view (a badge, a receipt, a debug log) without touching
 * this file or the Cart.
 *
 * SOLID — Open/Closed Principle:
 *   new observers are added by calling subscribe(), never by editing Cart or Subject.
 */
(function (global) {
  'use strict';

  class Subject {
    constructor() {
      this._observers = [];
    }

    /**
     * Register an observer.
     * @param {(payload: any) => void} observer
     * @returns {() => void} call it to stop listening
     */
    subscribe(observer) {
      if (typeof observer !== 'function') {
        throw new TypeError('An observer must be a function.');
      }
      this._observers.push(observer);
      return () => this.unsubscribe(observer);
    }

    unsubscribe(observer) {
      this._observers = this._observers.filter(function (o) { return o !== observer; });
    }

    /** Tell every observer that something changed. */
    notify(payload) {
      this._observers.slice().forEach(function (observer) {
        observer(payload);
      });
    }

    get observerCount() {
      return this._observers.length;
    }
  }

  global.Cafe = global.Cafe || {};
  global.Cafe.Subject = Subject;
})(typeof window !== 'undefined' ? window : globalThis);
```

---

### `js/menu.js`

**The menu and the only object allowed to change it**

Nine items, each with id, name, price, category and stock flag. Two are out of stock at start so the `OUT_OF_STOCK` error is easy to demonstrate. `MenuRepository` also extends `Subject`, so marking something sold out redraws the board by itself.

*What a reviewer should look at:* `all()` and `findById()` return copies, so no view can corrupt the menu by accident. **This is the file the team should rewrite with their own menu.**

```javascript
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
```

---

### `js/discounts.js`

**STRATEGY PATTERN**

One class per discount rule, all behind the same interface: `calculate(lines, subtotal)` returning `{ amount, note }`. `DiscountRegistry` hands the right one to the price calculator by code. Nothing outside this file knows how any discount is worked out.

*What a reviewer should look at:* `DiscountStrategy` is the interface; `NoDiscount`, `PercentageDiscount` (reused by `StudentDiscount` and `StaffDiscount`) and `HappyHourDiscount` implement it. Happy hour means: with two or more drinks, the cheapest drink is free, once per order, food excluded.

```javascript
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
```

---

### `js/cart.js`

**The cart (a Subject) and the price calculator**

`Cart` holds lines and a discount code, and every mutating method ends in `_changed()`, which notifies the observers. `PriceCalculator` turns lines plus a discount code into subtotal, discount and total.

*What a reviewer should look at:* the cart deliberately stores whatever quantity the customer typed, even 0 or 11. Validation belongs to `placeOrder`, which is where the contract is — that separation is intentional, not an oversight.

```javascript
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
```

---

### `js/order-service.js`

**THE CONTRACT, the error codes and the validator**

The header comment is the written contract the brief asks for. `OrderService` runs the three checks in order and assembles the order on success.

*What a reviewer should look at:* the three validation blocks in `placeOrder()`, and the fact that stock is re-read from the menu repository rather than trusted from the cart's copy.

```javascript
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
```

---

### `js/ui.js`

**Every DOM read and write, and nothing else**

Renders the menu and the ticket, wires up the buttons, and displays errors and receipts. Four views subscribe to the cart at the bottom of the file; none of them calls another.

*What a reviewer should look at:* the four `cart.subscribe(...)` calls near the end — the line list, the total, the summary and the event log. The total is never recalculated inside a click handler.

```javascript
/**
 * ui.js
 * Everything that touches the DOM lives here, and nothing else does.
 *
 * Each view below is an OBSERVER: it subscribes to the cart once at start-up and
 * redraws itself whenever the cart notifies. No cart method ever calls a view
 * directly, and no view calls another view.
 *
 * SOLID — Single Responsibility Principle:
 *   the business rules (discounts, validation, pricing) are in the other files.
 *   This file turns state into HTML and turns clicks into method calls.
 */
(function (global) {
  'use strict';

  var Cafe = global.Cafe;

  function money(value) {
    return '$' + Number(value).toFixed(2);
  }

  function el(id) {
    return document.getElementById(id);
  }

  function startApp() {
    var menu = new Cafe.MenuRepository();
    var registry = Cafe.createDefaultRegistry();
    var prices = new Cafe.PriceCalculator(registry);
    var cart = new Cafe.Cart();
    var orders = new Cafe.OrderService(menu, prices, new Cafe.SequentialOrderNumbers(431));

    var menuBoard = el('menu-board');
    var discountChoices = el('discount-choices');
    var ticketLines = el('ticket-lines');
    var totalsBox = el('totals');
    var summaryBox = el('summary');
    var messageBox = el('message');
    var eventLog = el('event-log');
    var countBadge = el('item-count');
    var placeButton = el('place-order');

    // ---------------------------------------------------------------- menu board
    function renderMenu() {
      menuBoard.innerHTML = '';
      menu.all().forEach(function (item) {
        var row = document.createElement('li');
        row.className = 'menu-row' + (item.inStock ? '' : ' is-sold-out');

        var button = document.createElement('button');
        button.className = 'menu-add';
        button.type = 'button';
        button.disabled = !item.inStock;
        button.setAttribute('aria-label', 'Add ' + item.name + ' to the order');
        button.innerHTML =
          '<span class="menu-name">' + item.name + '</span>' +
          '<span class="menu-leader" aria-hidden="true"></span>' +
          '<span class="menu-price">' + money(item.price) + '</span>';
        button.addEventListener('click', function () {
          cart.add(item, 1);
        });

        var stockToggle = document.createElement('button');
        stockToggle.className = 'stock-toggle';
        stockToggle.type = 'button';
        stockToggle.textContent = item.inStock ? 'Sell out' : 'Restock';
        stockToggle.title = item.inStock
          ? 'Mark this as sold out, the way the counter would'
          : 'Put it back on the board';
        stockToggle.addEventListener('click', function () {
          menu.setStock(item.id, !item.inStock);
        });

        row.appendChild(button);
        row.appendChild(stockToggle);
        if (!item.inStock) {
          var stamp = document.createElement('span');
          stamp.className = 'sold-stamp';
          stamp.textContent = 'sold out';
          row.appendChild(stamp);
        }
        menuBoard.appendChild(row);
      });
    }

    // The menu is a Subject too: selling out an item redraws the board.
    menu.subscribe(renderMenu);

    // ------------------------------------------------------------ discount list
    // Built from the registry, so a newly registered strategy appears here with
    // no change to the HTML (Open/Closed in the UI as well).
    function renderDiscounts() {
      discountChoices.innerHTML = '';
      registry.all().forEach(function (strategy) {
        var id = 'discount-' + strategy.code.toLowerCase();
        var wrapper = document.createElement('label');
        wrapper.className = 'discount-choice';
        wrapper.setAttribute('for', id);

        var input = document.createElement('input');
        input.type = 'radio';
        input.name = 'discount';
        input.id = id;
        input.value = strategy.code;
        input.checked = strategy.code === cart.discountCode;
        input.addEventListener('change', function () {
          cart.setDiscount(strategy.code);
        });

        var text = document.createElement('span');
        text.textContent = strategy.label;

        wrapper.appendChild(input);
        wrapper.appendChild(text);
        discountChoices.appendChild(wrapper);
      });
    }

    // ------------------------------------------------- observer 1: the cart lines
    function renderLines(state) {
      ticketLines.innerHTML = '';

      if (!state.lines.length) {
        var empty = document.createElement('li');
        empty.className = 'ticket-empty';
        empty.textContent = 'Nothing on the ticket yet. Pick something from the board.';
        ticketLines.appendChild(empty);
        countBadge.textContent = '0 items';
        return;
      }

      state.lines.forEach(function (line) {
        var row = document.createElement('li');
        row.className = 'ticket-line';
        row.dataset.itemId = line.item.id;

        var name = document.createElement('span');
        name.className = 'ticket-name';
        name.textContent = line.item.name;

        var quantity = document.createElement('input');
        quantity.type = 'number';
        quantity.className = 'ticket-quantity';
        quantity.value = line.quantity;
        quantity.min = '0';
        quantity.max = '20';
        quantity.step = '1';
        quantity.setAttribute('aria-label', 'Quantity of ' + line.item.name);
        quantity.addEventListener('change', function (event) {
          cart.setQuantity(line.item.id, Number(event.target.value));
        });

        var lineTotal = document.createElement('span');
        lineTotal.className = 'ticket-line-total';
        lineTotal.textContent = money(line.item.price * line.quantity);

        var remove = document.createElement('button');
        remove.type = 'button';
        remove.className = 'ticket-remove';
        remove.textContent = 'Remove';
        remove.setAttribute('aria-label', 'Remove ' + line.item.name);
        remove.addEventListener('click', function () {
          cart.remove(line.item.id);
        });

        row.appendChild(name);
        row.appendChild(quantity);
        row.appendChild(lineTotal);
        row.appendChild(remove);
        ticketLines.appendChild(row);
      });

      countBadge.textContent = cart.itemCount + (cart.itemCount === 1 ? ' item' : ' items');
    }

    // ---------------------------------------------------- observer 2: the total
    function renderTotals(state) {
      var totals = prices.calculate(state.lines, state.discountCode);
      totalsBox.innerHTML =
        '<div class="total-row"><span>Subtotal</span><span>' + money(totals.subtotal) + '</span></div>' +
        '<div class="total-row total-row--discount"><span>' + totals.discountLabel + '</span>' +
          '<span>' + (totals.discount > 0 ? '\u2212' + money(totals.discount) : money(0)) + '</span></div>' +
        '<div class="total-row total-row--grand"><span>Total</span><span>' + money(totals.total) + '</span></div>' +
        '<p class="discount-note">' + totals.discountNote + '</p>';
      placeButton.disabled = false;
    }

    // -------------------------------------------------- observer 3: the summary
    function renderSummary(state) {
      var totals = prices.calculate(state.lines, state.discountCode);
      if (!state.lines.length) {
        summaryBox.textContent = 'The summary fills in as you order.';
        return;
      }
      var text = state.lines.map(function (line) {
        return line.quantity + ' \u00d7 ' + line.item.name;
      }).join(', ');
      summaryBox.textContent = text + ' \u2014 ' + money(totals.total) + ' with ' +
        totals.discountLabel.toLowerCase() + '.';
    }

    // ------------------------------------------- observer 4: proof it all fires
    function logChange(state) {
      var entry = document.createElement('li');
      var time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      entry.textContent = time + ' cart changed (' + state.reason + ') \u2192 ' +
        cart.observerCount + ' observers notified';
      eventLog.prepend(entry);
      while (eventLog.children.length > 5) {
        eventLog.removeChild(eventLog.lastChild);
      }
    }

    // ------------------------------------------------------------- place order
    function showError(error) {
      messageBox.className = 'message message--error';
      messageBox.innerHTML =
        '<span class="message-code">' + error.code + '</span>' +
        '<span class="message-text">' + error.message + '</span>';

      document.querySelectorAll('.ticket-line').forEach(function (row) {
        row.classList.toggle('is-flagged', Boolean(error.itemId) && row.dataset.itemId === error.itemId);
      });
    }

    function showSuccess(order) {
      messageBox.className = 'message message--success';
      var lines = order.lines.map(function (line) {
        return '<div class="receipt-line"><span>' + line.quantity + ' \u00d7 ' + line.item.name +
          '</span><span>' + money(line.lineTotal) + '</span></div>';
      }).join('');

      messageBox.innerHTML =
        '<p class="receipt-title">Order ' + order.id + ' is in. Collect at the counter.</p>' +
        '<div class="receipt">' + lines +
          '<div class="receipt-line receipt-line--rule"><span>Subtotal</span><span>' + money(order.subtotal) + '</span></div>' +
          '<div class="receipt-line"><span>' + order.discountLabel + '</span><span>\u2212' + money(order.discount) + '</span></div>' +
          '<div class="receipt-line receipt-line--total"><span>Paid</span><span>' + money(order.total) + '</span></div>' +
        '</div>';
    }

    placeButton.addEventListener('click', function () {
      var result = orders.placeOrder(cart);
      if (result.ok) {
        showSuccess(result.order);
        cart.clear();
        renderDiscounts();
      } else {
        showError(result.error);
      }
    });

    el('clear-cart').addEventListener('click', function () {
      cart.clear();
      renderDiscounts();
      messageBox.className = 'message';
      messageBox.textContent = 'Ticket cleared.';
    });

    // ------------------------------------------------------------ wire it up
    cart.subscribe(renderLines);
    cart.subscribe(renderTotals);
    cart.subscribe(renderSummary);
    cart.subscribe(logChange);

    renderMenu();
    renderDiscounts();
    // First paint: ask the cart to announce its (empty) state.
    cart.notify({ reason: 'start', subject: null, lines: cart.lines, discountCode: cart.discountCode });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startApp);
  } else {
    startApp();
  }
})(typeof window !== 'undefined' ? window : globalThis);
```

---

### `tests.html`

**The test runner page**

Loads the five logic files and then the test file, and styles the PASS/FAIL list. Nothing to install, and it works on GitHub Pages.

*What a reviewer should look at:* it deliberately does not load `ui.js` — the tests run without any of the app's DOM code.

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>Campus Café — unit tests</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Archivo:wght@400;600;700&family=Courier+Prime:wght@400;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="styles.css">
<style>
  .runner { max-width: 760px; margin: 0 auto; padding: 2rem 1.25rem 3rem; }
  .score {
    font-family: 'Courier Prime', monospace;
    font-size: 1.5rem;
    font-weight: 700;
    padding: 0.6rem 0.9rem;
    display: inline-block;
  }
  .score--good { background: var(--mint); color: var(--teal); }
  .score--bad  { background: rgba(184, 50, 31, 0.12); color: var(--poppy); }
  #test-results { list-style: none; margin: 1.5rem 0 0; padding: 0; }
  #test-results li { padding: 0.5rem 0; border-bottom: 1px dotted var(--rule); font-size: 0.95rem; }
  .mark { font-family: 'Courier Prime', monospace; font-weight: 700; font-size: 0.78rem; }
  .pass .mark { color: var(--teal); }
  .fail { background: rgba(184, 50, 31, 0.08); }
  .fail .mark { color: var(--poppy); }
  .why { font-family: 'Courier Prime', monospace; font-size: 0.8rem; color: var(--poppy); padding-top: 0.25rem; }
</style>
</head>
<body>

<header class="counter">
  <div class="counter-inner">
    <h1>Unit tests</h1>
    <p class="counter-note">Totals, the three discount strategies, the observer wiring and every branch of the placeOrder contract. <a href="index.html" style="color:#fff">Back to the café</a>.</p>
  </div>
</header>

<main class="runner">
  <p id="scoreboard" class="score">running…</p>
  <ul id="test-results"></ul>
</main>

<script src="js/observable.js"></script>
<script src="js/menu.js"></script>
<script src="js/discounts.js"></script>
<script src="js/cart.js"></script>
<script src="js/order-service.js"></script>
<script src="tests/tests.js"></script>
</body>
</html>
```

---

### `tests/tests.js`

**16 unit tests and a 40-line test runner**

Covers totals, all four discount strategies, the observer wiring, and every branch of the placeOrder contract. The runner is `test()`, `assert()`, `assertEqual()` and `assertClose()` — about forty lines, no framework.

*What a reviewer should look at:* the fixtures at the top use round prices so the expected numbers are obvious by hand.

```javascript
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
```

---

## 7. What each test proves

| # | Test | Why it matters |
|---|---|---|
| 1 | Subtotal adds up every line | the basic arithmetic |
| 2 | An empty cart costs nothing | no crash, no NaN |
| 3 | Student discount takes 10% off | Strategy #1 |
| 4 | Staff discount takes 15% off | Strategy #2 |
| 5 | Happy hour makes the cheaper of two drinks free | Strategy #3, the tricky one |
| 6 | Happy hour needs a second drink | the rule's boundary |
| 7 | Happy hour never discounts food | the rule's scope |
| 8 | Two of the same drink still count as two drinks | quantity, not line count |
| 9 | An unknown discount code falls back to full price | the app never crashes on bad input |
| 10 | A new discount rule needs no change to old code | the Open/Closed claim, proven |
| 11 | The cart notifies its observers when a line is added | the Observer claim, proven |
| 12 | An observer can unsubscribe | the subscription actually manages state |
| 13 | placeOrder refuses an empty cart | `EMPTY_CART` |
| 14 | placeOrder refuses a quantity outside 1 to 10 | `INVALID_QUANTITY`, tested at 11 and at 0 |
| 15 | placeOrder refuses an item that sold out after it was added | `OUT_OF_STOCK`, the realistic race |
| 16 | A good order comes back with a number, a total and an untouched cart | the success path and the no-mutation guarantee |

The brief asks for three. There are sixteen, and the ones that carry weight in the
presentation are 10, 11 and 15 — each one is a design claim with a test behind it.

---

## 8. What is NOT done yet

This is the honest part of the handover. The code runs and the tests pass, but four
things are still the team's work and three of them carry marks.

1. **Every member needs their own commits.** 10 points depend on the commit history
   showing all of you. Split the thirteen files between you and each person creates their
   own on GitHub (Add file → Create new file → type `js/cart.js` as the name → paste →
   Commit). One person uploading everything loses those points for the whole team.
2. **Make the menu yours.** Rewrite the nine items in `js/menu.js`. Keep the shape
   (`id`, `name`, `price`, `category`, `inStock`) and keep at least two items out of stock.
3. **Add one discount rule of your own.** Copy the `StudentDiscount` class, rename it,
   change the percentage, add it to `createDefaultRegistry()`. Then copy one discount test
   and point it at the new rule. This is the single most valuable thirty minutes of work
   left: it is the Open/Closed demonstration, and you will be able to say in the
   presentation that you added a rule without editing a line of the existing ones.
4. **Fill in the placeholders.** Both links at the top of `README.md`, the names in its
   "Who did what" table, the four GitHub permalinks in `SUBMISSION.md`, and the names and
   live link on the deck's cover slide.

---

## 9. Review checklist

For whoever is checking this before submission. Ten minutes, in this order.

- [ ] Open the live link. Add two items, change a quantity, pick each discount in turn and
      watch the total change without a page reload.
- [ ] Place a valid order. You should get an order number like `CAFE-0431` and a receipt.
- [ ] Trigger all three errors: clear the ticket and order (`EMPTY_CART`); type 11 in a
      quantity box (`INVALID_QUANTITY`); press *Sell out* on an item already on the ticket,
      then order (`OUT_OF_STOCK`).
- [ ] Open the live link on a phone. The layout stacks; everything still works.
- [ ] Open `/tests.html`. It must say 16 of 16.
- [ ] Open `js/discounts.js` and `js/cart.js` on GitHub and satisfy yourself you could
      answer "where is the Strategy pattern?" without notes.
- [ ] Repo → Commits. Every team member's name appears.
- [ ] README has both links filled in and real names in the table.
- [ ] Every submission link opens in a private browser window without asking for a sign-in.

If all nine pass, the project is ready to submit.
