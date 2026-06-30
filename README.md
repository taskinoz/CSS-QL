<center><img src="assets/logo.webp" alt="CSS-QL" width="250" height="250" /></center>

# CSS-QL

**Cascading Style Sheets Query Language** is the SQL-flavoured CSS compiler nobody asked for, now implemented as a real TypeScript library.

It was inspired by [this tweet from @Jordy_vD_](https://twitter.com/Jordy_vD_/status/1682041493446606849):

```sql
SET color = "red" WHERE CLASSNAME LIKE %danger%
```

Which compiles to:

```css
.danger {
  color: red;
}
```

The project started as a small JavaScript experiment. Version 2 is a full TypeScript rewrite with a proper parser, typed AST, useful errors, nested CSS, at-rules, comments, minification, a CLI and file APIs.

## Demo

There is a browser playground in [`demo/`](demo/) which runs the same compiler as the library.

```sh
npm run demo
```

Open `http://127.0.0.1:4173` to view the demo.

The demo includes live output, a rendered preview, syntax highlighting, examples, error locations, copy and download buttons, and light/dark themes.

To build the static demo for GitHub Pages or another static host:

```sh
npm run build:demo
```

## Getting started

```sh
npm install
npm run build
```

Use it as a library:

```ts
import { compile, parse, transpileFile } from "css-ql";

const css = compile('SET display = "grid" WHERE CLASSNAME LIKE %gallery%;');
const ast = parse('SET color = "hotpink" WHERE ID LIKE %logo%;');

await transpileFile("styles.cql", {
  output: "public/styles.css",
  minify: true
});
```

The original synchronous API is still available:

```js
const { transpile } = require("css-ql");

transpile("styles.cql"); // writes styles.css
```

You can also use the CLI:

```sh
cql styles.cql
cql styles.cql --output public/styles.css --minify
cql styles.cql --stdout
```

## Syntax

### Selectors

Use `SET` for CSS declarations and `WHERE` for the selector. Multiple declarations are separated with commas and selectors can be joined with `OR`.

```sql
SET color = %var(--text)%, padding = "1rem", display = "grid !important"
WHERE CLASSNAME LIKE %card% OR ID LIKE %featured%;
```

| CQL | CSS |
| --- | --- |
| `CLASSNAME LIKE %card%` | `.card` |
| `ID LIKE %app%` | `#app` |
| `TAGNAME LIKE %main%` | `main` |
| `SELECTOR LIKE %.card:hover > img%` | `.card:hover > img` |
| `ROOT LIKE %root%` | `:root` |

Use `SELECTOR` when you need normal CSS selectors such as attributes, pseudo-classes, pseudo-elements, combinators or nesting with `&`.

### Values

Quotes around CQL strings are removed in the generated CSS. Use `%...%` when a value contains spaces, commas or other CSS syntax.

```sql
SET font-family = %"Meme Sans", sans-serif%,
    grid-template-columns = %repeat(3, minmax(0, 1fr))%
WHERE CLASSNAME LIKE %grid%;
```

Simple values such as `red`, `0` and `var(--brand)` do not need quotes. A literal percent sign inside `%...%` can be escaped as `\%`.

### Nested CSS

Rules can contain more rules, which generates native CSS nesting:

```sql
SET color = "navy" WHERE CLASSNAME LIKE %button% {
  SET color = "blue" WHERE SELECTOR LIKE %&:hover%;

  AT MEDIA %(prefers-reduced-motion: no-preference)% {
    SET transition = "color 150ms";
  }
}
```

### At-rules

`AT <name> <value>` can be used for any CSS at-rule.

```sql
AT IMPORT %url("theme.css") layer(theme)%;

AT MEDIA %(width >= 48rem)% {
  SET display = "grid" WHERE CLASSNAME LIKE %layout%;
}

AT FONT-FACE {
  SET font-family = %"Meme Sans"%,
      src = %url("meme.woff2") format("woff2")%;
}

AT KEYFRAMES %spin% {
  SET transform = "rotate(0deg)" WHERE SELECTOR LIKE %from%;
  SET transform = "rotate(360deg)" WHERE SELECTOR LIKE %to%;
}
```

Inside declaration-based at-rules such as `@font-face`, `@page` and `@property`, a `SET` does not need a `WHERE`. See [`examples/complete.cql`](examples/complete.cql) for a larger example.

### Comments

SQL-style line comments and CSS block comments both work:

```sql
-- this becomes a CSS comment
/* so does this */
```

Comments are removed when using `minify: true`, `--minify`, `comments: false` or `--no-comments`.

## API

- `compile(source, options?)` returns a CSS string
- `parse(source)` returns a typed `Stylesheet` AST
- `generate(ast, options?)` turns an AST into CSS
- `transpile(input, options?)` synchronously writes a CSS file
- `transpileFile(input, options?)` asynchronously writes a CSS file
- `CqlSyntaxError` includes the error's `line`, `column` and `offset`

`CompileOptions` supports `minify` and `comments`. `TranspileOptions` also supports `output`.

## Development

```sh
npm test
npm run typecheck
npm pack --dry-run
```

MIT licensed. This is still a silly project, it just has a less silly compiler now.
