#!/usr/bin/env node
const main = require("../index");
const minimist = require('minimist');
const { keyPress } = require("../lib/keypress");
const { compararScriptsConCodigo, seleccionarPrompt } = require("../lib/inquirerFunctions");
const { descargarScriptsFaltantes } = require("../lib/descargarScriptsFaltantes");
const { compararAllProcedimientos } = require("../lib/compareProcedure");
const { buscarScript, getProcedureDefinition } = require("../lib/getProcedure");
const { openMeldFileVsContent } = require("../lib/openMeld");

const argv = minimist(process.argv.slice(2));


async function tmpMain() {
    if (argv.init) {
        await descargarScriptsFaltantes('./scripts/')
        await keyPress()
        console.clear()
        console.log('Comparar scripts con el código')
        await compararScriptsConCodigo()
        await keyPress()
    }
    if (argv.test) {
        let resultado = await compararAllProcedimientos()

        const scriptComparados = await Promise.all(
            Object.keys(resultado)
                .filter((conexion) => resultado[conexion]?.diferentes?.length)
                .flatMap((conexion) =>
                    resultado[conexion].diferentes.map(async (sp) => {
                        return { ...(await buscarScript('scripts', conexion, sp, 'regional')), spOriginal: sp, conexion };
                    })
                )
        );
        console.clear();
        console.log('Los siguientes sps son diferentes, seleccione los que desea impactar desde el codigo a la bbdd. \n')
        let scriptAImpactar = await seleccionarPrompt(scriptComparados, 'Seleccionar', s => s.path)

        console.log(scriptAImpactar)
        let procedureBDDefinition = await getProcedureDefinition(scriptAImpactar.conexion, scriptAImpactar.spOriginal)

        console.log(await openMeldFileVsContent(scriptAImpactar.fullPath, procedureBDDefinition))

        process.exit()
    }
    main()
}


tmpMain()




//main()