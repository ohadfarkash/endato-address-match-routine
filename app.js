const XLSX = require('xlsx')
const enrichRecord = require('./enrichment')
const cliProgress = require('cli-progress');
const { DateTime } = require("luxon");
const readline = require('readline');
const path = require('path');
const fs = require('fs');

/* ========= Load Config ========= */
const app_config = require('./app.config.json');


/* ========= Prepare Directories ========= */
const outputDir = './output'
if (!fs.existsSync(outputDir)){
    fs.mkdirSync(outputDir);
}

function generateOutputFileName(originalPath) {
    const now = DateTime.now();
    const formattedDate = now.toFormat('LL-dd-yy')
    let originalFileName = path.basename(originalPath, path.extname(originalPath))
    let outputBaseName = `${outputDir}/${originalFileName} ENRICHED ${formattedDate} `
    let outputIncrement = 0
    let outputExtension = `.${app_config.output_type}`
    while (fs.existsSync(outputBaseName + outputIncrement + outputExtension)) {
        outputIncrement++
    }
    return outputBaseName + outputIncrement + outputExtension
}

async function main() {
    /* ========= Locate Work File ========= */
    var workFilePath = ''
    const dropFilePath = process.argv[2]
    if (dropFilePath) {
        workFilePath = dropFilePath
        console.log(`Using workfile "${workFilePath}"\n`)
    } else {
        const iRead = readline.promises.createInterface({
            input: process.stdin,
            output: process.stdout
        })
        workFilePath = await iRead.question("Please enter work file path, or\ndrag and drop the file into this prompt: ")
        iRead.close()
    }

    /* ========= Parse Worksheet ========= */
    var workbook = XLSX.readFile(workFilePath);
    var first_sheet = workbook.Sheets[workbook.SheetNames[0]];
    const raw_data = XLSX.utils.sheet_to_json(first_sheet);

    const bar = new cliProgress.SingleBar({
        format: 'Enriching Records {bar} {percentage}%',
        hideCursor: true
    }, cliProgress.Presets.shades_classic);
    bar.start(raw_data.length, 0)

    const enriched_data = []
    for (let record of raw_data) {
        enriched_data.push(await enrichRecord(record))
        bar.increment()
    }
    bar.stop()

    var ws = XLSX.utils.json_to_sheet(enriched_data, {
        header: ["status", "COMPLETED (USE INITIALS OR 'X')", "PHONE1", "PHONE2", "PHONE3", "LIST", "ID", "FIRSTNAME", "MIDDLENAME", "LASTNAME", "ADDRESS", "CITY", "STATE", "ZIP", "SALEPRICE", "__EMPTY", "__EMPTY_1", "DATE OF SALE", "COUNTY"]
    })
    ws['O1'] = ''
    ws['P1'] = ''

    var wb = XLSX.utils.book_new(ws);

    let outputFileName = generateOutputFileName(workFilePath)
    try {
        XLSX.writeFile(wb, outputFileName, {
            bookType: app_config.output_type
        })
        console.log(`\nOutput file successfuly written to "${outputFileName}"`)
    } catch (err) {
        console.error("Failed to write output file!")
    }

}

main()