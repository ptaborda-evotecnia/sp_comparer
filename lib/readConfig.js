const fs = require('fs')
const { seleccionarPrompt } = require('./seleccionarPrompt')
const dotenv = require('dotenv')

let config = {}

function getIgnoredScriptsList() {
    return (config.ignoredScripts ?? []).map(sp => sp.toLowerCase())
}

function getConexionesValidas(connections) {
    return connections.filter(x => x.name && typeof x.name === 'string' && x.route && typeof x.route === 'string')
}


async function loadConfig(proyecto) {
    let file;
    if (fs.existsSync('sp_comparer.json'))
        file = JSON.parse(fs.readFileSync('./sp_comparer.json', 'utf-8'))

    if (!file) {
        const emptyConfig = require('./emptyConfig.json');
        fs.writeFileSync('./sp_comparer.json', JSON.stringify(emptyConfig, null, 2));
        return await loadConfig(proyecto)
    }

    if (!file.projects) throw new Error('Missing property projects in sp_comparer.json')
    if (typeof file.projects !== 'object') throw new Error('Property projects must be an array in sp_comparer.json')
    if (!file.projects.length) throw new Error('There must be at least one project in sp_comparer.json')

    if (file.projects.length === 1) {
        config = file.projects[0]
    } else {
        console.clear()
        let project = await seleccionarPrompt(file.projects, 'Seleccionar Proyecto', p => p.projectName)
        config = project
    }



    let path = 'config/config.env'

    if (config.connections && config.connections.length) {
        let conexionesValidas = getConexionesValidas(config.connections)
        if (conexionesValidas.length) {
            let conexion = await seleccionarPrompt(conexionesValidas, 'Seleccionar Conexion', c => c.name)
            path = conexion.route
        }
    }

    dotenv.config({ path })

    validarConfig()

    return getConfig()
}

function getConfig() {
    return config
}

function validarConfig() {
    if (!config) throw new Error('Config no encontrado')
    if (!config.projectName) throw new Error('Nombre de proyecto no configurado, (projectName)')
    if (config.ignoreFoldersAtLoad && (typeof config.ignoreFoldersAtLoad !== 'object' || config.ignoreFoldersAtLoad.length)) throw new Error('"ignoreFoldersAtLoad" debe ser un array')
}

module.exports = {
    getIgnoredScriptsList,
    loadConfig,
    getConfig
}