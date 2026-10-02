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
