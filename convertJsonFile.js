/* todo

* auth
* multiple workspaces; environment
* keep order
* 'Docs' export
* unhandled types of request data (yaml, edn and graph query)
* add a dummy req containing info and directions wrt the generator script, env. aspect etc.
* remove extra maps[1]; try removing intermediate folders

*/

/* relevant notes

* postman schema: https://schema.postman.com (v2.1.0 relevant here)
* insomnia schema:
            code: https://github.com/Kong/insomnia/tree/develop/packages/insomnia-app/app/models
            documentation i found: https://support.insomnia.rest/article/172-importing-and-exporting-data (doesn't seem to be fully in sync. e.g. authentication.type isn't mentioned as of 14May2021)
* postman vs insomnia: as per postman convention, collections have only one top level folder
* har as input wud be more stable as opposed to postman collection schema but doesn't have folder support - i.e. batch import works, but no folders
* openapi spec as input? can't have folders/hierarchy in that tho.
* wud target to add this export functionality to insomnia itself; plugin approach might be good too

*/

/*** *** ***/

// https://tutorialedge.net/nodejs/reading-writing-files-with-nodejs/
// https://nodejs.org/api/fs.html#fs_fs_readfilesync_path_options
const fs = require("fs");
const {v4: uuidv4} = require('uuid')

const inputFileName = process.argv.length > 2 ? process.argv[2] : undefined;
if(inputFileName === undefined) {
    console.error("Input file not provided!!! Exiting.");
    return;
}

function transformUrl(insomniaUrl) {
    if (insomniaUrl === '') return {};
    var postmanUrl = {};
    postmanUrl.raw = insomniaUrl;
    var urlParts = insomniaUrl.split(/\:\/\//);
    if (urlParts[1] === undefined) {
        urlParts.push(urlParts[0]);
        urlParts[0] = 'http';
    }
    postmanUrl.protocol = urlParts[0];
    // https://stackoverflow.com/questions/4607745/split-string-only-on-first-instance-of-specified-character
    const hostAndPath = urlParts[1].split(/\/(.+)/);
    postmanUrl.host = hostAndPath[0].split(/\./);
    postmanUrl.path = hostAndPath[1] === undefined ? [] : hostAndPath[1].split(/\//);
    return postmanUrl;
}

function transformHeaders(insomniaHeaders) {
    var outputHeaders = [];
    insomniaHeaders.forEach(element => {
        var header = {};
        header.key = element.name;
        header.value = element.value;
        outputHeaders.push(header)
    });
    return outputHeaders;
}

function transformBody(insomniaBody) {
    var body = {};
    switch (insomniaBody.mimeType) {
        case "":
        case "application/json":
        case "application/xml":
            body.mode = "raw";
            body.raw = insomniaBody.text;
            break;
        case "multipart/form-data":
            body.mode = "formdata";
            body.formdata = [];
            insomniaBody.params.forEach(param => {
                body.formdata.push({key: param.name, value: param.value});
            });
            break;
        case "application/x-www-form-urlencoded":
            body.mode = "urlencoded";
            body.urlencoded = [];
            insomniaBody.params.forEach(param => {
                body.urlencoded.push({key: param.name, value: param.value});
            });
            break;
        case "application/octet-stream":
            body.mode = "file";
            body.file = {};
            body.file.src = "/C:/PleaseSelectAFile";
            console.log("A file is supposed to be a part of the request!!! Would need to be manually selected in Postman.");
            break;
        default:
            console.error("Body type unsupported; skipped!!! ... " + insomniaBody.mimeType);
            body.mode = "raw";
            body.raw = "github.com/Vyoam/InsomniaToPostmanFormat: Unsupported body type "+insomniaBody.mimeType;
            break;
    }
    return body;
}

function transformItem(insomniaItem) {
    var postmanItem = {};
    postmanItem.name = insomniaItem.name;
    var request = {};
    request.method = insomniaItem.method;
    request.header = transformHeaders(insomniaItem.headers);
    if ( Object.keys(insomniaItem.body).length !== 0 ) {
        request.body = transformBody(insomniaItem.body);
    }
    request.url = transformUrl(insomniaItem.url);
    if (insomniaItem.parameters) {
        if(request.url.raw.includes("?")) {
            console.error("Query params detected in both the raw query and the 'parameters' object of Insomnia request!!! Exported Postman collection may need manual editing for erroneous '?' in url.");
        }
        request.url.query = [];
        insomniaItem.parameters.forEach(param => {
            request.url.query.push({key: param.name, value: param.value});
        });
    }
    request.auth = {}; // todo
    if ( Object.keys(insomniaItem.authentication).length !== 0 ) {
        console.error("Auth param export not yet supported!!!");
    }
    postmanItem.request = request;
    postmanItem.response = [];
    return postmanItem;
}

const rootId = "d1097c3b-2011-47a4-8f95-87b8f4b54d6d"; // unique guid for root

function generateMaps(insomniaParentChildList) {
    var parentChildrenMap = new Map();
    var flatMap = new Map();
    insomniaParentChildList.forEach(element => {
        flatMap.set(element._id, element);
        switch (element._type) {
            case "workspace":
                // 'bug': only one workspace to be selected (the last one which comes up here)
                var elementArray = [];
                elementArray.push(element);
                parentChildrenMap.set(rootId, elementArray); // in any case will select the top workspace when creating tree
                break;
            case "request":
                var elementArray = parentChildrenMap.get(element.parentId);
                if (elementArray === undefined) elementArray = [];
                elementArray.push(element);
                parentChildrenMap.set(element.parentId, elementArray);
                break;
            case "request_group":
                var elementArray = parentChildrenMap.get(element.parentId);
                if (elementArray === undefined) elementArray = [];
                elementArray.push(element);
                parentChildrenMap.set(element.parentId, elementArray);
                break;
            default:
                console.error("Item type unsupported; skipped!!! ... " + element._type);
        }
    });
    const maps = [parentChildrenMap, flatMap];
    return maps;
}

function generateTreeRecursively(element, parentChildrenMap) {
    var postmanItem = {};
    switch (element._type) {
        case "request_group":
            postmanItem.name = element.name;
            postmanItem.item = [];
            parentChildrenMap.get(element._id).forEach(child => {
                postmanItem.item.push(generateTreeRecursively(child, parentChildrenMap));
            });
            break;
        case "request":
            postmanItem = transformItem(element);
            break;
        default:
            console.error("Item type unsupported; skipped!!! ... " + element._type);
    }
    return postmanItem;
}

function getSubItemTrees(parentChildrenMap) {
    var subItemTrees = [];
    var roots = parentChildrenMap.get(rootId);
    parentChildrenMap.get(roots[0]._id).forEach(element => {
        subItemTrees.push(generateTreeRecursively(element, parentChildrenMap))
    });
    return subItemTrees;
}

function transformData(inputDataString) {

    var inputData = JSON.parse(inputDataString);
    var outputData = {
        "info": {
            "_postman_id": "",
            "name": "",
            "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
        },
        "item": []
    };

    outputData.info._postman_id = uuidv4();

    var maps = generateMaps(inputData.resources);
    var parentChildrenMap = maps[0];
    var flatMap = maps[1];

    const subItems = getSubItemTrees(parentChildrenMap);
    outputData.item.push(...subItems);

    outputData.info.name = inputFileName.slice(0, -5); // assuming extension is .json

    return JSON.stringify(outputData);

}

const data = fs.readFileSync(inputFileName, "utf-8");
const newData = transformData(data);
fs.writeFileSync(inputFileName.slice(0, -5) + ".postman_collection.json", newData);
