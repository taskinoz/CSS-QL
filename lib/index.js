const cleanCSS = require('clean-css'); // Assuming you have `clean-css` installed

function extractCommands(cqlContent) {
    let commands = [];
    let command = '';
    
    const lines = cqlContent.split('\n').map(line => line.trim());

    for (const line of lines) {
        if (!line) continue; // Skip empty lines

        command += line;
        if (line.endsWith('}') || line.endsWith(';')) {
            commands.push(command.trim());
            command = '';
        } else if (lines.indexOf(line) === lines.length - 1) { // if it's the last line
            throw new Error("CQL Syntax Error: Missing ';' at the end of command.");
        }
    }

    if (command) {
        throw new Error("CQL Syntax Error: Missing ';' at the end of command.");
    }

    return commands;
}


function convertLine(command, minified) {
    let css = '';

    // For media queries
    if (command.startsWith('MEDIA')) {
        const mediaPattern = /MEDIA\s+"(.*?)"\s+{(.*?)};/;
        const mediaMatches = command.match(mediaPattern);

        if (mediaMatches) {
            const mediaQuery = mediaMatches[1].trim();
            const innerContent = mediaMatches[2].trim();

            css += `@media ${mediaQuery} {\n`;
            css += convertLine(innerContent, minified);
            css += '}\n';
            return css;
        }
    }

    // Parse declarations
    const declarationsPattern = /SET\s+(.*?)\s+WHERE/;
    const declarationsMatches = command.match(declarationsPattern);

    if (!declarationsMatches) return '';

    const declarations = declarationsMatches[1].split(',').map(d => d.trim());

    // Extract and build selectors
    const selectorPattern = /(CLASSNAME|ID|TAGNAME)\s+LIKE\s+%(.*?)%/g;
    let match;
    let selectors = '';

    while ((match = selectorPattern.exec(command)) !== null) {
        const type = match[1];
        const name = match[2];

        if (type === 'CLASSNAME') {
            selectors += '.' + name;
        } else if (type === 'ID') {
            selectors += '#' + name;
        } else if (type === 'TAGNAME') {
            selectors = name + selectors;  // Placing tag names at the start of the selector.
        }
    }

    const rules = declarations.map(d => {
        const [property, value] = d.split('=').map(s => s.trim());
        return `${property}: ${value.replace(/"/g, '')};`;
    }).join(' ');

    css += `${selectors} { ${rules} }\n`;

    if (minified) {
        const minifier = new cleanCSS();
        css = minifier.minify(css).styles;
    }

    return css;
}



function transpile(cqlContent, minified = false) {
    const commands = extractCommands(cqlContent);
    return commands.map(command => convertLine(command, minified)).join('');
}

module.exports = {
    transpile
};
