// const dialog = require('node-file-dialog')
// const config={type:'open-file'}
// dialog(config)
//     .then(file => console.log(file))
//     .catch(err => console.log(err))

// Read file
// Find headers
// Build records

const XLSX = require('xlsx')
const enrichRecord = require('./enrichment')

const readline = require('readline')
const iRead = readline.promises.createInterface({
    input: process.stdin,
    output: process.stdout
});

const cliProgress = require('cli-progress');

async function main(){
    /* ========= Load Config ========= */
    const app_config = require('./app.config.json')
    console.log("Config Loaded\n")
    
    /* ========= Locate Work File ========= */
    var workFilePath = ''
    const dropFilePath = process.argv[2]
    if (dropFilePath) {
        workFilePath = dropFilePath
    } else {
        workFilePath = await iRead.question("Please enter work file path, or\ndrag and drop the file into this prompt: ")
    }

    /* ========= Parse Worksheet ========= */
    var workbook = XLSX.readFile(workFilePath);
    var first_sheet = workbook.Sheets[workbook.SheetNames[0]];
    const raw_data = XLSX.utils.sheet_to_json(first_sheet);

    for (let record of raw_data){
        console.log(await enrichRecord(record))
    }


}

main()

class Record {
    completed = ''
    phone_1 = ''
    phone_2 = ''
    phone_3 = ''
    list_id = ''
    first_name = ''
    middle_name = ''
    last_name = ''
    address = ''
    city = ''
    state = ''
    zip = ''
    salesprice = ''
    empty = ''
}