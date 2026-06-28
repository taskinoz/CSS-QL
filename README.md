# CSS-QL

**Cascading Style Sheets Query Language** is the SQL-flavoured CSS compiler nobody asked for, now implemented as a real TypeScript library.

It began with [Jordy van der Wielen's meme tweet](https://twitter.com/Jordy_vD_/status/1682041493446606849) and the wonderfully cursed premise that styling a class should look like a database update:

```sql
SET color = "red" WHERE CLASSNAME LIKE %danger%
```

```css
.danger {
  color: red;
}
```

The original syntax still works. Version 2 adds a parser, typed AST, useful diagnostics, arbitrary selectors, multiple declarations and selectors, nested CSS, every kind of CSS at-rule through a generic construct, comments, minification, file APIs, and a CLI.

## Install and build

```sh
npm install
npm run build
```

Use it as a library:

```ts
import { compile, parse, transpileFile } from "css-ql";

const css = compile('SET display = "grid" WHERE CLASSNAME LIKE %gallery%;');
const ast = parse('SET color = "hotpink" WHERE ID LIKE %logo%;');
await transpileFile("styles.cql", { output: "public/styles.css", minify: true });
```

The old synchronous API remains available:

```js
const { transpile } = require("css-ql");
const outputPath = transpile("styles.cql"); // writes styles.css
```

Or use the CLI:

```sh
cql styles.cql
cql styles.cql --output public/styles.css --minify
cql styles.cql --stdout
```

## Language

### Rules and selectors

`SET` accepts one or more comma-separated declarations. `WHERE` accepts selector conditions joined by `OR`.

```sql
SET color = %var(--text)%, padding = "1rem", display = "grid !important"
WHERE CLASSNAME LIKE %card% OR ID LIKE %featured%;
```

Selector types are:

| CQL | CSS |
| --- | --- |
| `CLASSNAME LIKE %card%` | `.card` |
| `ID LIKE %app%` | `#app` |
| `TAGNAME LIKE %main%` | `main` |
| `SELECTOR LIKE %.card:hover > img%` | `.card:hover > img` |
| `ROOT LIKE %root%` | `:root` |

`SELECTOR` is the escape hatch for the complete CSS selector grammar, including attributes, pseudo-classes, pseudo-elements, combinators, selector lists, and nesting with `&`.

### Values and literals

Double-quoted and single-quoted values are CQL strings; their surrounding quotes are not emitted. Percent literals preserve complex CSS text, including spaces and commas:

```sql
SET font-family = %"Meme Sans", sans-serif%,
    grid-template-columns = %repeat(3, minmax(0, 1fr))%
WHERE CLASSNAME LIKE %grid%;
```

Escape a literal percent sign as `\%` inside `%...%`. Simple CSS tokens such as `red`, `0`, and `var(--brand)` may be left unquoted.

### Nested CSS

Put more statements after a rule to emit native CSS nesting:

```sql
SET color = "navy" WHERE CLASSNAME LIKE %button% {
  SET color = "blue" WHERE SELECTOR LIKE %&:hover%;
  AT MEDIA %(prefers-reduced-motion: no-preference)% {
    SET transition = "color 150ms";
  }
}
```

### At-rules

`AT <name> <prelude>` maps to any CSS at-rule. This generic form covers current and future CSS instead of maintaining a hard-coded allowlist.

```sql
AT IMPORT %url("theme.css") layer(theme)%;

AT MEDIA %(width >= 48rem)% {
  SET display = "grid" WHERE CLASSNAME LIKE %layout%;
}

AT FONT-FACE {
  SET font-family = %"Meme Sans"%, src = %url("meme.woff2") format("woff2")%;
}

AT KEYFRAMES %spin% {
  SET transform = "rotate(0deg)" WHERE SELECTOR LIKE %from%;
  SET transform = "rotate(360deg)" WHERE SELECTOR LIKE %to%;
}
```

A `SET` without `WHERE` is allowed inside an `AT` block for declaration-based rules such as `@font-face`, `@page`, and `@property`. Statement-based blocks can contain normal `SET ... WHERE ...` rules and nested `AT` rules. See [examples/complete.cql](examples/complete.cql).

### Comments

Both SQL-style line comments and CSS block comments are accepted:

```sql
-- emitted as a CSS comment
/* also emitted as a CSS comment */
```

Comments are omitted by `minify: true`, `--minify`, `comments: false`, or `--no-comments`.

## API

- `compile(source, options?)` → CSS string
- `parse(source)` → typed `Stylesheet` AST
- `generate(ast, options?)` → CSS string
- `transpile(input, options?)` → synchronously writes a CSS file and returns its path
- `transpileFile(input, options?)` → asynchronously writes a CSS file and returns its path
- `CqlSyntaxError` → syntax error with `line`, `column`, and `offset`

`CompileOptions` supports `minify` and `comments`. `TranspileOptions` adds `output`.

## Development

```sh
npm test
npm run typecheck
npm pack --dry-run
```

CSS-QL is MIT licensed. It is intentionally silly; the compiler no longer has to be.
