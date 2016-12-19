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
  constructor(object, delegate, index) {
    if (object == null) {
      throw new Error('Why would one use Proxy without a proper object to follow?')
    }
    if (typeof delegate !== 'function') {
      throw new Error('Why would one use Proxy without a proper delegate function?')
    }
    this.index = (index !== undefined) ? index : -1
    this.delegate = delegate
    this.handler = this.createHandler()
    this.ensureRecursiveWiring(object)
    return new Proxy(object, this.handler)
  }

  createHandler() {
    const self = this
    // return true to accept the changes
    return {
      deleteProperty: function(target, property) {
        self.notifyDelegate('del', property)
        return true
      },
      set: function(target, property, value, receiver) {
        // if key does not exist but value is an object, wrap it!
        if (typeof value === 'object') {
          target[property] = relax(self, value)
        } else {
          target[property] = value
        }
        // array pushes always triggers this method twice
        if (property !== 'length') {
          self.notifyDelegate('mod', property)
        }
        return true
      }
    }
  }

  ensureRecursiveWiring(object) {
    const self = this
    // TODO could use WeakSet for keeping track of objects, problem here is if one copy a whole "proxied" subtree into another object
    // TODO does this actually work?
    if (object instanceof Proxy) {
      console.log(object, 'is Proxy, no further traverse')
      return
    }
    if (typeof object !== 'object') {
      // no further traversal
      return
    }
    const keys = Object.keys(object)
    keys.forEach((k) => {
      const o = object[k]
      // not eligible for Proxy
      if (typeof o !== 'object') {
        return
      }
      // if key is numeric, pass the current index for locating the root object later on
      if (self.isNumeric(k)) {
        const i = keys.indexOf(k)
        object[k] = relax(self, o, i)
        return
      }
      object[k] = relax(self, o)
    })
  }

  /**
   * @param {string} action may be {del} or {modify} where as {modify} means edit or add.
   * @param {number} sender resultant, this is currently the index of the root object, which was altered.
   *
   * TODO May replace this with proper JS Enum (after approval) or just use enumify.
   */
  notifyDelegate(action, sender) {
    if (this.index < 0) {
      return this.delegate(action, sender)
    }
    return this.delegate(action, this.index)
  }

  // @see http://stackoverflow.com/a/1830844
  isNumeric(n) {
    return !isNaN(parseFloat(n)) && isFinite(n)
  }
}
