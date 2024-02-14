const puppeteer = require('puppeteer-extra')
const cliProgress = require('cli-progress')
const levenshtein = require('fast-levenshtein')
const app_config = require('./app.config.json')

// const { DEFAULT_INTERCEPT_RESOLUTION_PRIORITY } = require('puppeteer')
// const AdblockerPlugin = require('puppeteer-extra-plugin-adblocker')
// puppeteer.use(
//     AdblockerPlugin({
//         // Optionally enable Cooperative Mode for several request interceptors
//         //interceptResolutionPriority: DEFAULT_INTERCEPT_RESOLUTION_PRIORITY,
//         blockTrackers: true // default: false
//     })
// )
const { PuppeteerBlocker } = require('@cliqz/adblocker-puppeteer')
const fetch = require('cross-fetch')

const StealthPlugin = require('puppeteer-extra-plugin-stealth')
puppeteer.use(StealthPlugin())

/**
 * Generate an array of first and last name pair objects for all variations of the given name fields
 */
function GenerateNamePairs(concat_firstname, concat_lastname) {
    let first_names = concat_firstname.split(' ')
    let last_names = concat_lastname.split(' ')

    let pairs = []
    for (let firstname of first_names) {
        for (let lastname of last_names) {
            pairs.push({ firstname, lastname })
        }
    }
    return pairs
}


/**
 * Takes a raw records (rows) and attempts to populate them with phone numbers.
 */
async function enrichRecords(records) {
    // Progress Bar
    const bar = new cliProgress.SingleBar({
        format: 'Enriching Records {bar} {percentage}%',
        hideCursor: true
    }, cliProgress.Presets.shades_classic);

    // PREP BROWSER
    const browser = await puppeteer.launch({
        headless: false, // So user can interact with captcha
        slowMo: 10, // Slow down movements
        targetFilter: (target) => !!target.url()
    })
    const page = (await browser.pages())[0] // Select initial open tab (which somehow prevents cloudflare from catching us)

    // Enable Adblock
    PuppeteerBlocker.fromPrebuiltAdsAndTracking(fetch).then((blocker) => {
        blocker.enableBlockingInPage(page);
    })

    // Function to check for Cloudflare challenge
    const isCloudflareChallengePresent = async () => {
        // Adjust the selector based on the Cloudflare challenge you observe
        return await page.evaluate(() => {
            const challengeForm = document.getElementById('challenge-running')
            return Boolean(challengeForm)
        })
    }

    const tryFindButtonForMatchingResult = async (firstname, lastname, state) => {
        let names = await page.$$('.ls_number-text span')
        let cityStates = await page.$$('.success-wrapper-block span.ls_success-black-text[itemprop="address"]')
        // console.log(`Names: ${names.length} | CityStates: ${cityStates.length}`)
        let buttons = await page.$$('.success-wrapper-block a.ls_contacts-btn')
        for (let i = 0; i < names.length; i++) {
            let resName = await page.evaluate(el => el.innerHTML, names[i])
            let resNameSplit = resName.split(' ')
            let resFirstName = resNameSplit[0].toUpperCase()
            let resLastName = resNameSplit[resNameSplit.length - 1].toUpperCase()
            let isNameMatch = (levenshtein.get(resFirstName, firstname.toUpperCase()) <= 2) && (levenshtein.get(resLastName, lastname.toUpperCase()) <= 2)

            // console.log('\nTrying: ' + resName + ` | Firstname = ${firstname.toUpperCase()}, Lastname = ${lastname.toUpperCase()}`)

            let resCityState = await page.evaluate(el => el.innerHTML, cityStates[i])
            let resState = resCityState.split(',')[1].trim().toUpperCase()
            let isStateMatch = resState == state.toUpperCase()

            // console.log(`IsNameMatch: ${isNameMatch} | IsStateMatch: ${isStateMatch}`)
            if (isNameMatch && isStateMatch) {
                // console.log(`\nReturning Button for: ${resName}`)
                return buttons[i]
            }
        }
    }

    // Calculate Perutations
    let permutations = 0
    let time = 0
    for (let record of records) {
        let possibleNames = GenerateNamePairs(record.FIRSTNAME, record.LASTNAME).length
        time += 5 + (possibleNames * 1.8) + (app_config.max_cooldown_time / 1000)
        permutations += possibleNames
    }
    console.log(`${permutations} possible permuations of record data.\nMax enrichment time is ${Math.round(time / 60)} minutes (not including captcha verification time).\n`)

    bar.start(records.length, 0)

    const enriched_data = []
    try {
        // ITERATE ON RECORDS
        for (let record of records) {
            record["COMPLETED (USE INITIALS OR 'X')"] = 'X'

            // ITERATE ON NAME PAIRS
            let name_pairs = GenerateNamePairs(record.FIRSTNAME, record.LASTNAME)
            for (let name_pair of name_pairs) {
                await page.goto(`https://www.usphonebook.com/${name_pair.firstname.toLowerCase()}-${name_pair.lastname.toLowerCase()}/florida`)
                await new Promise(r => setTimeout(r, 2000));

                // CHECK CAPTCHA
                while (await isCloudflareChallengePresent()) {
                    await new Promise(r => setTimeout(r, 5000));
                }

                await new Promise(r => setTimeout(r, randomIntFromInterval(2000, 3000)));

                // Check if there is a search result and if the name matches
                let resultButton = await tryFindButtonForMatchingResult(name_pair.firstname, name_pair.lastname, record.STATE)
                if (resultButton) {
                    await resultButton.click()

                    await new Promise(r => setTimeout(r, randomIntFromInterval(800, 1200)));

                    if (await page.$('span[itemprop="telephone"]') !== null) {
                        let element = await page.waitForSelector('span[itemprop="telephone"]')
                        let value = await element.evaluate(el => el.textContent)
                        record.PHONE1 = value ? value.trim() : 'X'
                    }

                    await new Promise(r => setTimeout(r, 200));

                    let altPhoneNumbers = await page.$$('a[itemprop="telephone"]')
                    for (let i = 0; i < 2; i++) {
                        let pn = altPhoneNumbers[i]
                        if (pn) {
                            let value = await page.evaluate(el => el.innerHTML, pn)
                            record[`PHONE${i+2}`] = value.trim() || ''
                        }
                    }

                    await new Promise(r => setTimeout(r, 200));

                    break;
                }

                // IMPORTANT: This is the main cooldown timer. It's been set arbitrarily based on common-sense limitations.
                await new Promise(r => setTimeout(r, randomIntFromInterval(app_config.min_cooldown_time, app_config.max_cooldown_time)));
            }

            enriched_data.push(record)
            bar.increment()
        }
    } catch (error) {
        console.error(error)
        console.log('\nCritical error! Some records may have been skipped.\nDumping successful matches into output file...')
    }

    await browser.close()
    bar.stop()

    return enriched_data
}

function randomIntFromInterval(min, max) { // min and max included 
    return Math.floor(Math.random() * (max - min + 1) + min)
}

module.exports = enrichRecords