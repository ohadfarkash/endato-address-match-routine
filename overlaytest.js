const puppeteer = require('puppeteer-extra')
const cliProgress = require('cli-progress')
const levenshtein = require('fast-levenshtein')
const app_config = require('./app.config.json')
const { PuppeteerBlocker } = require('@cliqz/adblocker-puppeteer')
const fetch = require('cross-fetch')

const StealthPlugin = require('puppeteer-extra-plugin-stealth')
puppeteer.use(StealthPlugin())

async function test(){
    var index = 0
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

    await page.exposeFunction('handleClick', handle)
    async function handle(){
        if (index < 5){
            index ++;
            await page.goto(`about:blank#${index}`)
            await page.evaluate(()=>{
                window.overlay_data = {}
                window.overlay_data.county_name = "Test County"
            })
    
            await page.addStyleTag({path: './overlay.css'})
            await page.addScriptTag({path: './vue.dev.js'})
            console.log("added vue")
            await page.addScriptTag({path: './overlay.js'})
        } else {
            await browser.close()
        }
    }
    handle()
}
test()