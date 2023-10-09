const { analyzeSPsFromCode } = require('./analyzeSPsFromCode');
const { compararProcedimientoPorConexion, compararAllProcedimientos } = require('./compareProcedure');
const { downloadAllStoredProcedures, downloadStoredProcedures } = require('./getProcedure');
const { keyPress } = require('./keypress');

const fs = require('fs')

let inquirer = require('inquirer').default;
inquirer = require('inquirer')

let config = {}

if (fs.existsSync('sp_comparer.json'))
    config = JSON.parse(fs.readFileSync('./sp_comparer.json', 'utf-8'))




async function descargarSPs() {

    let dbConfigs = JSON.parse(process.env.DBCONFIGS)

    const opciones = [
        '1 - Descargar de todas las conexiones',
    ];

    Object.keys(dbConfigs).forEach((conexion, index) => { opciones.push(`${index + 2} - ${conexion}`) })
    opciones.push(`${Object.keys(dbConfigs).length + 2} - Volver`)

    const { choice } = await inquirer.prompt([
        {
            type: 'list',
            name: 'choice',
            message: 'DESCARGAR SPS:',
            choices: opciones,
        },
    ]);

    if (choice === `${Object.keys(dbConfigs).length + 2} - Volver`) return

    const question = await inquirer.prompt([{
        name: 'output_directory',
        message: 'Desea modificar el directorio?: ',
        default: './scripts_out/'
    }])
    console.clear()
    if (choice === '1 - Descargar de todas las conexiones') {
        await downloadAllStoredProcedures(question.output_directory)
    } else {
        let conexion = Object.keys(dbConfigs).find((conexion, index) => choice === `${index + 2} - ${conexion}`)
        await downloadStoredProcedures(conexion, question.output_directory)
    }
}

function verificarConflictos(resultados) {
    return Object.keys(resultados).some(conexion => Object.keys(resultados[conexion]).some(prob => resultados[conexion][prob].length > 0))
}

async function compararScriptsConBBDD() {

    let dbConfigs = JSON.parse(process.env.DBCONFIGS)
    const opciones = [
        '1 - Comparar de todas las conexiones',
    ];

    Object.keys(dbConfigs).forEach((conexion, index) => { opciones.push(`${index + 2} - ${conexion}`) })

    opciones.push(`${Object.keys(dbConfigs).length + 2} - Volver`)

    const { choice } = await inquirer.prompt([
        {
            type: 'list',
            name: 'choice',
            message: 'COMPARAR SPS:',
            choices: opciones,
        },
    ]);

    let resultados;

    if (choice === '1 - Comparar de todas las conexiones') {
        resultados = await compararAllProcedimientos()
    } else if (choice === `${Object.keys(dbConfigs).length + 2} - Volver`) {
        return;
    } else {
        let conexion = Object.keys(dbConfigs).find((conexion, index) => choice === `${index + 2} - ${conexion}`)
        resultados = await compararProcedimientoPorConexion(conexion)
    }
    if (resultados) {

        if (verificarConflictos(resultados)) {
            fs.writeFileSync('./resultados_sp_comparer.json', JSON.stringify(resultados, null, 2))
            console.log('Atencion, existen conflictos...')
            console.log('Resultados guardados en "resultados_sp_comparer.json"\n\n')
        } else {
            console.log('\nFelicidades! No hay conflictos!\n\n')
            if (fs.existsSync('./resultados_sp_comparer.json')) fs.unlinkSync('./resultados_sp_comparer.json')
        }

    }

}

async function compararScriptsConCodigo() {



    const question = await inquirer.prompt([{
        name: 'directory',
        message: 'Desea modificar el directorio de scripts?: ',
        default: './scripts/'
    }])

    let resultados = await analyzeSPsFromCode(question.directory, config.ignoreFoldersAtLoad)
    resultados = JSON.parse(JSON.stringify(resultados, (_key, value) => (value instanceof Set ? [...value].sort((a, b) => a.localeCompare(b)) : value), 2))

    if (verificarConflictos(resultados.missingScriptNames) || verificarConflictos(resultados.unusedScriptNames)) {
        if (!verificarConflictos(resultados.unusedScriptNames)) delete resultados.unusedScriptNames
        if (!verificarConflictos(resultados.missingScriptNames)) delete resultados.missingScriptNames

        fs.writeFileSync('./resultadoscodigo_sp_comparer.json', JSON.stringify(resultados, null, 2))
        console.log('Resultados guardados en "resultadoscodigo_sp_comparer.json"\n\n' +
            `${config.ignoreFoldersAtLoad ? '\n\nRecuerde que se están ignorando del código las carpetas: ' + config.ignoreFoldersAtLoad : ''}`)
        console.log('\n\n')
    } else {
        console.log('\nFelicidades! No hay que incluir sps!' +
            `${config.ignoreFoldersAtLoad ? '\n\nRecuerde que se están ignorando del código las carpetas: ' + config.ignoreFoldersAtLoad : ''}`)
        console.log('\n\n')

        if (fs.existsSync('./resultadoscodigo_sp_comparer.json')) fs.unlinkSync('./resultadoscodigo_sp_comparer.json')

    }

}








exports.compararScriptsConCodigo = compararScriptsConCodigo
exports.compararScriptsConBBDD = compararScriptsConBBDD
exports.descargarSPs = descargarSPs