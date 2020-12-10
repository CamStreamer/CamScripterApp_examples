# CamScripterApp_examples
Example packages for CamScripter Acap application.
## Package Structure
In source form the package should have the following structure:
```
packagename/
├── html
│   ├── other_ui_files_or_dirs
│   ├── index.html
│   └── index.js
├── localdata
│   └── settings.json
├── main.js
├── manifest.json
├── package.json
└── package-lock.json
```

`settings.json` are required to be located in `/localdata` directory.

If your application depends on other libraries you should include them in proper place in the directory structure
## What makes package a package
### html
`index.html` contains decription of application's UI.
`index.js` contains code controling information flow from UI to settings.
Optionaly this directory can contain other files on which either `index.html` or `index.js` is dependent.
### localdata
`settings` file must be located here.
The directory can be used by aplication to store useful data between runs. 
However mind that camera has limited memory capacity and other aplications might be running alongside yours.
### main.js
main.js contains runtime of the application.
The application should (optimaly but optionaly) load `settings.json` file in it's beggining.
When settings are changed in UI, CamScripter will run the application anew.
For additional information checkout [CamScripter API documentation](https://camstreamer.com/camscripter-api1)
### manifest.json
The manifest.json is required in each package. The file contains a json object with the following attributes:
package_name, package_menu_name, package_version, vendor, required_camscripter_version, ui_link is link to UI (optional) 
### package.json
Standart npm file for handling external dependencies.
[npm documentation](https://docs.npmjs.com/cli/v6/configuring-npm/package-json) 

## Resolving npm dependencies
After obtaining the application run the following command in the application directory to install all dependencies:
```
npm install
```
Command has to be run in Node.js command prompt. First change the working directory to place where application is placed via `cd` command and run `nmp install`.
[Node.js download page](https://nodejs.org/)

## Uploading to CamScripter
CamScripter accepts only packages wraped as a `.zip` file.
In it's release form package should have following structure:
```
packagename.zip/
├── html
│   ├── other_ui_files_or_dirs
│   ├── index.html
│   └── index.js
├── localdata
│   └── settings.json
├── main.js
├── manifest.json
├── [node_modules]
├── package.json
├── package-lock.json
└── ...
```
To realse run this command in your package directory:
```bash
zip -r ../packagename.zip *
```
!!DO NOT USE `zip -r packagename.zip packagename/*` FROM OVERARCHING DIRECTORY. It will result in wrong directory structure!
It should be noted `node_modules` directory will be created by npm automaticaly and should not ever be part of commit to this repository.
