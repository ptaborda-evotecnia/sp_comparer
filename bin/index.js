#!/usr/bin/env node
const main = require("../index");
const minimist = require('minimist');
const { downloadAllStoredProcedures } = require("../lib/getProcedure");
const { keyPress } = require("../lib/keypress");
const { compararScriptsConCodigo } = require("../lib/inquirerFunctions");

const argv = minimist(process.argv.slice(2));


async function tmpMain() {
    if (argv.init) {
        await downloadAllStoredProcedures('./scripts/')
        await keyPress()
        console.clear()
        console.log('Comparar scripts con el código')
        await compararScriptsConCodigo()
        await keyPress()
    }
    main()
}


tmpMain()




//main()