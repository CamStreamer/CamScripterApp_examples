const fs = require('fs');

const readFile = (filename) => {
    return new Promise((resolve, reject) => {
        fs.readFile(filename, 'utf8', (err, data) => {
            if (err) reject('File not found ' + err.toString());
            console.log('OK: ' + filename);
            resolve(data);
        });
    });
};

const writeFile = (filename, data) => {
    return new Promise((resolve, reject) => {
        fs.writeFile(filename, data, 'utf8', (err) => {
            if (err) reject(err.toString());
            resolve();
        });
    });
};

const getScriptFileNamesFromHtml = (html) => {
    if (!html) throw new Error('No HTML to parse.');

    const reg1 = /<script defer="defer" src="([^"]+)"><\/script>/g;
    const scripts = html.match(reg1);

    const reg2 = /(?<=src=").*(?=")/;
    return scripts.map((script) => script.match(reg2)[0]);
};

const getReactHTMLCode = async () => {
    try {
        const mainPath = './build';
        const html = await readFile(mainPath + '/index.html');

        const scriptNames = getScriptFileNamesFromHtml(html);
        const scriptPromises = scriptNames.map((file) => readFile(mainPath + file));
        const codes = await Promise.all(scriptPromises);

        await writeFile('../html/assets/js/react.min.js', codes.join(';\n'));

        console.log('SUCCESS');
    } catch (e) {
        console.log(e);
    }
};

getReactHTMLCode();
