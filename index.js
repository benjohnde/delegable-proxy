'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * Small helper function to decouple from the derived object.
 */
function relax(ref, obj, index) {
  var delegate = function delegate(action, position) {
    ref.notifyDelegate(action, position);
  };
  return new DelegableProxy(obj, delegate, index);
}

/**
 * DelegableProxy, multi-level deepened proxy.
 * If any of the underlying object is modified, the primary delegate is invoked.
 */

var DelegableProxy = exports.DelegableProxy = function () {
  _createClass(DelegableProxy, null, [{
    key: 'wire',

    /**
     * Callback which is invoked for each add/mode/del.
     *
     * @callback proxyCallback
     * @param {string} action may be one of {add, del, mod}.
     * @param {number} position resultant, this is currently the index of the root object, which was altered.
     * @param {boolean} shouldClone signals whether the incoming object should be cloned before wiring.
     */

    /**
     * @param {object} object An object to proxy add/mod/del via callback method.
     * @param {proxyCallback} delegate Callback which is invoked for some actions.
     */
    value: function wire(object, delegate, shouldClone) {
      if (shouldClone) {
        // do not play with references, create a clean clone of the whole data structure
        var cloned = JSON.parse(JSON.stringify(object));
        return new DelegableProxy(cloned, delegate);
      }
      return new DelegableProxy(object, delegate);
    }
  }]);

  function DelegableProxy(object, delegate, index) {
    _classCallCheck(this, DelegableProxy);

    if (object === null) {
      throw new Error('Why would one use Proxy without a proper object to follow?');
    }
    if (typeof delegate !== 'function') {
      throw new Error('Why would one use Proxy without a proper delegate function?');
    }
    this.index = index !== undefined ? index : -1;
    this.delegate = delegate;
    this.handler = this.createHandler();
    this.wired = new WeakSet();
    this.ensureRecursiveWiring(object);
    return new Proxy(object, this.handler);
  }

  _createClass(DelegableProxy, [{
    key: 'createHandler',
    value: function createHandler() {
      var self = this;
      // return true to accept the changes
      return {
        deleteProperty: function deleteProperty(target, property) {
          self.notifyDelegate('del', self.formatProperty(property));
          return true;
        },
        set: function set(target, property, value, receiver) {
          var hasOldValue = target[property] !== undefined;
          // if key does not exist but value is an object, wrap it!
          if ((typeof value === 'undefined' ? 'undefined' : _typeof(value)) === 'object') {
            target[property] = relax(self, value);
          } else {
            target[property] = value;
          }
          // array pushes always triggers this method twice
          if (property !== 'length') {
            var action = hasOldValue ? 'mod' : 'add';
            self.notifyDelegate(action, self.formatProperty(property));
          }
          return true;
        }
      };
    }
  }, {
    key: 'ensureRecursiveWiring',
    value: function ensureRecursiveWiring(object) {
      var _this = this;

      if (this.wired.has(object)) {
        console.log(object, 'is already wired, no further traverse');
        return;
      }
      this.wired.add(object);

      // end condition
      if ((typeof object === 'undefined' ? 'undefined' : _typeof(object)) !== 'object') {
        return;
      }

      // go deeper
      var self = this;
      var keys = Object.keys(object);
      keys.forEach(function (k) {
        var o = object[k];
        // not eligible for Proxy
        if ((typeof o === 'undefined' ? 'undefined' : _typeof(o)) !== 'object') {
          return;
        }
        // if key is numeric, pass the current index for locating the root object later on
        if (_this.isInt(k)) {
          var i = keys.indexOf(k);
          object[k] = relax(self, o, i);
          return;
        }
        object[k] = relax(self, o);
      });
    }
  }, {
    key: 'formatProperty',
    value: function formatProperty(property) {
      if (!this.isInt(property)) {
        return -1;
      }
      return parseInt(property);
    }
  }, {
    key: 'isInt',
    value: function isInt(string) {
      return !isNaN(parseInt(string));
    }

    /**
     * @see {proxyCallback} Callback which is invoked for some actions.
     */

  }, {
    key: 'notifyDelegate',
    value: function notifyDelegate(action, position) {
      if (this.index < 0) {
        return this.delegate(action, position);
      }
      return this.delegate(action, this.index);
    }
  }]);

  return DelegableProxy;
}();
