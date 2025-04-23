#!/bin/bash

# Disable the problematic DBUS messages
export ELECTRON_NO_ATTACH_CONSOLE=1

# Use node to execute electron directly instead of using the electron binary
node_modules/.bin/electron . "$@" || echo "Electron exited with code $?" 