#!/bin/bash
set -e
if [ $# -ne 1 ]; then
    echo "Provide version as the first argument."
    exit 2
fi

VERSION=$1

make
git add -f build
git commit -m "Add distributable files for version $VERSION"
git tag "$VERSION"
git push --tags
git reset --hard HEAD~1
echo "Created and pushed the version tag '$VERSION'."
