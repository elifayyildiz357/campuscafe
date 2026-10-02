# Submission sheet

One member fills the form at the bottom of the assignment tab, **before Saturday
11:59 PM Eastern**. Submitting is final for the whole team, so read this page out loud
in the group chat before anyone presses the button.

Agree in the chat who submits. Nobody else touches the form.

---

## The four fields

**1. Repository link**

```
https://github.com/USERNAME/campus-cafe-order
```

Open your repo on GitHub and copy the address bar.

**2. Live page link**

```
https://USERNAME.github.io/campus-cafe-order/
```

From Settings → Pages, after it says *Your site is live at…*.

**3. Slides**

Google Slides or PowerPoint Online → **Share → Anyone with the link (Viewer)** → copy.
A PDF export works too if the form accepts a file.

**4. Where the Strategy and Observer patterns are**

Open each file on GitHub, click the line number so the line highlights, copy the
address bar. Four links, each with one sentence. Paste this and swap in your URLs:

> **Strategy — the shared interface:** `LINK to js/discounts.js line 27`
> `DiscountStrategy` defines `calculate(lines, subtotal)`; every discount rule
> implements it, and nothing outside the file knows how a discount is worked out.
>
> **Strategy — the concrete rules:** `LINK to js/discounts.js lines 34–100`
> `NoDiscount`, `PercentageDiscount` (reused by `StudentDiscount` and `StaffDiscount`)
> and `HappyHourDiscount`. `DiscountRegistry` returns the right one by code, so adding a
> rule means adding a class, not editing one.
>
> **Observer — the subject:** `LINK to js/cart.js line 23`
> `Cart extends Subject` and calls `_changed()` after every mutation. It holds a list of
> listeners and knows nothing about them.
>
> **Observer — the views listening:** `LINK to js/ui.js lines 261–264`
> Four views subscribe: the line list, the total, the summary sentence and an event log.
> The total is never recalculated by a click handler; it redraws because the cart
> announced a change.

Line numbers move if you edit those files, so collect the links **after** your last
commit, not before.

---

## Before you press submit

- [ ] Open every link in a private/incognito window. If any asks you to sign in, the
      sharing setting is wrong and the instructor sees nothing.
- [ ] Live link opens on a phone and the order flow works there.
- [ ] `YOUR-LIVE-LINK/tests.html` shows every test passing.
- [ ] README has both links, the real names, and who did what.
- [ ] Every member's name appears in the commit history (repo → Commits).
- [ ] Each of the three errors can be triggered on the live page, not just locally.

---

## Grading, and where each point comes from

| Points | What it covers | Where it is |
|---|---|---|
| 35 | Working app: menu, cart, discounts, place order with errors | the live page |
| 20 | Strategy, Observer, two SOLID principles | `js/discounts.js`, `js/cart.js`, `js/ui.js`, README |
| 15 | `placeOrder` contract and error handling in the page | header comment of `js/order-service.js`, README table |
| 15 | 3+ passing unit tests | `tests.html`, 16 tests |
| 10 | README and commits from every member | README, repo history |
| 5 | Presentation and live demo | slides + the rehearsed demo |

The 10-point row is the only one that cannot be fixed after Saturday. Make sure every
member commits something with their own account today or tomorrow morning.
