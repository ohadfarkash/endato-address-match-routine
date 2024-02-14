
const levenshtein = require('fast-levenshtein')
const test = async () => levenshtein.get('book', 'bock') >= 2
console.log(test())