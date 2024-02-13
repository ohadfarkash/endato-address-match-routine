const fs = require('fs');
const https = require('https');

// Define the data to send in the POST body
const postData = JSON.stringify({
    "FirstName": "JOHN",
    "LastName": "PINNEL",
    "Address": {
        "addressLine1": "",
        "addressLine2": "FL"
    }
});

// Options for the HTTPS request
const options = {
    hostname: 'devapi.endato.com',
    port: 443,
    path: '/Contact/Enrich',
    method: 'POST',
    headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Galaxy-Ap-Name': '7e74f316-6c77-447c-8f59-4704428bb280',
        'Galaxy-Ap-Password': '8819158dbf0d4e319c7cf6cb035965f9',
        'Galaxy-Client-Type': 'nodejs',
        'Galaxy-Search-Type': 'DevAPIContactEnrich',
        'Content-Length': Buffer.byteLength(postData)
    }
};

// Make the POST request
const req = https.request(options, (res) => {
    console.log(`Status Code: ${res.statusCode}`);

    res.on('data', (d) => {

        if (d) {
            console.log('data exists')
            fs.writeFile('res.json', d, cb => {
                console.log('data written')
            });
        }
        process.stdout.write(d);
    });
});

req.on('error', (e) => {
    console.error(e);
});

// Write data to request body
req.write(postData);
req.end();