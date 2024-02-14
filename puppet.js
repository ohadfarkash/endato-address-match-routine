// puppeteer-extra is a drop-in replacement for puppeteer,
// it augments the installed puppeteer with plugin functionality
const puppeteer = require('puppeteer-extra')

// add stealth plugin and use defaults (all evasion techniques)
const StealthPlugin = require('puppeteer-extra-plugin-stealth')
puppeteer.use(StealthPlugin())

const { DEFAULT_INTERCEPT_RESOLUTION_PRIORITY } = require('puppeteer')
const AdblockerPlugin = require('puppeteer-extra-plugin-adblocker')
puppeteer.use(
  AdblockerPlugin({
    // Optionally enable Cooperative Mode for several request interceptors
    interceptResolutionPriority: DEFAULT_INTERCEPT_RESOLUTION_PRIORITY
  })
)

async function main() {
    const browser = await puppeteer.launch({
        headless: false, // Run in non-headless mode so user can interact with the CAPTCHA
        slowMo: 10, // Slow down Puppeteer operations to make them more observable to humans
        targetFilter: (target) => !!target.url()
    })
    const page = (await browser.pages())[0]
    await page.goto('https://www.usphonebook.com/people-search', { waitUntil: 'networkidle2' })

    // Function to check for Cloudflare challenge
    const isCloudflareChallengePresent = async () => {
        // Adjust the selector based on the Cloudflare challenge you observe
        return await page.evaluate(() => {
            const challengeForm = document.getElementById('challenge-running')
            return Boolean(challengeForm)
        })
    }

    // Wait for user to solve Cloudflare challenge
    console.log('Please solve the Cloudflare challenge if present...');
    while (await isCloudflareChallengePresent()) {
        await new Promise(r => setTimeout(r, 5000));
    }
    console.log('Cloudflare challenge solved, proceeding...');

    await new Promise(r => setTimeout(r, 10000));

    await page.waitForSelector('.searchform input#focusFName')
    await page.type('.searchform input#focusFName', 'JOHN PINNEL', {delay: 300})

    await page.waitForSelector('.searchform select#searchFormState')
    await page.select('.searchform select#searchFormState', 'FL')
    
    await new Promise(r => setTimeout(r, 1500));

    await page.waitForSelector('.searchform button')
    await page.click('.searchform button', {offset:{x:2, y:3}})

    await new Promise(r => setTimeout(r, 300));
    
    await page.waitForSelector('a.ls_contacts-btn')
    await page.click('a.ls_contacts-btn', {offset:{x:5, y:1}})

    await new Promise(r => setTimeout(r, 200));

    try {
        const firstNumberElement = await page.waitForSelector('span[itemprop="telephone"]')
        const firstNumber = await firstNumberElement.evaluate(el => el.textContent)
        console.log(firstNumber)
    } catch {

    }


    await new Promise(r => setTimeout(r, 20000));
    
    await browser.close()
}

main()

//ls_contacts-btn