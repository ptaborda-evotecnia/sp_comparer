const path = require("path");
const { keyPress } = require("./keypress");
var ProgressBar = require('progress');
const readdirp = require('readdirp');
const fs = require('fs');

let inquirer = require('inquirer').default;
inquirer = require('inquirer')

async function eliminarScriptInutilizados(proyecto) {
    let resultados_codigo = {};

    if (fs.existsSync('resultadoscodigo_sp_comparer.json')) {
        resultados_codigo = JSON.parse(fs.readFileSync('./resultadoscodigo_sp_comparer.json', 'utf-8'));
    }

    if (!resultados_codigo.unusedScriptNames) {
        console.log('\n\nNo hay scripts que eliminar (resultadoscodigo_sp_comparer.json)');
        await keyPress();
        return;
    }

    let question = await inquirer.prompt({ type: 'confirm', message: '¿Estás seguro de eliminar (solo borra local)?', name: 'question' })
    if (!question.question) return

    let total = Object.keys(resultados_codigo.unusedScriptNames).reduce((acc, val) => { return resultados_codigo.unusedScriptNames[val].length + acc }, 0)

    const bar = new ProgressBar(':bar [:current/:total] :percent', { total }); // Create a progress bar
    bar.render()

    await Promise.all(Object.keys(resultados_codigo.unusedScriptNames).map(async (conexion) => {
        for (const unusedSP of resultados_codigo.unusedScriptNames[conexion]) {

            await new Promise((resolve, reject) => {
                readdirp(path.join(process.cwd(), 'scripts', conexion))
                    .on('data', (entry) => {
                        if (entry.path.slice(0, -4).toLowerCase() === unusedSP)
                            try {
                                fs.unlinkSync(path.normalize(entry.fullPath))
                                bar.tick()
                                resolve()
                            } catch (error) {
                                console.log(error)
                            }
                    })
                    .on('end', () => {
                        //bar.tick()
                        resolve()
                    })

            })
        }
    }));

    bar.terminate()

    if (resultados_codigo.missingScriptNames) {
        delete resultados_codigo.unusedScriptNames
        fs.writeFileSync('./resultadoscodigo_sp_comparer.json', JSON.stringify(resultados_codigo, null, 2))
    } else {
        fs.unlinkSync('./resultadoscodigo_sp_comparer.json')
    }


}

exports.eliminarScriptInutilizados = eliminarScriptInutilizados;
