function generateNamePairs(concat_firstname, concat_lastname) {
    let first_names = concat_firstname.split(' ')
    let last_names = concat_lastname.split(' ')
    let deadlocked_last_names = []

    let deadlocked = false
    while (last_names.length > first_names.length) {
        let new_last_names = []
        for (let i = 0; i < last_names.length; i++){
            let current = last_names[i]
            let next = last_names[i + 1]
            if ((next && !current.includes(' ') && current <= next) || deadlocked) {
                if (deadlocked || current.length > 3) { // Will cache deadlocked names, and names that are unlikely pairs
                    deadlocked_last_names.push(current)
                    deadlocked_last_names.push(next)
                }

                deadlocked = false
                new_last_names.push(current + ' ' + next)
                i++;
            } else {
                new_last_names.push(current)
            }
        }
        if (last_names.length == new_last_names.length) {
            deadlocked = true
        }
        last_names = new_last_names
    }
    
    // Concatinated
    let pairs = []
    for (let i = 0; i < first_names.length; i++) {
        let firstname = first_names[i]
        let lastname = last_names[i]
        if (lastname) {
            pairs.push({firstname, lastname})
        } else {
            lastname = last_names[last_names.length - 1]
            pairs.push({firstname, lastname})
        }
    }

    // Dead Locked
    for (let firstname of first_names){
        for (let lastname of deadlocked_last_names) {
            pairs.push({firstname, lastname})
        }
    }
    return pairs
}
  
  // Example usage
  const firstNames = "ELTON JOEN";
  const lastNames = "DE SOUZA MCLELLAN TAVARES";
  const namePairs = generateNamePairs(firstNames, lastNames);
  console.log(namePairs);
  // Output:
  // [
  //   { firstname: "JOE", lastname: "SMITH" },
  //   { firstname: "SAM", lastname: "JOHNSON" }
  // ]
  