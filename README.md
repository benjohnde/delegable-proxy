# delegable-proxy

Multi-level deepened proxy.

## Main purpose

For convenience sake we want to work with common lists and objects but track every change to commit them to the underlying storage (in our case a CouchDB). `Object.observe()` and `Array.observe()` are pretty much the exact thing we want, but they are async and work via polling. Thus this tiny library is originated.

## Important to note

- Not very powerful yet.
- No clue about performance yet.
- Not released to NPM yet (may be in the near future).

## Usage

Build the library

```bash
yarn build
```

Run the tests

```bash
yarn test
```
