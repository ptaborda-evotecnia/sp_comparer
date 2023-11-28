const fs = require('fs');
const path = require('path');
const util = require('util');
const { loadScriptsFromFolder } = require('./getProcedure');
const { getIgnoredScriptsList } = require('./readConfig');

const readFileAsync = util.promisify(fs.readFile);

let jsFiles = [];


function findJSFiles(folderPath, ignoreFolders) {

    const files = fs.readdirSync(folderPath, ignoreFolders);

    for (const file of files) {
        const filePath = path.join(folderPath, file);

        if (fs.statSync(filePath).isDirectory() && file !== 'node_modules' && file !== '.git' && (!ignoreFolders || !ignoreFolders.includes(file))) {
            findJSFiles(filePath, ignoreFolders); // Recurse into subdirectories
        } else if (file.endsWith('.js')) {
            jsFiles.push(filePath); // Add .js files to the array
        }
    }
}



async function analyzeSPsFromCode(folderName, ignoreFolders = undefined, force) {


    const ignoredScriptList = getIgnoredScriptsList()

    jsFiles = []
    findJSFiles('./', ignoreFolders)
    const scripts = loadScriptsFromFolder(folderName); // Load .sql scripts from the "out" folder

    // Create a set to keep track of stored procedure names used in .js files

    //console.log(Object.keys(scripts.default))

    const usedScriptNames = {}
    const missingScriptNames = {}
    const unusedScriptNames = {}

    for (const jsFile of jsFiles) {
        let jsContent = await readFileAsync(jsFile, 'utf8');

        const regexRemoveComments = /\/\/[^\n]*|\/\*[\s\S]*?\*\//g;
        jsContent = jsContent.replace(regexRemoveComments, '');

        const regexPattern = new RegExp('llamarSP\\s*\\n*\\(\\s*([\'"])([^\'"]*)\\1\\s*.*?\\s*([\'"]([^\'"]*)[\'"])?\\s*\\n*\\)', 'g');

        let matches = jsContent.match(regexPattern)
        if (matches && matches.length) {
            matches.forEach((match) => {
                match = regexPattern.exec(match)
                regexPattern.lastIndex = 0
                if (!match) return
                const scriptName = match[2].toLowerCase();
                if (!scriptName) return
                if (match[4]) {
                    if (!usedScriptNames[match[4]]) {
                        usedScriptNames[match[4]] = new Set()
                    }
                    usedScriptNames[match[4]].add(scriptName.trim())
                } else {
                    if (!usedScriptNames.default) {
                        usedScriptNames.default = new Set()
                    }
                    usedScriptNames.default.add(scriptName.trim())
                }
            })
        }
    }


    //Missing
    Object.keys(usedScriptNames).forEach((conexion) => {
        let scriptsInConexion = scripts[conexion] ? Object.keys(scripts[conexion]) : []
        let usedScriptInConexion = Array.from(usedScriptNames[conexion])
        usedScriptInConexion.forEach(sp => {
            if (!ignoredScriptList.includes(sp) && (!scriptsInConexion.includes(sp) || force)) {
                if (!missingScriptNames[conexion]) {
                    missingScriptNames[conexion] = new Set()
                }
                missingScriptNames[conexion].add(sp)
            }
        })
    })



    //unused
    Object.keys(scripts).forEach(conexion => {
        let spsLowerCased = Object.keys(scripts[conexion] ?? []).map(spname => spname.toLowerCase())

        let scriptInConexion = usedScriptNames[conexion] ? Array.from(usedScriptNames[conexion]) : []
        let missingScriptsInConexion = missingScriptNames[conexion] ? Array.from(missingScriptNames[conexion]) : []

        spsLowerCased.forEach(sp => {
            if (!scriptInConexion.includes(sp.toLowerCase()) && !missingScriptsInConexion.includes(sp)) {
                if (!unusedScriptNames[conexion]) {
                    unusedScriptNames[conexion] = new Set()
                }
                unusedScriptNames[conexion].add(sp)
            }
        })

    })

    return { missingScriptNames, unusedScriptNames };
}

exports.analyzeSPsFromCode = analyzeSPsFromCode;
