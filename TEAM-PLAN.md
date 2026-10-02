# Team plan — read this first

The app is written and the tests pass. What is left is: put it on GitHub as a team,
make it yours, and present it. Nobody should spend Saturday debugging.

---

## 1. Split the work (30 seconds, do it in the group chat)

Four people, four jobs. Every job ends with **your own commits** — the grading looks at
the commit history, so no one person should upload everything.

| Who | Job | Files they commit |
|---|---|---|
| A — repo owner | Create the repo, upload the base files, turn on Pages, add everyone as collaborators | first upload |
| B — menu & cart | Change the menu to a café you'd actually go to: names, prices, which items are drinks, which are sold out | `js/menu.js` |
| C — discounts & contract | Add one extra discount rule as a new class and register it; check the error messages read well | `js/discounts.js`, `js/order-service.js` |
| D — tests & README | Add 2–3 more tests (one per new rule), fill in the "Who did what" table and the two live links | `tests/tests.js`, `README.md` |

If you are three people, D splits between B and C. If you are two, A takes B and D.

Everyone must also read `README.md` once before class — you will be asked where the
patterns are.

---

## 2. Put it on GitHub (one person, 10 minutes)

**Before anything else:** every member needs a GitHub account (github.com/signup, 3
minutes) and must send their username to the repo owner. Nobody can commit without one.

1. github.com → **New repository** → name it `campus-cafe-order` → **Public** →
   tick *Add a README file* → Create.
2. On the repo page: **Add file → Upload files**.
3. Unzip the project first, then **open the `campus-cafe` folder and drag what is
   inside it** — `index.html`, `styles.css`, `README.md`, `TEAM-PLAN.md`, `tests.html`,
   and the `js` and `tests` folders. Do **not** drag the `campus-cafe` folder itself:
   `index.html` has to sit at the top level of the repo or Pages shows a 404.
   The `js` and `tests` subfolders are fine and must stay — `index.html` loads
   `js/observable.js`, so flattening them breaks the page.
   Uploading `README.md` replaces the one GitHub created. That is what we want.
4. Write a commit message ("First version of the café order page") → **Commit changes**.
5. **Settings → Collaborators → Add people** → add your teammates by their GitHub
   username. Each of them must open the email (or github.com/notifications) and click
   **Accept invitation** — until they do, they cannot commit anything. Chase this today,
   not Saturday night.
6. **Settings → Pages** → Source: *Deploy from a branch* → Branch: `main`, folder: `/ (root)`
   → Save. Wait 1–2 minutes, refresh, and the link appears at the top of that page.
7. Open the link on your phone. The page is responsive; if it looks broken or you get a
   404, check that `index.html` is at the top level and lowercase, and that the `js`
   folder uploaded with its files inside.

### How everyone else commits

No need to install Git. On github.com, open the file you own, click the pencil icon,
make your change, scroll down, write a message, **Commit changes**. That is a real
commit with your name on it.

---

## 3. Make it yours (Saturday morning, ~1 hour total)

This is what turns a delivered app into *your* project, and it is where the easy marks are.

- **B:** rewrite the nine menu items in `js/menu.js`. Keep the shape
  (`id`, `name`, `price`, `category`, `inStock`) and keep at least two items `inStock: false`.
- **C:** copy the `StudentDiscount` class in `js/discounts.js`, rename it (Loyalty card?
  Breakfast before 10?), and add it to the list inside `createDefaultRegistry()`. That is
  the whole change — the page grows a new radio button by itself. Say this sentence out
  loud in the presentation; it *is* the Open/Closed principle.
- **D:** copy one of the discount tests in `tests/tests.js`, point it at the new rule, and
  check the counter still says all tests passing.
- **All:** fill in the "Who did what" table and the two links at the top of the README.

---

## 4. Submission checklist (before 11:59 PM Saturday)

- [ ] Live link opens and works on a phone
- [ ] `tests.html` shows every test passing
- [ ] README has both links filled in and the real names in the table
- [ ] Every member has at least one commit
- [ ] Slides shared as **Anyone with the link (Viewer)**, or exported as PDF
- [ ] Every link opened once in a private/incognito window. If any of them asks for a
      sign-in, the sharing setting is wrong and the instructor will see nothing.
- [ ] Form filled in: repo link, live link, slides, and **where the patterns are**

### Where the patterns are — they want links, not file names

On GitHub, open the file, **click the line number** so it highlights, then copy the
address bar. That URL points straight at the line. Press `y` first if you want a
permalink that survives later commits. Collect four of them:

| Paste into the form as | Open this file | Click this line |
|---|---|---|
| Strategy — the shared interface | `js/discounts.js` | line 27, `class DiscountStrategy` |
| Strategy — the concrete rules | `js/discounts.js` | lines 34–100 (click 34, shift-click 100) |
| Observer — the subject | `js/cart.js` | line 23, `class Cart extends Subject` |
| Observer — the views listening | `js/ui.js` | lines 261–264, the four `cart.subscribe(...)` calls |

Line numbers shift if you edit those files first, so collect the links **after** your
Saturday changes, not before. Add one sentence next to each link: *"one class per
discount rule behind a shared calculate() interface"* and *"the cart notifies four
views that it knows nothing about"*.

---

## 5. The five-minute presentation

Five slides, one speaker each if you are four (one person takes two).

1. **The brief in one line.** A one-page café order app: menu, cart, discounts, place
   order, clear errors. Show the live page on screen.
2. **Live demo — the good path.** Add a flat white and a croissant, set quantity to 2,
   pick Student, place the order, show the order number and receipt. *(Say: the total
   never recalculates itself in the click handler — the cart notifies its observers.)*
3. **Live demo — the three errors.** Clear the ticket and press Place order →
   `EMPTY_CART`. Add an item, type 11 → `INVALID_QUANTITY`, and the line turns red.
   Set it back to 2, press *Sell out* on that item, order again → `OUT_OF_STOCK`.
4. **The patterns, in the code.** Open `js/discounts.js`: one class per rule behind one
   interface, and adding a rule means adding a class, not editing one. Open `js/cart.js`
   and `js/ui.js` lines 261–264: the cart announces, four views listen, the cart knows
   none of them. Then the two SOLID principles from the README.
5. **Contract and tests.** Show the `placeOrder` header comment: what it takes, what it
   returns, the three error codes, the order the checks run in. Then open `tests.html`
   live and let the counter say *16 of 16 passing*.

Timing: 1 minute of talk, 2 minutes of demo, 2 minutes of code. Practise the error demo
once — it is the part that earns the 15 contract points.

### Slide tips

Screenshots, not pasted code walls. One code block per slide, maximum 15 lines, and
zoom the editor so the back row can read it. Have the live page open in a browser tab
*before* you start, so you are not loading GitHub Pages in front of the class.
