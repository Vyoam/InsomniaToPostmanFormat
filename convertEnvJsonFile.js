const fs = require("fs");
const {
    v4: uuidv4
} = require('uuid')

const inputFileName = process.argv.length > 2 ? process.argv[2] : undefined;
if (inputFileName === undefined) {
    console.error("Error: Input file not provided!!! Exiting.");
    process.exit(1);
}

function flatObject(parentKey, jsonObject) {
    var firsLevelKeys = Object.keys(jsonObject);

    var flatted = [];
    firsLevelKeys.forEach(key => {
        if (typeof jsonObject[key] === 'string' || jsonObject[key] instanceof String) {
            flatted.push({
                "key": `${parentKey.toUpperCase()}${key.toUpperCase()}`,
                "value": jsonObject[key],
                "enabled": true
            });
        } else {
            flatted = flatted.concat(flatObject(`${key}_`, jsonObject[key]));
        }
    });

    return flatted
}

function generateMaps(insomniaEnvVars) {
    var parentChildrenMap = new Map();
    var flatMap = new Map();

    return flatObject('', insomniaEnvVars)
}

function transformData(environmentName, inputDataString) {

    var inputData = JSON.parse(inputDataString);
    var outputData = {
        "id": uuidv4(),
        "name": environmentName,
        "values": generateMaps(inputData),
        "_postman_variable_scope": "environment",
        "_postman_exported_at": new Date().toISOString(),
        "_postman_exported_using": "Postman/8.12.1"
    };

    return JSON.stringify(outputData);
}

const environmentName = inputFileName.split('.')[0];
const data = fs.readFileSync(inputFileName, "utf-8");
const newData = transformData(environmentName, data);
fs.writeFileSync(`${environmentName}.postman_environment.json`, newData);