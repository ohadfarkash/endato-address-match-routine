const puppeteer = require('puppeteer-extra')
const cliProgress = require('cli-progress')
const levenshtein = require('fast-levenshtein')

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
        for (let i = 0; i < names.length; i++){
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
    // let permutations = 0
    // for (let record of records) {
    //     permutations += record
    // }

    bar.start(records.length, 0)

    // ITERATE ON RECORDS
    const enriched_data = []
    for (let record of records) {
        record["COMPLETED (USE INITIALS OR 'X')"] = 'X'

        // ITERATE ON NAME PAIRS
        let name_pairs = GenerateNamePairs(record.FIRSTNAME, record.LASTNAME)
        for (let name_pair of name_pairs) {
            let fullname = `${name_pair.firstname} ${name_pair.lastname}`

            // await page.goto('https://www.usphonebook.com/people-search')
            await page.goto(`https://www.usphonebook.com/${name_pair.firstname.toLowerCase()}-${name_pair.lastname.toLowerCase()}/florida`)
            await new Promise(r => setTimeout(r, 5000));

            // CHECK CAPTCHA
            while (await isCloudflareChallengePresent()) {
                await new Promise(r => setTimeout(r, 5000));
            }

            // await new Promise(r => setTimeout(r, 5000));

            // await page.waitForSelector('.searchform input#focusFName')
            // await page.type('.searchform input#focusFName', fullname, { delay: 300 })

            // await page.waitForSelector('.searchform select#searchFormState')
            // await page.select('.searchform select#searchFormState', record.STATE)

            // await new Promise(r => setTimeout(r, randomIntFromInterval(1400, 1700)));

            // await page.waitForSelector('.searchform button')
            // await page.click('.searchform button', { offset: { x: 2, y: 3 } })

            // await new Promise(r => setTimeout(r, randomIntFromInterval(3000, 4000)));

            await new Promise(r => setTimeout(r, randomIntFromInterval(1000, 2000)));

            // Check if there is a search result and if the name matches
            let resultButton = await tryFindButtonForMatchingResult(name_pair.firstname, name_pair.lastname, record.STATE)
            if (resultButton) {
                await resultButton.click()

                await new Promise(r => setTimeout(r, randomIntFromInterval(100, 200)));

                try {
                    let element = await page.waitForSelector('span[itemprop="telephone"]')
                    let value = await element.evaluate(el => el.textContent)
                    record.PHONE1 = value.trim() || 'X'
                } catch { }

                await new Promise(r => setTimeout(r, 100));

                try {
                    await page.waitForSelector('a[itemprop="telephone"]')
                    const value = await page.evaluate(
                        () => document.querySelectorAll('a[itemprop="telephone"]')[1].innerHTML
                    );
                    record.PHONE2 = value.trim() || ''
                } catch { }

                await new Promise(r => setTimeout(r, 100));

                try {
                    await page.waitForSelector('a[itemprop="telephone"]')
                    const value = await page.evaluate(
                        () => document.querySelectorAll('a[itemprop="telephone"]')[1].innerHTML
                    );
                    record.PHONE3 = value.trim() || ''
                } catch { }

                await new Promise(r => setTimeout(r, 100));

                break;
            }
        }

        enriched_data.push(record)
        bar.increment()
    }
    await browser.close()
    bar.stop()

    return enriched_data
}

function randomIntFromInterval(min, max) { // min and max included 
    return Math.floor(Math.random() * (max - min + 1) + min)
}

module.exports = enrichRecords