const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

async function openMeldFileVsContent(filePath, content) {

    let tmpPath = './tmp/ddbbscript.sql'

    if (!fs.existsSync('./tmp/')) {
        fs.mkdirSync('./tmp/', { recursive: true });
    }

    fs.writeFileSync('./tmp/ddbbscript.sql', content);

    const cmd = `meld ${filePath} ${tmpPath}`

    await new Promise((resolve) => {
        exec(cmd, (error, stdout, stderr) => {
            if (error) {
                console.error(`Error: ${error.message}`);
            }
            if (stderr) {
                console.error(`Error: ${stderr}`);
            }

            resolve()
        })
    })

    content = fs.readFileSync(tmpPath, 'utf-8')

    fs.unlinkSync(tmpPath)
    setTimeout(() => {
        try {
            fs.unlinkSync('./tmp')
        } catch (error) {
            //
        }
    }, 200)


    return { content, fileContent: fs.readFileSync(filePath, 'utf-8') }

}



module.exports = {
    openMeldFileVsContent
}