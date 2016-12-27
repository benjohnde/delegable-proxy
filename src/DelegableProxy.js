import { isInt } from './Helper'

/**
 * DelegableProxy, multi-level deepened proxy.
 * If any of the underlying object is modified, the primary delegate is invoked.
 */
export default class DelegableProxy {
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
   * @param {boolean} shouldClone create a clean clone of the whole data structure
   */
  static wire(object, delegate, shouldClone) {
    if (shouldClone) {
      const cloned = JSON.parse(JSON.stringify(object))
      return new DelegableProxy(cloned, delegate)
    }
    return new DelegableProxy(object, delegate)
  }

  /**
   * Small helper function to decouple from the derived object.
   * @param {object} ref mother object to invoke {proxyCallback}
   * @param {object} obj to wire
   * @param {integer} index [-1]
   */
  static relax(ref, obj, index) {
    const delegate = function(action, position) {
      ref.notifyDelegate(action, position)
    }
    return new DelegableProxy(obj, delegate, index)
  }

  constructor(object, delegate, index) {
    if (object === null) {
      throw new Error('Why would one use Proxy without a proper object to follow?')
    }
    if (typeof delegate !== 'function') {
      throw new Error('Why would one use Proxy without a proper delegate function?')
    }
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
        self.notifyDelegate('del', self.formatProperty(property))
        return true
      },
      set: function(target, property, value, receiver) {
        const hasOldValue = target[property] !== undefined
        // if key does not exist but value is an object, wrap it!
        if (typeof value === 'object') {
          target[property] = DelegableProxy.relax(self, value)
        } else {
          target[property] = value
        }
        // array pushes always triggers this method twice
        if (property !== 'length') {
          const action = hasOldValue ? 'mod' : 'add'
          self.notifyDelegate(action, self.formatProperty(property))
        }
        return true
      }
    }
  }

  ensureRecursiveWiring(object) {
    if (this.wired.has(object)) {
      console.log(object, 'is already wired, no further traverse')
      return
    }
    this.wired.add(object)

    // end condition
    if (typeof object !== 'object') {
      return
    }

    // go deeper
    const self = this
    const keys = Object.keys(object)
    keys.forEach((k) => {
      const o = object[k]
      // not eligible for Proxy
      if (typeof o !== 'object') {
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
   * @see {proxyCallback} Callback, which is invoked for some actions.
   */
  notifyDelegate(action, position) {
    if (this.index < 0) {
      return this.delegate(action, position)
    }
    return this.delegate(action, this.index)
  }
}
