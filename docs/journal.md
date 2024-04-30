# Dev Journal
## 02-12-24 00
Development Started. Main repository initialized and method of communicating with desired endpoint found.

*Important Notes:*
- Use of OpenAPI package `api` was unsuccessful. Likey that Endato does not provide an adiquite map which follows those standards. Instead, using a builtin NodeJS http request library.

Successful request sent to `https://devapi.endato.com/Contact/Enrich` endpoint. Result json perfectly matches supplied data. Advantage of this process is the avoidence of over complication when processing larger return data from Person search. Here, Endato API processes the data under its own internal understanding of match accuracy. Could seriosuly expedite the development of this application.

*Important Links:*
 - [Writing from JS data objects](https://docs.sheetjs.com/docs/api/utilities/array)
## 02-13-24 00
Configuration should have some way to specify the outputformat from the following list of supported formats:

- xlsx
- tsv
- csv

These also being acceptable input file types.

The record enrichment process will flow like so:
1. Worksheet is extracted from file and parsed into JSON format, where headers make property keys
2. Each record is itterated and enriched
    1. Name pairs are generated for all possible names in the record
    2. Each pair is itterated over and request is sent
        1. First for full address
        2. Then for partial address (state only)
        3. If enrichment is successful return enriched record
## 02-13-24 01
Issues have been risen with the API. At around 3:00pm the API began blocking calls. After contacting multiple representatives, it was suggested that the account be "upgraded" to the paid version to aleviate the issues. Unfortunately, speaking with a sales representative did not accomplish activation of the account.

Client was informed of the situation, and is also reluctant to proceed with a different API. Options are being explored.
## 02-14-24 00
Major shift in technology used to aquire data for record enrichment. Instead of API calls, program will now use web scraping. This is to avoid charges related to API matches.

To accomplish this, puppeteer was used. Along with puppeteer is a generic adblocker and tacker blocking system, and a masking system. These aid in bypassing the Cloudflare security being used to protect the site from bots.

Along witht his major change, the system for mutating record names has changed. This is to make it more accurate, and closer align it with the actual process used by the client in matching records manually. The positive effect of this change is also a near half reduction in permutations, thus equating to double the total enrichment rate.

Client was informed of the changes and has approved use of the scraping based system. As such the branch has been moved to master, and furthur development will revolve around web scraping techniques.

The following is a rough list of remaining tasks:
- Update README
    - Add basic user guide
- Create an elapse time counter for determining how long the application took to process
- Install the application on clients browser and instruct on usage.
## 04-05-24 00
On 04-01-24 revisions for the phone-finder app were discussed. A second version will be created which will feature these fundemental revisions:
- No longer fully automiated. User now fetches numbers manually.
- Phone finder will act as an interactive aid, allowing users to collect data and navigate records quickly.
*Flow:*
1. User enters file as before. Records are read and iterated along new guidlines.
2. Records initially load the county record website for the specific row's county.
3. Overlay is loaded for each county site.
    1. User can navigate records (and county sites) by interacting with the overlay controls.
4. User enters aquired data into the overlay. Data is appended to the record and new links are generated.
5. Each record eventually ends with a search through USPhonebook and the collection of a phone number.