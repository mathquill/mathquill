#!/bin/bash

if [ $# -ne 1 ]; then
    echo "Provide version as the first argument."
    exit 2
fi

VERSION=$1

git ls-remote --tags 2>/dev/null | grep "refs/tags/$VERSION$" 1>/dev/null

if [ $? -eq 0 ] || [ $(git tag -l "$VERSION") ]; then
    echo "Tag '$VERSION' already exists."
    exit 1
fi

set -e
make
git add -f build
git commit -m "Add distributable files for version $VERSION"
git tag "$VERSION"
git push --tags
git reset --hard HEAD~1
echo "Created and pushed the version tag '$VERSION'."
