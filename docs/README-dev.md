# Easy GitHub Hosts - Development Guide

This document provides a detailed guide for developers who wish to understand, modify, or contribute to the Easy GitHub Hosts project.

## Table of Contents

1. [Project Structure](#project-structure)
2. [Installation](#installation)
3. [Usage](#usage)
4. [Scripts](#scripts)
5. [Development Workflow](#development-workflow)
6. [Code Overview](#code-overview)
   - [ipFetcher.js](#ipfetcherjs)
   - [updateHosts.js](#updatehostsjs)
   - [restoreHosts.js](#restorehostsjs)
   - [main.js](#mainjs)
7. [Contributing](#contributing)
8. [License](#license)

## Project Structure

The project has the following structure:

easy-github-hosts/  
├── .github/  
│ ├── bug_report.md  
│ ├── feature_request.md  
├── docs/  
│ ├── README.md  
│ ├── README-dev.md  
├── ipFetcher.js  
├── main.js  
├── package.json  
├── restoreHosts.js  
├── updateHosts.js  

- **.github/**: Contains the issue template files.
  - **bug_report.md**: Yes! It for bug report issue.
  - **feature_request.md**: Yes! It for feature request issue.
- **docs/**: Contains the documentation files.
  - **README.md**: Provides general information and usage instructions.
  - **README-dev.md**: This development guide.
- **ipFetcher.js**: Contains functions to fetch the IP addresses for GitHub-related domains.
- **main.js**: The main entry point for the program.
- **package.json**: Manages project dependencies and scripts.
- **restoreHosts.js**: Contains functions to restore the original `hosts` file.
- **updateHosts.js**: Contains functions to update the `hosts` file with new IP addresses.

## Code Overview

### ipFetcher.js

This file contains the logic to fetch IP addresses for a list of GitHub-related domains using axios and cheerio:  

**getIP(host)**: Fetches the IP address for a given host.  
**getIPs()**: Fetches IP addresses for all predefined GitHub-related domains.  


### updateHosts.js  
This file contains the logic to update the hosts file:  

**checkIPv4(IP)**: Checks if a string is a valid IPv4 address.  
**parseHostsRecord(record)**: Parses a single record from the hosts file.  
**getHostsRecords(content)**: Parses all records from the hosts file.  
**getHostsRecordIndexByHost(records, host)**: Finds the index of a record by host.  
**genHosts(records)**: Generates the content for the hosts file from records.  
**createBackup(hostsPath)**: Creates a backup of the hosts file.  
**updateHosts()**: Main function to update the hosts file.  

### restoreHosts.js  
This file contains the logic to restore the original hosts file from a backup:  

**restoreHosts()**: Main function to restore the hosts file from a backup.  

### main.js  
This file serves as the entry point for the program. It imports and runs the updateHosts function from updateHosts.js.

## Contributing
Contributions are welcome! Please follow these guidelines:  

Fork the repository.  
Create a new branch for your feature or bug fix.  
Commit your changes with a descriptive message.  
Push your branch to your fork.  
Submit a pull request to the main repository **(dev branch)**.  
