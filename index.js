const dotenv = require('dotenv')
const fs = require('fs')
let inquirer = require('inquirer').default
inquirer = require('inquirer')

const { descargarSPs, compararScriptsConBBDD, compararScriptsConCodigo, actualizarSPs, compararScriptsEnConflicto } = require('./lib/inquirerFunctions')
const { eliminarScriptInutilizados } = require('./lib/eliminarScriptsInutilizados')
const { keyPress } = require('./lib/keypress')
const { loadConfig } = require('./lib/readConfig')

async function main() {

    let config = await loadConfig()
    let resultados_codigo, conflictos

    if (fs.existsSync('resultadoscodigo_sp_comparer.json'))
        resultados_codigo = JSON.parse(fs.readFileSync('./resultadoscodigo_sp_comparer.json', 'utf-8'))

    if (fs.existsSync('resultados_sp_comparer.json'))
        conflictos = JSON.parse(fs.readFileSync('./resultados_sp_comparer.json', 'utf-8'))

    //console.clear()
    if (config.proyecto)
        console.log('Proyecto configurado: ' + config.proyecto + '\n')
    let opciones = [
        '1 - Comparar scripts con la base de datos',
        '2 - Comparar llamadas dentro del codigo con scripts',
        '3 - Descargar SPs',
        '4 - Actualizar SPs',

    ];
    //console.clear()

    if (resultados_codigo?.missingScriptNames) opciones.push(`${opciones.length + 1} - Buscar scripts faltantes (No implementado)`)
    if (resultados_codigo?.unusedScriptNames) opciones.push(`${opciones.length + 1} - Eliminar scripts inutilizados`)
    if (conflictos) opciones.push(`${opciones.length + 1} - Comparar scripts en conflicto`)

    opciones.push('Exit')

    const { choice } = await inquirer.prompt([
        {
            type: 'list',
            name: 'choice',
            message: 'Seleccione una opcion:',
            choices: opciones,
        },
    ]);


    if (choice === 'Exit') {
        console.log('Adios!');
        process.exit();
    }


    if (choice.includes('3')) {
        await descargarSPs()
    } else if (choice.includes('1')) {
        await compararScriptsConBBDD()
    } else if (choice.includes('2')) {
        await compararScriptsConCodigo()
    } else if (choice.includes('4')) {
        await actualizarSPs()
    } else if (choice.includes('Eliminar')) {
        await eliminarScriptInutilizados()
    } else if (choice.includes('Comparar scripts en conflicto')) {
        await compararScriptsEnConflicto()
    }

    await keyPress()

    main()
}

module.exports = main