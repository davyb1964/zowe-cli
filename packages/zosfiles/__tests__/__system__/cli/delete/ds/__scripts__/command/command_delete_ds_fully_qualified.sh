#!/bin/bash
dsn=$1
forsure=$2
HOST=$3
PORT=$4
USER=$5
PASS=$6
zowe zos-files delete data-set "$dsn" $forsure --host $HOST --port $PORT --user $USER --pass $PASS --ru=false
exit $?