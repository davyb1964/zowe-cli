#!/usr/bin/env bash
rm -f $HOME/.local/share/keyrings/*
echo -n "test" | gnome-keyring-daemon --unlock
cd packages/secrets && npm run test
