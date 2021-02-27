// todo remove extra maps[1]; try removing intermediate folders; multiple workspaces; environment
// todo keep order; unhandled types of request data

/*
insomnia v4 json export...
assume your own simple use case...
a bunch of requests put inside a folder, to be exported as a postman collection
as per postman convention,. collections have only one top level folder ... so at top level name cud be take from user ... for now will put a default
*/

// https://github.com/Kong/insomnia/issues/1156 ; postman schema

// har as input wud be more stable but doesn't have folder support - i.e. batch import works, but no folders... openapi spec? - can't have hierarchy in that ... ideally wud add all this code to insomnia internally ... or allow plugin for export import ... but i think ultimately this wud be an ongoing process with the shifting insomnia-postman internal code and format

// requisite: npm install uuid -g

// https://tutorialedge.net/nodejs/reading-writing-files-with-nodejs/
const fs = require("fs");
const { v4: uuidv4 } = require('uuid')

/* */

function transformUrl(insomniaUrl) {
  if(insomniaUrl==='') return {};
  var postmanUrl = {};
  postmanUrl.raw = insomniaUrl;
  var urlParts = insomniaUrl.split(/\:\/\//);
  if (urlParts[1]===undefined) {
    urlParts.push(urlParts[0]);
    urlParts[0]='http';
  }
  postmanUrl.protocol = urlParts[0];
  // https://stackoverflow.com/questions/4607745/split-string-only-on-first-instance-of-specified-character
  const hostAndPath = urlParts[1].split(/\/(.+)/);
  postmanUrl.host = hostAndPath[0].split(/\./);
  postmanUrl.path = hostAndPath[1]===undefined?[]:hostAndPath[1].split(/\//);
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
      body.mode = "raw";
      body.raw = insomniaBody.text;
      break;
    default:
      console.error("unsupported body type: " + insomniaBody.mimeType);
  }
  return body;
}

function transformItem(insomniaItem) {
  var postmanItem = {};
  postmanItem.name = insomniaItem.name;
  var request = {};
  request.method = insomniaItem.method;
  request.header = transformHeaders(insomniaItem.headers);
  //todo cover url params and url encoded form too... auth cases... check mimeType and process accordingly
  request.body = transformBody(insomniaItem.body);
  request.url = transformUrl(insomniaItem.url);
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
        // only one workspace to be selected (the last one which comes up here)
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
        console.error("unsupported item type: " + element._type);
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
      console.error("unsupported item type: " + element._type);
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
    "item": [
    ]
  };

  outputData.info._postman_id = uuidv4();

  var maps = generateMaps(inputData.resources);
  var parentChildrenMap = maps[0];
  var flatMap = maps[1];

  const subItems = getSubItemTrees(parentChildrenMap);
  outputData.item.push(...subItems);

  outputData.info.name = "UnnamedPostmanCollection";

  return JSON.stringify(outputData);

}

const stepWriteAfterRead = (err) => {
  if (err) {
    console.log(err);
  }
  console.log("Successfully Written to File.");
};

const stepReadFile = (err, data) => {
  if (err) {
    console.log(err)
  }
  const newData = transformData(data);
  fs.writeFile("output.json", newData, stepWriteAfterRead);
}

fs.readFile("input.json", "utf-8", stepReadFile);
