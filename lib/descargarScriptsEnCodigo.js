const path = require('path')
const fs = require('fs')
var ProgressBar = require('progress');

const { analyzeSPsFromCode } = require("./analyzeSPsFromCode");
const { getProcedureDefinition } = require("./getProcedure");



async function descargarScriptsEnCodigo(folderName, ignoreFolders = undefined) {

  let { missingScriptNames } = await analyzeSPsFromCode(folderName, ignoreFolders)


  let total = Object.keys(missingScriptNames).reduce((acc, val) => { return missingScriptNames[val].size + acc }, 0)

  console.log(total)

  const bar = new ProgressBar(':bar [:current/:total] :percent :etas', { total }); // Create a progress bar

  let errors = {}

  await Promise.all(Object.keys(missingScriptNames).map(async conexion => {
    if (!missingScriptNames[conexion]) return

    if (!fs.existsSync(path.join(folderName, conexion))) {
      fs.mkdirSync(path.join(folderName, conexion), { recursive: true });
    }

    for (const procedureName of Array.from(missingScriptNames[conexion])) {
      try {
        const procedureDefinition = await getProcedureDefinition(conexion, procedureName)
        procedureDefinition = normalizeText(procedureDefinition);
        const filePath = path.join(folderName, conexion, `${procedureName}.sql`);
        fs.writeFileSync(filePath, procedureDefinition);
      } catch (error) {
        if (!errors[conexion]) {
          errors[conexion] = []
        }
        errors[conexion].push(procedureName)
      }
      bar.tick();
    }
  }))



}

exports.descargarScriptsEnCodigo = descargarScriptsEnCodigo