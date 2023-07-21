# CSS QL
**Cascading Style Sheets Query Language**
An SQL-like CSS syntax into standard CSS.

## Installation
Since this is not a published package, you need to manually add the `.js` file to your project. Once you've added the `cql.js` file, you can use `require` to import it into your project.
```js
const cql = require('./cql');
```

## Usage
To use the SQLCSS Transpiler, call the `transpile` function with a string representing the path to your `.cql` file.
```js
cql.transpile('./styles.cql');
```
This will generate a `.css` file in the same directory, with the same filename (but different extension).

## Syntax
The SQLCSS Transpiler supports a limited syntax based on SQL. Here are a few examples:
**Setting a property on a class:**
```sql
SET color = "red" WHERE CLASSNAME LIKE %red%
```
This will be transpiled to:
```css
.red { color: red; }
```
**Setting a property on an id:**
```sql
SET background-color = "green" WHERE ID LIKE %myId%
```
This will be transpiled to:
```css
#myId { background-color: green; }
```
**Setting a property on a tag:**
```sql
SET font-size = "16px" WHERE TAGNAME LIKE %p%
```
This will be transpiled to:
```css
p { font-size: 16px; }
```

Please note that this is a basic implementation and does not support all the features of CSS, such as media queries, pseudo-classes, pseudo-elements, and so on.

## Limitations
This is a basic, experimental tool and is not recommended for production use. It does not currently support:
* Error handling
* Comments
* Advanced CSS features such as media queries, animations, and more
* @import statements

## License
This project is open source under the MIT license.

## Contributing
Contributions are welcome. Please submit a pull request for any improvements or bug fixes.