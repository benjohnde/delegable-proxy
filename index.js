"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * Small helper for checking if input is an Integer {number}.
 * @param {object} object to check
 * @see http://stackoverflow.com/a/14794066
 */
function isInt(object) {
  return !isNaN(object) && !isNaN(parseInt(object)) && parseInt(Number(object)) == object;
}

/**
 * DelegableProxy, multi-level deepened proxy.
 * If any of the underlying object is modified, the primary delegate is invoked.
 */

var DelegableProxy = function () {
  _createClass(DelegableProxy, null, [{
    key: "wire",

    /**
     * @param {object} object An object to proxy add/mod/del via callback method.
     * @param {proxyCallback} delegate Callback which is invoked for some actions.
     * @param {boolean} shouldClone create a clean clone of the whole data structure
     */
    value: function wire(object, delegate, shouldClone) {
      if (shouldClone) {
        var cloned = JSON.parse(JSON.stringify(object));
        return new DelegableProxy(cloned, delegate);
      }
      return new DelegableProxy(object, delegate);
    }

    /**
     * Small helper function to decouple from the derived object.
     * @param {object} ref mother object to invoke {proxyCallback}
     * @param {object} obj to wire
     * @param {integer} index [-1]
     */

  }, {
    key: "relax",
    value: function relax(ref, obj, index) {
      var delegate = function delegate(action, position) {
        ref.notifyDelegate(action, position, false);
      };
      return new DelegableProxy(obj, delegate, index);
    }
  }]);

  function DelegableProxy(object, delegate, index) {
    _classCallCheck(this, DelegableProxy);

    if (object === null) {
      throw new Error("Why would one use Proxy without a proper object to follow?");
    }
    if (typeof delegate !== "function") {
      throw new Error("Why would one use Proxy without a proper delegate function?");
    }
    this.index = index !== undefined ? index : -1;
    this.delegate = delegate;
    this.handler = this.createHandler();
    this.wired = new WeakSet();
    this.ensureRecursiveWiring(object);
    return new Proxy(object, this.handler);
  }

  _createClass(DelegableProxy, [{
    key: "createHandler",
    value: function createHandler() {
      var self = this;
      // return true to accept the changes
      return {
        deleteProperty: function deleteProperty(target, property) {
          self.notifyDelegate("del", self.formatProperty(property), true);
          return true;
        },
        set: function set(target, property, value, receiver) {
          var hasOldValue = target[property] !== undefined;
          // if key does not exist but value is an object, wrap it!
          if ((typeof value === "undefined" ? "undefined" : _typeof(value)) === "object") {
            target[property] = DelegableProxy.relax(self, value);
          } else {
            target[property] = value;
          }
          // Array pushes always triggers this method twice
          if (property === "length") {
            return true;
          }
          // Object changes (for instance added new method) should not be delegated
          if (property === "__proto__") {
            return true;
          }
          // Ensure skipping delegation for Vue.js observables
          if (target.hasOwnProperty("__ob__")) {
            return true;
          }
          if (value.hasOwnProperty("__ob__")) {
            return true;
          }
          // notify delegate
          var action = hasOldValue ? "mod" : "add";
          self.notifyDelegate(action, self.formatProperty(property), true);
          return true;
        }
      };
    }
  }, {
    key: "ensureRecursiveWiring",
    value: function ensureRecursiveWiring(object) {
      if (this.wired.has(object)) {
        console.log(object, "is already wired, no further traverse");
        return;
      }
      this.wired.add(object);
      // end condition
      var isObject = (typeof object === "undefined" ? "undefined" : _typeof(object)) !== "object";
      var isVueObservable = object.hasOwnProperty("__ob__");
      if (isObject || isVueObservable) {
        return;
      }
      // go deeper
      var self = this;
      var keys = Object.keys(object);
      keys.forEach(function (k) {
        var o = object[k];
        // not eligible for Proxy
        if ((typeof o === "undefined" ? "undefined" : _typeof(o)) !== "object") {
          return;
        }
        // if key is numeric, pass the current index for locating the root object later on
        if (isInt(k)) {
          var i = keys.indexOf(k);
          object[k] = DelegableProxy.relax(self, o, i);
          return;
        }
        object[k] = DelegableProxy.relax(self, o);
      });
    }

    /**
     * As we only want to track indices of an array and not keys, short check.
     * @param {object} property
     * @returns -1 or index
     */

  }, {
    key: "formatProperty",
    value: function formatProperty(property) {
      if (!isInt(property)) {
        return -1;
      }
      return parseInt(property);
    }

    /**
     * Callback which is invoked for each add/mode/del.
     *
     * @callback proxyCallback
     * @param {string} action may be one of {add, del, mod}.
     * @param {number} position resultant, this is currently the index of the root object, which was altered.
     * @param {boolean} isRootObject whether the sender is the root object or not
     */

  }, {
    key: "notifyDelegate",
    value: function notifyDelegate(action, position, isRootObject) {
      if (!isRootObject) {
        action = 'mod';
      }
      if (this.index < 0) {
        return this.delegate(action, position);
      }
      return this.delegate(action, this.index);
    }
  }]);

  return DelegableProxy;
}();

exports.default = DelegableProxy;
