#!/bin/bash
set -e -o pipefail
die () { printf '\n\tERROR: %s\n\n' "$*"; exit 1; }

#
# -1. Old versions of npm omit random files due to race condition https://git.io/vooV3
#
equalOrNewer () { # inspired by http://stackoverflow.com/a/25731924/362030
  printf '%s\n%s\n' "$@" | sort -cnrt . -k 1,1 -k 2,2 -k 3,3 2>/dev/null
}
npm_v="$(npm -v)"
if echo "$npm_v" | grep -q '^2\.'; then
  equalOrNewer "$npm_v" 2.15.8 \
    || die 'Your npm@2 version must be >=2.15.8, see https://git.io/vooV3'
else
  equalOrNewer "$npm_v" 3.10.1 \
    || die 'Your npm@3 version must be >=3.10.1, see https://git.io/vooV3'
fi

#
# 0. Clean tree & repo state except for CHANGELOG
#
files="$(git diff --name-only HEAD)"
test "$files" \
  || { echo 'First, you must add an entry to CHANGELOG.md'; exit 1; }
test "$files" = CHANGELOG.md \
  || die 'You have uncommitted changes other than to CHANGELOG.md'
test "$(git rev-parse --abbrev-ref HEAD)" = master \
  || die 'You must be on master'
test "$(git rev-list --count @{upstream}..)" = 0 \
  || test "$1" = --allow-unpushed-commits \
  || die "You have unpushed commits (do $0 --allow-unpushed-commits to continue anyway)"

#
# 1. Bump package.json version
#
change_summary="$(git diff HEAD | grep '^+' | sed -n '2 s/^+## // p')"
version="$(echo "$change_summary" | sed 's/:.*//')"
git cat-file -e "$version" 2>/dev/null \
  && die "$version already exists"
npm version "$version" --no-git-tag-version >/dev/null
echo "1. Bumped package.json version to \""$(node -p 'require("./package.json").version')"\""

#
# 2. Build
#
echo '2. make:'
make 2>&1 | sed 's/^/     /'

#
# 3. Package as tarball + zipfile
#
tarball=$(npm pack) # create tarball
tar -xzf $tarball # extract tarball as package/
zipfile=${tarball%.tgz}.zip
zip -qrX $zipfile package # create zipfile from package/
echo "3. Collected release files into package/, packed as $tarball and $zipfile"

#
# 4. Commit
#
git add CHANGELOG.md package.json
git commit -m "$change_summary" | sed '1 s/^/4. Committed: /; 2,$ s/^/              /'

#
# 5. Record shrinkwrap
#
npm shrinkwrap --dev | sed 's/^/5. /'
shrinkwrap="$(<npm-shrinkwrap.json)"
rm npm-shrinkwrap.json

#
# 6. Tag
#
{
  echo "$change_summary"
  echo
  echo Created automatically by: $0
  echo
  echo npm-shrinkwrap.json:
  echo "$shrinkwrap"
} | git tag -F - $version
echo "6. Tagged $version"

#
# Done!
#
echo
git status -sb
echo After double-checking the build/package/commit/tag, run script/push-release.sh to publish the release
