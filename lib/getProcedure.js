const Mssql = require('mssql')

var ProgressBar = require('progress');

const fs = require('fs');
const path = require('path');

let config = {}
if (require('fs').existsSync('sp_comparer.json'))
  config = JSON.parse(require('fs').readFileSync('./sp_comparer.json', 'utf-8'))

const readdirp = require('readdirp');

function loadScriptsFromFolder(folderPath) {
  const scripts = {};
  function traverseDirectory(dirPath, moduleName) {

    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }

    const files = fs.readdirSync(dirPath);

    for (const file of files) {
      const filePath = path.join(dirPath, file);
      const stats = fs.statSync(filePath);

      if (stats.isDirectory()) {
        // Recursively traverse subdirectories with the module name
        traverseDirectory(filePath, moduleName || path.basename(filePath));
      } else if (file.endsWith('.sql')) {
        if (!moduleName) {
          console.error(`Error: Script '${file}' is outside a connection (module) folder.`);
          continue; // Skip this script and continue to the next one
        }

        let flag
        let scriptName = path.parse(file).name;
        let proyecto = scriptName.split('.')[1]
        if (typeof proyecto === 'string') {
          if (config.proyecto && proyecto === config.proyecto) {
            flag = true
            scriptName = scriptName.split('.')[0]
          } else {
            continue;
          }
        }

        const scriptContent = fs.readFileSync(filePath, 'utf8');
        if (!scripts[moduleName]) {
          scripts[moduleName] = {};
        }

        if (scripts[moduleName][scriptName] && !flag) continue

        scripts[moduleName][scriptName] = scriptContent;
      }
    }
  }

  traverseDirectory(folderPath);
  return scripts;
}


async function getProcedureDefinition(conexion, procedureName) {
  try {
    const pool = await getPool(conexion);
    const request = pool.request();
    // Query the SQL Server system tables to get the procedure definition
    const result = await request.query(`
        SELECT definition
        FROM sys.sql_modules
        WHERE object_id = OBJECT_ID('${procedureName}', 'P')
      `);
    // Check if the procedure exists
    if (result.recordset.length === 1) {
      const procedureDefinition = result.recordset[0].definition;
      if (!procedureDefinition) console.log(`\nError getting procedure definition (${conexion}): ${procedureName}\nPuede que el usuario no tenga permisos para descargar SPs`)
      return procedureDefinition;
    } else {
      throw new Error(`Procedure ${procedureName} does not exist.`);
    }
  } catch (err) {
    throw new Error(`\nError getting procedure definition: ${err.message}`);
  }
}

let pools = {}

async function getPool(name) {
  let dbConfigs = JSON.parse(process.env.DBCONFIGS)

  if (!Object.prototype.hasOwnProperty.call(pools, name)) {
    const pool = new Mssql.ConnectionPool(dbConfigs[name])
    const close = pool.close.bind(pool)
    pool.close = (...args) => {
      delete pools[name]
      return close(...args)
    }
    await pool.connect()
    pools[name] = pool
  }
  return pools[name]
}

async function downloadStoredProcedures(conexion, outputDirectory = './scripts_out') {
  try {

    const pool = await getPool(conexion);
    const request = pool.request();

    // Query the SQL Server system tables to get a list of all stored procedures
    const result = await request.query(`
      SELECT name
      FROM sys.objects
      WHERE type = 'P'
    `);


    // Loop through the resultset and download each stored procedure

    if (!fs.existsSync(path.join(outputDirectory, conexion))) {
      fs.mkdirSync(path.join(outputDirectory, conexion), { recursive: true });
    }
    console.log('\nDescargando sps de:' + conexion)
    const bar = new ProgressBar(':bar [:current/:total] :percent :etas', { total: result.recordset.length }); // Create a progress bar
    bar.render()
    for (const row of result.recordset) {
      const procedureName = row.name;
      const procedureDefinition = await getProcedureDefinition(conexion, procedureName);
      const filePath = path.join(outputDirectory, conexion, `${procedureName}.sql`);
      fs.writeFileSync(filePath, procedureDefinition);
      bar.tick();
    }
  } catch (err) {
    throw new Error(`Error downloading stored procedures: ${err.message}`);
  }
}

async function downloadAllStoredProcedures(outputDirectory = './scripts_out') {
  let dbConfigs = JSON.parse(process.env.DBCONFIGS)

  console.log('Descargando todos los SPs')
  const bar = new ProgressBar(':bar [:current/:total] :percent', { total: Object.keys(dbConfigs).length }); // Create a progress bar
  bar.render()
  for (const conexion of Object.keys(dbConfigs)) {
    console.log('\n')
    await downloadStoredProcedures(conexion, outputDirectory)
    bar.tick()
  }
}


async function buscarScript(folderPath, conexion, nombreSP, proyecto = undefined) {
  let file;
  let fileProyecto;

  //Si esta cargado un proyecto
  //Busca por "nombresp.sql", si existe un "nombresp.proyecto.sql", devolvera ese archivo

  await new Promise((resolve, reject) => {
    readdirp(path.join(process.cwd(), folderPath, conexion))
      .on('data', (entry) => {
        if (entry.path.slice(0, -4).toLowerCase() === nombreSP.toLowerCase()) {
          file = entry
          if (!proyecto) resolve()
        } else if (proyecto && entry.path.slice(0, -4).toLowerCase() === (nombreSP + '.' + proyecto).toLowerCase()) {
          fileProyecto = entry
          resolve()
        }
      })
      .on('end', () => {
        resolve()
      })
  })
  return fileProyecto ?? file
}


module.exports = {
  downloadStoredProcedures,
  downloadAllStoredProcedures,
  getPool,
  getProcedureDefinition,
  loadScriptsFromFolder,
  buscarScript
}
