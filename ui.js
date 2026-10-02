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
