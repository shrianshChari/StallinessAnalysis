# StallinessAnalysis
### How to Use:
Create a folder in the root directory called `data`. Then, run:
```bash
npm start <path/to/filename>
```
and the code will analyse the stalliness of the team you have given (and the file contains your team copied from Pokemon Showdown).

##### Crappy beta argument thingy

To adjust the generation which is getting analyzed, include the number after the filename (1-8). The default gen is 8:
```bash
npm start <path/to/filename> <gen \#>
```
if you're analyzing a team for Brilliant Diamond and Shining Pearl, you should analyze with respect to generation 7, not 8 (unless gen 1-4 mons got stat buffs after USUM).

Also, if you include the word `verb` after the rest of the arguments, then the program will tell you more info about the calculation process.

### WIP
- Explanation of [Antar's work](https://pokemetrics.wordpress.com/)
- Update analysis with latest moves
- Gettings [yargs](https://yargs.js.org/) working
