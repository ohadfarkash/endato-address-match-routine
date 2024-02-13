# Development Documentation
## Documentation Contents
- [Development Journal](journal.md)

## Usage Cycle
1. User runs program with parameter pointing to input document.
2. Program reads input document and organizes lines into records data.
3. Records are iterated.
    a. Record is matched with full address.
    b. If full address fails, partial address is used.
    c. If match is made, phone numbers are extracted and appended to record. Record is marked as matched
4. New output file is generated and placed in output directory.
