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
