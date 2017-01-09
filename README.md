# delegable-proxy

Multi-level deepened proxy, works sync.

[![Build Status](https://travis-ci.org/benjohnde/delegable-proxy.svg?branch=master)](https://travis-ci.org/benjohnde/delegable-proxy)

## Main purpose

For convenience sake we want to work with common lists and objects but keep track of every change to commit them to the underlying storage.
`Object.observe()` and `Array.observe()` are pretty much the exact thing we want, but both work async via polling.

The proxy returns the type of mutation (add, del, mod) and which position (root object) is affected.

## Example

```javascript
import DelegableProxy from 'delegable-proxy'

const example = [{'message': 'hello world'}]
const data = DelegableProxy.wire(example, (action, pos) => {
  console.log(action, pos)
})
data.push({'message': 'hi there!'})
data.push({'message': 'knock knock!'})
```

## RunKit

https://runkit.com/586ca4b68acd620014d54362/586ca4b68acd620014d54363

## Known issues

- The way `Array.splice` works, leads to a lot of mutations on inner arrays. Better use the slow `delete foo[42].bar.stuff[0]`.

## Usage

```bash
# add the library
yarn add delegable-proxy

# build the library
yarn build

# run the tests
yarn test
```
