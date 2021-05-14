# insomniaToPostmanFormat
Convert Insomnia request data to Postman-compatible format  
  
Main discussion: https://github.com/Kong/insomnia/issues/1156#issuecomment-780804602
  
```
npm install
node convertJsonFile.js <Insomnia Requests Export json File>
```

Somewhat rudimentary right now (convertJsonFile.js)...  
Runs with NodeJS  
Currently it covers basic uses cases
Input = Insomnia export json; Output = Postman collection json (having a name ending with PostmanCollection.json)
Tested with: node = v10.23.0; npm = 6.14.8 (I know... I am stuck with the older ones due to my codebase)  

---

P.S. I have observed that for small amount of requests, copying individually through curl format is good enough. Though, it doesn't capture the request name. You don't have to be logged into Postman and expose your data either.