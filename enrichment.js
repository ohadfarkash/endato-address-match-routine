const requestEnrichment = require("./request")

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
 * Takes a raw record (row) and attempts to populate it with phone numbers.
 */
async function enrichRecord(record) {
    record["COMPLETED (USE INITIALS OR 'X')"] = 'X'

    let name_pairs = GenerateNamePairs(record.FIRSTNAME, record.LASTNAME)

    for (let name_pair of name_pairs) {
        // Full post data including complete address
        let postData_full = JSON.stringify({
            "FirstName": name_pair.firstname,
            "LastName": name_pair.lastname,
            "Address": {
                "addressLine1": record.ADDRESS,
                "addressLine2": `${record.CITY}, ${record.STATE}`
            }
        })

        // Partial post data with only state, no full address
        let postData_partial = JSON.stringify({
            "FirstName": name_pair.firstname,
            "LastName": name_pair.lastname,
            "Address": {
                "addressLine1": "",
                "addressLine2": record.STATE
            }
        })

        let res = JSON.parse(await requestEnrichment(postData_full))
        if (!res.person) {
            res = JSON.parse(await requestEnrichment(postData_partial))
        }
        if (res.person) {
            record.PHONE1 = res.person.phones[0]?.number || ''
            record.PHONE2 = res.person.phones[1]?.number || ''
            record.PHONE3 = res.person.phones[2]?.number || ''

            return record
        }

    }
    record.PHONE1 = 'X'
    return record
}

module.exports = enrichRecord
