# Campus Café — order page

A one-page ordering app for the campus café. Browse the board, build a ticket, pick a
discount, place the order. Everything runs in the browser: plain HTML, CSS and
JavaScript, no framework, no build step, no install.

**Live page:** https://YOUR-USERNAME.github.io/YOUR-REPO/
**Tests:** https://YOUR-USERNAME.github.io/YOUR-REPO/tests.html

> Replace both links after you turn on GitHub Pages.

---

## How to run the app

Either open the live link above, or clone the repository and open `index.html` by
double-clicking it. There is nothing to install and no server to start.

## How to run the tests

Open `tests.html` the same way (double-click it, or add `/tests.html` to the live
link). The page runs all 16 tests on load and prints `16 of 16 tests passing` at the
top, with one line per test. Failures turn red and say what was expected. The same
summary is written to the browser console.

---

## What the page does

- **Menu** — 9 items, each with a name, price, category and stock flag.
- **Cart** — add, remove, change quantity. The total recalculates on its own.
- **Discounts** — None, Student (10% off), Staff (15% off), Happy hour (second drink free).
- **Place order** — a clear error if the cart is empty, a quantity is outside 1–10,
  or an item is out of stock. Otherwise an order number and a receipt.
- **Sell out** — each menu row has a small *Sell out* / *Restock* button. It
  simulates the counter running out of something while a customer is deciding, which
  is how you trigger `OUT_OF_STOCK` in the demo.

Happy hour in detail: when the ticket has two or more drinks, the cheapest drink is
free, once per order. Food is never part of this rule.

---

## Where the design patterns are

| Pattern | File | What to look at |
|---|---|---|
| **Strategy** | `js/discounts.js` | `DiscountStrategy` (line 27) is the shared interface. `NoDiscount` (34), `PercentageDiscount` (43) with `StudentDiscount` (62) and `StaffDiscount` (66), and `HappyHourDiscount` (75) each implement `calculate(lines, subtotal)`. `DiscountRegistry` (102) hands the right one to the price calculator. |
| **Observer** | `js/observable.js` + `js/cart.js` + `js/ui.js` | `Subject` (observable.js line 16) holds the subscriber list. `Cart extends Subject` (cart.js line 23) and calls `_changed()` after every mutation. Four views subscribe in `ui.js` lines 261–264: the line list, the total, the summary sentence and the event log. `MenuRepository` (menu.js line 30) is a second subject, so selling an item out redraws the board. |

Nothing in `cart.js` knows that `ui.js` exists. Open the *What the cart just told its
observers* panel on the page to watch the notifications arrive.

Direct links to those lines on GitHub (fill in after the final commit — open the file,
click the line number, copy the address bar):

- Strategy, the interface: `PASTE LINK`
- Strategy, the four rules: `PASTE LINK`
- Observer, the subject: `PASTE LINK`
- Observer, the four views subscribing: `PASTE LINK`

### SOLID principles we can point at

1. **Single Responsibility** — `Cart` stores lines and announces changes, `PriceCalculator`
   does arithmetic, `OrderService` validates, `MenuRepository` owns stock, `ui.js` owns the
   DOM. Each file has one reason to change, which is why the tests can run with no DOM at all.
2. **Open/Closed** — adding a discount means writing a new class and calling
   `registry.register(...)`. No existing class is edited, and the new button appears on the
   page by itself because the UI builds the list from `registry.all()`. The test
   *"A new discount rule needs no change to old code"* proves it by registering an Alumni
   rule at runtime.
3. **Dependency Inversion** (bonus) — `OrderService` is handed a menu repository, a price
   calculator and an order-number generator through its constructor, so the tests pass in a
   fixed number generator and get predictable order ids.

---

## The `placeOrder(cart)` contract

Full version in the header comment of `js/order-service.js`.

**Takes:** a `cart` exposing `.lines` (`[{ item, quantity }]`) and `.discountCode`.

**Returns on success:**

```js
{ ok: true, order: { id: 'CAFE-0431', placedAt, lines, subtotal, discount, total,
                     discountCode, discountLabel } }
```

**Returns on failure** (it never throws for an expected problem):

```js
{ ok: false, error: { code, message, itemId? } }
```

| Code | When | What the page does |
|---|---|---|
| `EMPTY_CART` | no lines on the ticket | red message under the button: add something first |
| `INVALID_QUANTITY` | a quantity is not a whole number from 1 to 10 | red message naming the item and the number you asked for; that ticket line is highlighted |
| `OUT_OF_STOCK` | the item is no longer available at the counter | red message naming the item; that ticket line is highlighted |

Checks run in that order and the first failure is returned. The cart is never modified
by `placeOrder`, on success or on failure — the page clears it afterwards, which keeps
the decision in the UI where it belongs.

---

## Tests

16 unit tests in `tests/tests.js`, run by `tests.html`:

- totals: mixed lines, empty cart
- discounts: student 10%, staff 15%, happy hour (two drinks, one drink, food only, same
  drink twice), unknown code falls back to full price, a runtime-registered new rule
- observer: all subscribers are notified, and unsubscribe stops the notifications
- `placeOrder`: `EMPTY_CART`, `INVALID_QUANTITY` (11 and 0), `OUT_OF_STOCK` after a
  sell-out, and a successful order with the right id, totals and an untouched cart

---

## Project structure

```
index.html          the ordering page
styles.css          all styling
tests.html          test runner (open it in a browser)
js/observable.js    Subject base class — the Observer pattern
js/menu.js          menu data + MenuRepository (also a Subject)
js/discounts.js     the Strategy pattern + DiscountRegistry
js/cart.js          Cart (a Subject) + PriceCalculator
js/order-service.js the placeOrder contract, error codes, OrderService
js/ui.js            every DOM read and write, and nothing else
tests/tests.js      16 unit tests + a 40-line test runner
```

---

## Who did what

| Member | Work |
|---|---|
| Dharuvı Jaın | menu + cart logic, `js/menu.js`, `js/cart.js` |
| Tsogzolmaa Bayansan |  discount strategies and the registry, `js/discounts.js` |
| Elif Ayyildiz |  `placeOrder` contract and error handling, `js/order-service.js` |
| Gokhan Karaca |  page, styling and the unit tests, `index.html`, `styles.css`, `tests/tests.js` |
