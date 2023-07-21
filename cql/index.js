const fs = require('fs');
const path = require('path');

function convertLine(line) {
    // regex pattern for line
    const pattern = /SET\s+(.*?)\s+=\s+"(.*?)"\s+WHERE\s+(.*?)\s+LIKE\s+%(.*)%/;
    const matches = line.match(pattern);

    if (matches) {
        const property = matches[1];
        const value = matches[2];
        const selectorType = matches[3].toUpperCase();
        let selectorName = matches[4];

        if (selectorType === 'CLASSNAME') {
            selectorName = '.' + selectorName;
        } else if (selectorType === 'ID') {
            selectorName = '#' + selectorName;
        }

        return `${selectorName} { ${property}: ${value}; }\n`;
    }

    return '';
}

function transpile(file) {
    const filePath = path.resolve(file);
    const outputFilePath = filePath.replace('.cql', '.css');
    const cqlContent = fs.readFileSync(filePath, 'utf-8');
    const cqlLines = cqlContent.split('\n');

    const cssContent = cqlLines.map(convertLine).join('');

    fs.writeFileSync(outputFilePath, cssContent, 'utf-8');
}

module.exports = {
    transpile
};
