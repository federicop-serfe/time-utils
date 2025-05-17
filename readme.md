## What is it

Google Apps Script + Google Sheets tool for time estimation and tracking of my software projects at Serfe.

#### Time estimation

Uses the three point estimation method, which relies on best case, most likely and worst case estimates to provide an overall estimate for a given task.

#### Time tracking

Time used on each task is provided as start and end timestamps. Later, these times are balanced out through two possible "strategies":

- LPBalancer: attempts to model the problem as linear programming problem to try to solve it through the simplex linear optimization algorithm.
- BestEffortBalancer: ad hoc algorithm that serves as a fallback to LPBalancer in case no feasible solution found.

After balancing, times are distributed across the working days of the week with another algorithm implemented inside the class TimeDistributer.
In case you don't like the result, just change the "E" (estimated time) input parameter of one or more tasks and hit "Compute" again.

#### Supporting modules

- SpreadsheetIOAdapter: provides a simpler and more powerful API to read and write data to Google Sheets.
- TimeConverter: converts between hours/minutes and minutes-only formats.
- GeneralUtils: provides utility functions like matrix manipulation.

#### Testing

I've personally used the tool for about six months now (5/17/2025). Additionally, a suite of 42 passing unit tests is provided. Run:

> npm test

## How to use

1. Make a copy of the following spreadsheet: https://docs.google.com/spreadsheets/d/1OMK4w6ItuPVPR-wnJpoD2TQDLGCBKpk78b9xRkcKVrU/edit?usp=sharing
2. Grant the script authorization access to your google account

#### Alternate route:

1. Clone repository:
   > git clone https://github.com/federicop-serfe/time-utils.git
2. Install project's dependencies:
   > npm install
3. Upload the TimeUtils.xlsx file to google drive. Make sure is a gsheets file.
4. Inside the spreadsheet, go to Extensions > Apps Script > Project Settings > Script ID > Copy. Paste it in "scriptId" inside .clasp.json
5. Login with clasp:
   > clasp login
6. Push local changes:
   > clasp push
7. If the buttons don't work, link them again to the corresponding entryPoint functions by right clicking them > Three dots > Assing Script > write name of the function > Ok
