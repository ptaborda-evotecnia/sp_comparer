const sensitiveWords = [
    'null', 'declare', 'select', 'insert', 'update', 'delete', 'from', 'where', 'and', 'or', 'not', 'like',
    'as', 'inner', 'left', 'right', 'join', 'on', 'group', 'by', 'having', 'order', 'by', 'asc', 'desc',
    'union', 'all', 'distinct', 'case', 'when', 'then', 'else', 'end', 'outer', 'cross', 'natural', 'top',
    'limit', 'offset', 'is', 'between', 'exists', 'any', 'all', 'in', 'nullif', 'coalesce', 'cast',
    'count', 'sum', 'avg', 'min', 'max', 'abs', 'mod', 'floor', 'ceil', 'exp', 'power', 'sqrt', 'log',
    'log10', 'round', 'trunc', 'concat', 'substring', 'char_length', 'character_length', 'lower', 'upper',
    'trim', 'leading', 'trailing', 'both', 'year', 'month', 'day', 'hour', 'minute', 'second', 'extract',
    'current_date', 'current_time', 'current_timestamp', 'current_user', 'session_user', 'user', 'database',
    'schema', 'table', 'column', 'view', 'index', 'constraint', 'primary', 'foreign', 'key', 'check',
    'default', 'unique', 'create', 'alter', 'drop', 'add', 'modify', 'set', 'values', 'into', 'values',
    'join', 'left', 'right', 'outer', 'inner', 'full', 'exists', 'when', 'then', 'else', 'end', "return", "varbinary", "int", "procedure"
    /* Add more keywords here as needed */
];

function normalizeText(text) {
    // Remove comments (multiline or single-line)
    text = text.replace(/(--.*?(\n|$))|(\/\*[\s\S]*?\*\/)/g, '');


    // Convert sensitive words to uppercase
    text = text.replace(
        new RegExp(`\\b(${sensitiveWords.join('|')})\\b`, 'gi'),
        function (match) {
            return match.toUpperCase();
        }
    );


    text = text.replace(/CREATE PROCEDURE\s+(?:\[dbo\]\.)?\[([^\]]+)\]/gi, function (match, spName) {
        spName = spName.replace(/dbo\./gi, '')
        spName = spName.replace('[', '')
        spName = spName.replace(']', '')
        return `CREATE PROCEDURE ${spName}`;
    });
    text = text.replace(/(CREATE PROCEDURE )(\w+)/i, (match, createProcedure, firstWord) => {
        return createProcedure + firstWord.toUpperCase();
    });

    text = text.replace(/\b(null|declare|select)\b/gi, function (match) {
        return match.toUpperCase();
    });

    // Remove spaces and newlines
    return text.replace(/\s+/g, '');
}

exports.normalizeText = normalizeText