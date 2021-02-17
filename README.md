Convert Insomnia request data to Postman-compatible format  
  
Somewhat rudimentary right now (convertJsonFile.js)...  
Runs with NodeJS  
Currently it covers basic uses cases  
*Input and output file name hardcoded (you can update the last lines)*  
Input = Insomnia export json; Output = Postman collection json  
Tested with: node = v10.23.0; npm = 6.14.8 (I know... I am stuck with the older ones due to my codebase)  
