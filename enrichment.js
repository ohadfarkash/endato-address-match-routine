const puppeteer = require('puppeteer-extra')
const cliProgress = require('cli-progress')
const levenshtein = require('fast-levenshtein')
const app_config = require('./app.config.json')
const { PuppeteerBlocker } = require('@cliqz/adblocker-puppeteer')
const fetch = require('cross-fetch')

const StealthPlugin = require('puppeteer-extra-plugin-stealth')
puppeteer.use(StealthPlugin())

/**
 * Takes a raw records (rows) and attempts to populate them with phone numbers.
 */
async function enrichRecords(records) {
    var moveFlag = 0 // -1 = prev | 0 = stay | 1 = next

    // PREP BROWSER
    const browser = await puppeteer.launch({
        headless: false, // So user can interact with captcha
        slowMo: 10, // Slow down movements
        // args: [
        //     '--no-sandbox',
        //     '--disable-setuid-sandbox',
        //     '--disable-infobars',
        //     '--no-zygote',
        //     '--no-first-run',
        //     '--ignore-certificate-errors',
        //     '--ignore-certificate-errors-skip-list',
        //     '--disable-dev-shm-usage',
        //     '--disable-accelerated-2d-canvas',
        //     '--disable-gpu',
        //     '--hide-scrollbars',
        //     '--disable-notifications',
        //     '--disable-background-timer-throttling',
        //     '--disable-backgrounding-occluded-windows',
        //     '--disable-breakpad',
        //     '--disable-component-extensions-with-background-pages',
        //     '--disable-extensions',
        //     '--disable-features=TranslateUI,BlinkGenPropertyTrees',
        //     '--disable-ipc-flooding-protection',
        //     '--disable-renderer-backgrounding',
        //     '--enable-features=NetworkService,NetworkServiceInProcess',
        //     '--force-color-profile=srgb',
        //     '--metrics-recording-only',
        //     '--mute-audio',
        //     '--start-maximized'
        // ]
        // targetFilter: (target) => !!target.url()
    })
    const page = (await browser.pages())[0] // Select initial open tab (which somehow prevents cloudflare from catching us)

    // Enable Adblock
    // PuppeteerBlocker.fromPrebuiltAdsAndTracking(fetch).then((blocker) => {
    //     blocker.enableBlockingInPage(page);
    // })

    // Function to check for Cloudflare challenge
    const isCloudflareChallengePresent = async () => {
        // Adjust the selector based on the Cloudflare challenge you observe
        return await page.evaluate(() => {
            const challengeForm = document.getElementById('challenge-running')
            return Boolean(challengeForm)
        })
    }

    var overlay_data = {
        county_name: "",
        record_index: -1,
        first_names: [],
        middle_names: [],
        last_names: [],
        phone1: "",
        phone2: "",
        phone3: ""
    }

    const loadPage = async (href) => {
        await page.goto(href)
    }

    const injectOverlay = async () => {
        await page.evaluate((overlay_data) => {
            window.overlay_data = overlay_data
        }, overlay_data)

        await page.addStyleTag({ path: './overlay.css' })
        await page.addScriptTag({ path: './vue.dev.js' })
        await page.addScriptTag({ path: './overlay.js' })
    }

    const load_record = () => {
        let firstname = records[overlay_data.record_index]["FIRSTNAME"]
        let middlename = records[overlay_data.record_index]["MIDDLENAME"]
        let lastname = records[overlay_data.record_index]["LASTNAME"]
        overlay_data.county_name = records[overlay_data.record_index]["COUNTY"]
        overlay_data.first_names = firstname ? firstname.split(' ') : []
        overlay_data.middle_names = middlename ? middlename.split(' ') : []
        overlay_data.last_names = lastname ? lastname.split(' ') : []
        overlay_data.phone1 = records[overlay_data.record_index]["PHONE1"] || ""
        overlay_data.phone2 = records[overlay_data.record_index]["PHONE2"] || ""
        overlay_data.phone3 = records[overlay_data.record_index]["PHONE3"] || ""
    }

    const search_county = async () => {
        const countyLink = getCountyLink(overlay_data.county_name)
        loadPage(countyLink)
        // const newPage = await browser.newPage()
        // await newPage.goto(countyLink)
    }

    const next_record = async () => {
        if (overlay_data.record_index < records.length) {
            overlay_data.record_index++
            load_record()
            await search_county()
        }
    }

    const prev_record = async () => {
        if (overlay_data.record_index > 0) {
            overlay_data.record_index--
            load_record()
            await search_county()
        }
    }

    const usphonebook = async (names) => {
        let state = abbreviationToStateName(records[overlay_data.record_index]["STATE"])
        let url = `https://www.usphonebook.com/${names.join('-')}/${state}`
        loadPage(url)
    }

    const beenverified = async (fn, mn, ln) => {
        let state = records[overlay_data.record_index]["STATE"]
        let city = records[overlay_data.record_index]["CITY"]
        let mi = ""
        if (mn && mn[0]) { mi = mn[0].charAt(0) }
        let url = `https://www.beenverified.com/rf/search/person?age=&city=${city}&fname=${fn.join('%20')}&ln=${ln.join('%20')}&mn=${mi}&state=${state}`
        loadPage(url)
    }

    const save_record = async (record) => {
        overlay_data.phone1 = record.phone1
        overlay_data.phone2 = record.phone2
        overlay_data.phone3 = record.phone3
        records[overlay_data.record_index]["PHONE1"] = overlay_data.phone1
        records[overlay_data.record_index]["PHONE2"] = overlay_data.phone2
        records[overlay_data.record_index]["PHONE3"] = overlay_data.phone3
    }

    page.on("framenavigated", frame => {
        injectOverlay()
    })

    try {
        // HALT OP
        await page.exposeFunction('next_record', next_record)
        await page.exposeFunction('prev_record', prev_record)
        await page.exposeFunction('search_county', search_county)
        await page.exposeFunction('usphonebook', usphonebook)
        await page.exposeFunction('beenverified', beenverified)
        await page.exposeFunction('save_record', save_record)

        await next_record()

        while (browser.isConnected()) {
            await new Promise(r => setTimeout(r, 1000));
        }
    } catch (error) {
        console.error(error)
        console.log('\nCritical error! Some records may have been skipped.\nDumping successful matches into output file...')
        await page.screenshot({ path: 'error.png', fullPage: true })
    }

    return records
}

function randomIntFromInterval(min, max) { // min and max included 
    return Math.floor(Math.random() * (max - min + 1) + min)
}

function abbreviationToStateName(abbreviation) {
    const states = {
        AL: "Alabama",
        AK: "Alaska",
        AZ: "Arizona",
        AR: "Arkansas",
        CA: "California",
        CO: "Colorado",
        CT: "Connecticut",
        DE: "Delaware",
        FL: "Florida",
        GA: "Georgia",
        HI: "Hawaii",
        ID: "Idaho",
        IL: "Illinois",
        IN: "Indiana",
        IA: "Iowa",
        KS: "Kansas",
        KY: "Kentucky",
        LA: "Louisiana",
        ME: "Maine",
        MD: "Maryland",
        MA: "Massachusetts",
        MI: "Michigan",
        MN: "Minnesota",
        MS: "Mississippi",
        MO: "Missouri",
        MT: "Montana",
        NE: "Nebraska",
        NV: "Nevada",
        NH: "New Hampshire",
        NJ: "New Jersey",
        NM: "New Mexico",
        NY: "New York",
        NC: "North Carolina",
        ND: "North Dakota",
        OH: "Ohio",
        OK: "Oklahoma",
        OR: "Oregon",
        PA: "Pennsylvania",
        RI: "Rhode Island",
        SC: "South Carolina",
        SD: "South Dakota",
        TN: "Tennessee",
        TX: "Texas",
        UT: "Utah",
        VT: "Vermont",
        VA: "Virginia",
        WA: "Washington",
        WV: "West Virginia",
        WI: "Wisconsin",
        WY: "Wyoming"
    };

    const stateName = states[abbreviation.toUpperCase()];
    if (!stateName) {
        return "Invalid abbreviation";
    }

    return stateName.toLowerCase()
}

function getCountyLink(county) {
    const counties = {
        'ALACHUA': 'https://isol.alachuaclerk.org/RealEstate/SearchEntry.aspx',
        'BREVARD': 'https://vaclmweb1.brevardclerk.us/AcclaimWeb/search/SearchTypeSimpleSearch',
        'CITRUS': 'https://search.citrusclerk.org/LandmarkWeb/home/index',
        'FLAGLER': 'https://records.flaglerclerk.com/home/index',
        'HILLSBOROUGH': 'https://pubrec6.hillsclerk.com/ORIPublicAccess/customSearch.html',
        'INDIAN RIVER': 'https://ori.indian-river.org/home/index',
        'LAKE': 'https://officialrecords.lakecountyclerk.org/search/SearchTypeName',
        'MANATEE': 'https://records.manateeclerk.com/OfficialRecords/Search/Party',
        'MARION': 'https://nvweb.marioncountyclerk.org/BrowserView/',
        // 'ORAGE': '',
        'OSCEOLA': 'https://officialrecords.osceolaclerk.org/browserview/',
        'PALM BEACH': 'https://erec.mypalmbeachclerk.com/home/index',
        'PINELLAS': 'https://officialrecords.mypinellasclerk.org/search/SearchTypeName',
        'POLK': 'https://apps.polkcountyclerk.net/browserviewor/',
        'SARASOTA': 'https://secure.sarasotaclerk.com/OfficialRecords.aspx',
        'SEMINOLE': 'https://recording.seminoleclerk.org/DuProcessWebInquiry/index.html',
        'VOLUSIA': 'https://app02.clerk.org/or_m/inquiry.aspx',
        'BROWARD': 'https://officialrecords.broward.org/AcclaimWeb/search/SearchTypeName',
        'MIAMI-DADE': 'https://onlineservices.miamidadeclerk.gov/officialrecords/StandardSearch.aspx'
    }
    return counties[county]
}

module.exports = enrichRecords