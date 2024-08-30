let inquirer = require('inquirer').default;
inquirer = require('inquirer')


async function seleccionarPrompt(array, title = 'Seleccionar', getNameCallback, multiple) {
    function transformToChoices(arr) {
        return arr.map((item) => {
            if (typeof item === 'object' && getNameCallback) {
                return {
                    name: getNameCallback(item),
                    value: item,
                }
            } else if (typeof item === 'string' || typeof item === 'number') return item
        });
    }

    let rta = await inquirer.prompt({
        type: multiple ? 'checkbox' : 'list',
        name: 'list',
        message: title,
        pageSize: 15,
        choices: transformToChoices(array),
    });

    return rta.list;
}


module.exports = {
    seleccionarPrompt
}