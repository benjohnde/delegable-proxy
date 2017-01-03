import { isInt } from "./Helper"

/**
 * DelegableProxy, multi-level deepened proxy.
 * If any of the underlying object is modified, the primary delegate is invoked.
 */
export default class DelegableProxy {
  /**
   * @param {object} object An object to proxy add/mod/del via callback method.
   * @param {proxyCallback} delegate Callback which is invoked for some actions.
   * @param {boolean} shouldClone create a clean clone of the whole data structure
   */
  static wire(object, delegate, shouldClone) {
    if (shouldClone) {
      const cloned = JSON.parse(JSON.stringify(object))
      return new DelegableProxy(cloned, delegate, true)
    }
    return new DelegableProxy(object, delegate, true)
  }

  /**
   * Small helper function to decouple from the derived object.
   * @param {object} ref mother object to invoke {proxyCallback}
   * @param {object} obj to wire
   * @param {integer} index [-1]
   * @param {boolean} isRootObject whether the sender is the root object or not
   */
  static relax(ref, obj, index) {
    const delegate = function(action, position, isRootObject) {
      ref.notifyDelegate(action, position, isRootObject)
    }
    return new DelegableProxy(obj, delegate, false, index)
  }

  constructor(object, delegate, isRootObject, index) {
    if (object === null) {
      throw new Error("Why would one use Proxy without a proper object to follow?")
    }
    if (typeof delegate !== "function") {
      throw new Error("Why would one use Proxy without a proper delegate function?")
    }
    this.isRootObject = isRootObject || false
    this.index = (index !== undefined) ? index : -1
    this.delegate = delegate
    this.handler = this.createHandler()
    this.wired = new WeakSet()
    this.ensureRecursiveWiring(object)
    return new Proxy(object, this.handler)
  }

  createHandler() {
    const self = this
    // return true to accept the changes
    return {
      deleteProperty: function(target, property) {
        self.notifyDelegate("del", self.formatProperty(property), true)
        return true
      },
      set: function(target, property, value, receiver) {
        const hasOldValue = target[property] !== undefined
        // if key does not exist but value is an object, wrap it!
        if (typeof value === "object") {
          target[property] = DelegableProxy.relax(self, value)
        } else {
          target[property] = value
        }
        // Array pushes always triggers this method twice
        if (property === "length") {
          return true
        }
        // Object changes (for instance added new method) should not be delegated
        if (property === "__proto__") {
          return true
        }
        // Ensure skipping delegation for Vue.js observables
        if (target.hasOwnProperty("__ob__")) {
          return true
        }
        if (value.hasOwnProperty("__ob__")) {
          return true
        }
        // notify delegate
        const action = hasOldValue ? "mod" : "add"
        self.notifyDelegate(action, self.formatProperty(property), self.isRootObject)
        return true
      }
    }
  }

  ensureRecursiveWiring(object) {
    if (this.wired.has(object)) {
      console.log(object, "is already wired, no further traverse")
      return
    }
    this.wired.add(object)
    // end condition
    const isObject = typeof object !== "object"
    const isVueObservable = object.hasOwnProperty("__ob__")
    if (isObject || isVueObservable) {
      return
    }
    // go deeper
    const self = this
    const keys = Object.keys(object)
    keys.forEach(k => {
      const o = object[k]
      // not eligible for Proxy
      if (typeof o !== "object") {
        return
      }
      // if key is numeric, pass the current index for locating the root object later on
      if (isInt(k)) {
        const i = keys.indexOf(k)
        object[k] = DelegableProxy.relax(self, o, i)
        return
      }
      object[k] = DelegableProxy.relax(self, o)
    })
  }

  /**
   * As we only want to track indices of an array and not keys, short check.
   * @param {object} property
   * @returns -1 or index
   */
  formatProperty(property) {
    if (!isInt(property)) {
      return -1
    }
    return parseInt(property)
  }

  /**
   * Callback which is invoked for each add/mode/del.
   *
   * @callback proxyCallback
   * @param {string} action may be one of {add, del, mod}.
   * @param {number} position resultant, this is currently the index of the root object, which was altered.
   * @param {boolean} isRootObject whether the sender is the root object or not
   */
  notifyDelegate(action, position, isRootObject) {
    if (!isRootObject) {
      action = 'mod'
    }
    if (this.index < 0) {
      return this.delegate(action, position, isRootObject)
    }
    return this.delegate(action, this.index, isRootObject)
  }
}
