#!/bin/bash
clear

echo "Welcome to Easy GitHub Hosts Launcher"
echo "Version 1.0"
echo

if [ "$EUID" -ne 0 ]; then 
    echo "Requesting administrative privileges..."
    sudo "$0" "$@"
    exit $?
fi

echo "Running on directory: $(pwd)"
echo "Changing directory to script location..."
cd "$(dirname "$0")"
echo "Now running on directory: $(pwd)"

JS_FILES=("main.js" "updateHosts.js" "ipFetcher.js")
for file in "${JS_FILES[@]}"; do
    if [ ! -f "$file" ]; then
        echo
        echo "Error: $file not found."
        echo "Please make sure you have the $file file in the same directory as this script."
        exit 1
    fi
    chmod +x "$file"
done

if [ ! -f "main.js" ]; then
    echo
    echo "Error: main.js not found."
    echo "Please make sure you have the main.js file in the same directory as this script."
    exit 1
fi

while true; do
    echo
    echo "Select an option:"
    echo
    echo "1. Update GitHub Hosts"
    echo "2. Restore Original Hosts"
    echo "3. Exit"
    echo
    read -p "Enter your choice (1-3): " choice
    
    case $choice in
        1)
            node main.js update
            break
            ;;
        2)
            node main.js restore
            break
            ;;
        3)
            break
            ;;
        *)
            echo "Invalid choice. Please try again."
            ;;
    esac
done

echo
echo "Press Enter to exit..."
read -r