#!/bin/bash

rm *.zip

ls -1 | grep -v "\(makedist\|README.md\)" | sed -e "s/^\(.*\)$/cd \1 \&\& zip -r ..\/\1.zip * \&\& cd ../" | bash
