const { loadScriptsFromFolder, getProcedureDefinition } = require("./getProcedure");

var ProgressBar = require('progress');
const { normalizeText } = require("./normalizeText");

const batchSize = 60; // Number of requests to execute in each batch




async function compararProcedimientoPorConexion(conexion) {

    let scripts = loadScriptsFromFolder('./scripts/')
    if (!scripts[conexion]) {
        scripts[conexion] = {}
    }
    const spKeys = Object.keys(scripts[conexion]);

    console.log('Comparando procedimientos de ' + conexion)
    const bar = new ProgressBar(':bar [:current/:total] :percent :etas', { total: spKeys.length }); // Create a progress bar

    const noExisten = []; // Array to store scripts with errors
    const diferentes = []; // Array to store scripts with mismatches
    const errors = []; // Array to store scripts with mismatches

    for (let j = 0; j < spKeys.length; j += batchSize) {
        const batch = spKeys.slice(j, j + batchSize);

        await Promise.all(batch.map(async (sp) => {
            try {
                const rta = await getProcedureDefinition(conexion, sp);

                if (normalizeText(scripts[conexion][sp]) !== normalizeText(rta)) {
                    diferentes.push(sp);
                }

                bar.tick(); // Increment the progress bar
            } catch (error) {
                if (error.message.includes('does not exist'))
                    noExisten.push(sp);
                else {
                    console.error(error)
                    errors.push(sp);
                }
                bar.tick(); // Increment the progress bar
            }
        }));
    }

    return { noExisten, errors, diferentes }
}


async function compararAllProcedimientos() {
    let dbConfigs = JSON.parse(process.env.DBCONFIGS)
    console.log('Comparando todos los SPs')
    const bar = new ProgressBar(':bar [:current/:total] :percent', { total: Object.keys(dbConfigs).length }); // Create a progress bar
    bar.render()
    let resultados = {

    }
    for (const conexion of Object.keys(dbConfigs)) {
        console.log('\n')
        resultados[conexion] = await compararProcedimientoPorConexion(conexion)
        bar.tick()
    }

    return resultados
}


exports.compararAllProcedimientos = compararAllProcedimientos
exports.compararProcedimientoPorConexion = compararProcedimientoPorConexion