function generateNamePairs(concat_firstname, concat_lastname) {
    let first_names = concat_firstname.split(' ')
    let last_names = concat_lastname.split(' ')

    let deadlocked = false
    while (last_names.length > first_names.length) {
        let new_last_names = []
        for (let i = 0; i < last_names.length; i++){
            let current = last_names[i]
            let next = last_names[i + 1]
            if ((next && !current.includes(' ') && current <= next) || deadlocked) {
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
    console.log(last_names)
    
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
    return pairs
}
  
  // Example usage
  const firstNames = "ANDRES";
  const lastNames = "TRINIDAD GUERRERO";
  const namePairs = generateNamePairs(firstNames, lastNames);
  console.log(namePairs);
  // Output:
  // [
  //   { firstname: "JOE", lastname: "SMITH" },
  //   { firstname: "SAM", lastname: "JOHNSON" }
  // ]
  