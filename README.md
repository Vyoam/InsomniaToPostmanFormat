# InsomniaToPostmanFormat
Convert Insomnia request data to Postman-compatible format

Main discussion: https://github.com/Kong/insomnia/issues/1156#issuecomment-780804602
  
```
npm install
node convertJsonFile.js <Insomnia Requests Export json File>
```

Runs with NodeJS

Currently it covers most, but not all, use cases (see todo section in convertJsonFile.js)

**Note: The plugin is now available... https://github.com/Vyoam/insomnia-plugin-postman-export; Insomnia team recommended the plugin approach when I raised the PR for direct integration.**

Input = Insomnia export json; Output = Postman collection json (output file name is the input file name suffixed with .postman_collection.json)

Tested with: node = v10.23.0; npm = 6.14.8 (I know... I am stuck with the older ones due to my codebase)  

---

P.S. I have observed that for small amount of requests, copying individually through curl format is good enough. You don't have to be logged into Postman and expose your data either. Though, it doesn't capture the request name.
