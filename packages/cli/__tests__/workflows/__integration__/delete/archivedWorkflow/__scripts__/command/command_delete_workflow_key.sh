#!/bin/bash
wk=$1
set -e

echo "================Z/OS WORKFLOWS DELETE ARCHIVED-WORKFLOW ==============="
zowe zos-workflows delete archived-workflow
if [ $? -gt 0 ]
then
    exit $?
fi