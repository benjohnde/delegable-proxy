/**
 * Small helper function to decouple from the derived object.
 */
function relax(ref, obj, index) {
  const delegate = function(action, sender) {
    ref.notifyDelegate(action, sender)
  }
  return new DelegableProxy(obj, delegate, index)
}

/**
 * DelegableProxy, multi-level deepened proxy.
 * If any of the underlying object is modified, the primary delegate is invoked.
 */
export class DelegableProxy {
  /**
   * Callback which is invoked for each add/mode/del.
   *
   * @callback proxyCallback
   * @param {string} action may be {del} or {modify} where as {modify} means edit or add.
   * @param {number} sender resultant, this is currently the index of the root object, which was altered.
   */

  /**
   * @param {object} object An object to proxy add/mod/del via callback method.
   * @param {proxyCallback} delegate Callback which is invoked for some actions.
   */
  static wire(object, delegate) {
    if (object == null) {
      throw new Error('Why would one use Proxy without a proper object to follow?')
    }
    if (typeof delegate !== 'function') {
      throw new Error('Why would one use Proxy without a proper delegate function?')
    }
    // do not play with references, create a clean clone of the whole data structure
    const obj = JSON.parse(JSON.stringify(object))
    return new DelegableProxy(obj, delegate)
  }

  /*private*/ constructor(object, delegate, index) {
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
          target[property] = relax(self, value)
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

  formatProperty(property) {
    if (!this.isInt(property)) {
      return -1
    }
    return parseInt(property)
  }

  isInt(string) {
    return !isNaN(parseInt(string))
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
      if (this.isInt(k)) {
        const i = keys.indexOf(k)
        object[k] = relax(self, o, i)
        return
      }
      object[k] = relax(self, o)
    })
  }

  notifyDelegate(action, sender) {
    if (this.index < 0) {
      return this.delegate(action, sender)
    }
    return this.delegate(action, this.index)
  }
}
