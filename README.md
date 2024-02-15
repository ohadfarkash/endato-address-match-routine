# Phone Finder
A NodeJS application designed to ease to automate the collection of phone numbers for contact enrichment. This application utilizes web scraping methods to collect data from [usphonebook.com](https://www.usphonebook.com/).

## Installation

**Prerequisites**
NodeJS is required to run this applications. It can be downloaded [here](https://nodejs.org/en/download).

**Downloading the applicaiton**
Start by downloading the application, which can be done by either downloading the [zip file](https://github.com/ohadfarkash/phone-finder/archive/refs/heads/master.zip) or cloning the repository.

Once the application files are loaded to a directory, the user must double click on the `setup.bat` file to complete the installation process.

## Usage
**Making sure your workfile is correct**
It is important to only process files which have the specific headers defined for use with this application. If the headers differ in any way (even in case, or having extra space before or after), the application may behave in unpredictable ways. Because of this, a template file has been included in the documentation for this application. It can be found at [/docs/template.xlsx](docs/template.xlsx). If needed, copy the headers from this template to be certain your headers are correct.

The following formats can be processed by this application:
- XLSX (MS Excel 2010+)
- CSV (Comma Separated Values)
- TSV (Tab Separated Values)

**How to process the file**
Click and drag files into the `start.bat` file. This will launch the application with that file's path set as the workfile.

If you find it difficult to have both windows open, you can optionally launch `start.bat` without a file, by double clicking on it. Then, you can drag the file into the console and hit the <kbd>Enter</kbd>.

Once the file is found, the application will open a browser window and begin the scraping process. There will be an initial Cloudflare verification. You may need to manually verify this by checking the box, if it does not go through automatically. After this, the program will sense access and take over. Make some tea, sit back, relax, and peek from time to time to make sure all is well.

**Suggested practices for usage**
This application relies on the use of a chromium browser instance. In short, this is an internet browser application, open in such a way that we can interact with it through code. To guarantee the highest level of clearance through security measures, we must keep the browser open. Likewise, the browser application should remain in the forefront, and be given priority on the desktop environment.

To make things simple, here is a checklist:
- [x] The device (laptop) is plugged into a charger.
- [x] The browser window is on top of all the other windows.
- [x] Device is set to stay awake for the duration of the application's running time.

## Configuration
The configuration file `app.config.json` can be found in the root directory of the application (same folder as `start.bat`). It can be modified using any basic text editor application. Changes only apply the next time you run the application.
|Property|Default|Description|
|-|-|-|
|output_type|xlsx|Output file type (by file extension)<br>Commonly: xlsx, tsv, csv|
|min_cooldown_time|20000|The minimum time to wait in milliseconds|
|max_cooldown_time|50000|The maximum time to wait in milliseconds|

### Cool Down Time
Cool down time is important, as it decreases your request rate to the site being scraped, and thus deceases your footprint on that site's security system. The program will choose, at random, some number between the min and max values in the configuration. This cool down time will be applied every time the program requests search results for a single permutation.

## Further Reading
[Development Docs](/docs/index.md)