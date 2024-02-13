const fs = require('fs');
const https = require('https');
const app_config = require('./app.config.json');

const {RateLimiter} = require('limiter')
const limiter = new RateLimiter({ tokensPerInterval: 1, interval: 600 })

function requestEnrichment(postData) {
    return new Promise(async (resolve, reject)=>{
        const options = {
            hostname: 'devapi.endato.com',
            port: 443,
            path: '/Contact/Enrich',
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Galaxy-Ap-Name': app_config.api.key_name,
                'Galaxy-Ap-Password': app_config.api.key_password,
                'Galaxy-Client-Type': 'nodejs',
                'Galaxy-Search-Type': 'DevAPIContactEnrich',
                'Content-Length': Buffer.byteLength(postData)
            }
        };
    
        const req = https.request(options, (res) => {
            //console.log(`Status Code: ${res.statusCode}`);
            if (res.statusCode == 200){
                res.on('data', (d) => {
                    resolve(d)
                })
            } else {
                reject(res.statusCode)
            }
        })
    
        req.on('error', (e) => {
            reject(e)
        })
        
        await limiter.removeTokens(1)
        req.write(postData);
        req.end();
        // resolve(example)
    })
}

module.exports = requestEnrichment


const example = `
{
    "person": {
        "name": {
            "firstName": "John",
            "middleName": "R",
            "lastName": "Pinnel"
        },
        "age": "77",
        "addresses": [
            {
                "street": "1202 Chantilly Cir",
                "unit": "",
                "city": "Niceville",
                "state": "FL",
                "zip": "32578",
                "firstReportedDate": "5/1/2003",
                "lastReportedDate": "1/1/2024"
            },
            {
                "street": "205 Muirfield Cv W",
                "unit": "",
                "city": "Niceville",
                "state": "FL",
                "zip": "32578",
                "firstReportedDate": "8/1/2002",
                "lastReportedDate": "8/19/2010"
            },
            {
                "street": "13833 S Springs Dr",
                "unit": "",
                "city": "Clifton",
                "state": "VA",
                "zip": "20124",
                "firstReportedDate": "8/20/1997",
                "lastReportedDate": "9/9/2010"
            },
            {
                "street": "315 Bimini Way",
                "unit": "",
                "city": "Niceville",
                "state": "FL",
                "zip": "32578",
                "firstReportedDate": "7/13/2001",
                "lastReportedDate": "8/19/2010"
            },
            {
                "street": "6229 Capella Ave",
                "unit": "",
                "city": "Burke",
                "state": "VA",
                "zip": "22015",
                "firstReportedDate": "6/8/1976",
                "lastReportedDate": "1/1/2021"
            }
        ],
        "phones": [
            {
                "number": "(850) 897-3572",
                "type": "landline",
                "isConnected": true,
                "firstReportedDate": "8/1/2010",
                "lastReportedDate": "1/1/2024"
            },
            {
                "number": "(703) 631-8855",
                "type": "landline",
                "isConnected": true,
                "firstReportedDate": "4/10/2003",
                "lastReportedDate": "7/8/2003"
            }
        ],
        "emails": [
            {
                "email": "jr-capinnel@cox.net",
                "isValidated": true,
                "isBusiness": false
            }
        ]
    },
    "message": "",
    "identityScore": 100,
    "pagination": {
        "currentPageNumber": 1,
        "resultsPerPage": 1,
        "totalPages": 1,
        "totalResults": 0
    },
    "databaseQueryInfo": [],
    "searchCriteria": [],
    "totalRequestExecutionTimeMs": 125,
    "requestId": "b46775b8-f1e8-4426-b58e-135d7ad8e29c",
    "requestType": "DevAPIContactEnrich",
    "requestTime": "2024-02-12T18:44:58.1638286-08:00",
    "isError": false,
    "error": {
        "inputErrors": [],
        "warnings": []
    }
}
`