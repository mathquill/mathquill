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
git checkout gh-pages
git reset --hard master
make
git add -f build
git commit -m "Add distributable files for version $VERSION"
git tag "$VERSION"
git push --force-with-lease
git push --tags
git checkout -
echo "Created and pushed the version tag '$VERSION'."
