const fs = require('fs')

let config = {}

if (fs.existsSync('sp_comparer.json'))
    config = JSON.parse(fs.readFileSync('./sp_comparer.json', 'utf-8'))

function getIgnoredScriptsList() {
    return (config.ignoredScripts ?? []).map(sp => sp.toLowerCase())
}




module.exports = {
    getIgnoredScriptsList
}