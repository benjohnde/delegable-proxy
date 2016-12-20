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
  var delegate = function delegate(action, sender) {
    ref.notifyDelegate(action, sender);
  };
  return new DelegableProxy(obj, delegate, index);
}

/**
 * DelegableProxy, multi-level deepened proxy.
 * If any of the underlying object is modified, the primary delegate is invoked.
 */

var DelegableProxy = exports.DelegableProxy = function () {
  function DelegableProxy(object, delegate, index) {
    _classCallCheck(this, DelegableProxy);

    if (object == null) {
      throw new Error('Why would one use Proxy without a proper object to follow?');
    }
    if (typeof delegate !== 'function') {
      throw new Error('Why would one use Proxy without a proper delegate function?');
    }
    var cloned = this.clone(object);
    this.index = index !== undefined ? index : -1;
    this.delegate = delegate;
    this.handler = this.createHandler();
    this.wired = new WeakSet();
    this.ensureRecursiveWiring(cloned);
    return new Proxy(cloned, this.handler);
  }

  // do not play with references, create a clean clone of the whole data structure


  _createClass(DelegableProxy, [{
    key: 'clone',
    value: function clone(obj) {
      return JSON.parse(JSON.stringify(obj));
    }
  }, {
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

    /**
     * @param {string} action may be {del} or {modify} where as {modify} means edit or add.
     * @param {number} sender resultant, this is currently the index of the root object, which was altered.
     *
     * TODO May replace this with proper JS Enum (after approval) or just use enumify.
     */

  }, {
    key: 'notifyDelegate',
    value: function notifyDelegate(action, sender) {
      if (this.index < 0) {
        return this.delegate(action, sender);
      }
      return this.delegate(action, this.index);
    }
  }]);

  return DelegableProxy;
}();
