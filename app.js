const api = require('api')
const sdk = api('https://devapi.endato.com/PersonSearch');
const fs = require('fs');

sdk.search({
    FirstName: 'JOHN',
    MiddleName: '',
    LastName: 'PINNEL',
    Addresses: [{ State: 'FL' }]
}, {
    'galaxy-ap-name': '7e74f316-6c77-447c-8f59-4704428bb280',
    'galaxy-ap-password': '8819158dbf0d4e319c7cf6cb035965f9',
    'galaxy-search-type': 'Person',
    'galaxy-client-type': 'nodejs'
})
    .then(({ data }) => {
        if (data) {
            console.log('data exists')
            fs.writeFile('res.json', jsonString, cb => {
                console.log('data written')
            });
        }
    })
    .catch(err => console.error(err));