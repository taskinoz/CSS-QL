const cql = require('../lib');
const fs = require('fs');
const path = require('path');

const test1 = fs.readFileSync(path.join(__dirname, './example.cql'), 'utf8');

const test2 = `
SET color = "red", 
background-color = "blue" WHERE CLASSNAME LIKE %button AND hover%;
MEDIA "(max-width: 600px)" {
    SET display = "none" WHERE CLASSNAME LIKE %hideOnMobile%;
}
`;

const test1CSS = cql.transpile(test1);
const test2CSS = cql.transpile(test2);

fs.writeFileSync('./example.css', test1CSS);
fs.writeFileSync('./example2.css', test2CSS);
