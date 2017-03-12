#!/bin/bash
set -e -o pipefail
die () { printf '\n\tERROR: %s\n\n' "$*"; exit 1; }

#
# 0. Precheck that a release has been prepped (and we have an access token)
#
test "$(git rev-list --count @{upstream}..)" != 0 \
  || die 'No unpushed commits, first run script/prep-release.sh'

tagname="$(git describe --candidates=0 --match 'v*.*.*')"
test "$tagname" \
  || die 'No version tag for HEAD, first run script/prep-release.sh'

tarball="mathquill-${tagname#v}.tgz"
zipfile="mathquill-${tagname#v}.zip"
ls "$tarball" "$zipfile" >/dev/null \
  || die 'No tarball or zipfile, first run script/prep-release.sh'

test "$GITHUB_ACCESS_TOKEN" || {
  echo
  echo '	ERROR: No $GITHUB_ACCESS_TOKEN defined.'
  echo
  echo 'This script needs an access token to create GitHub Releases.'
  echo 'Follow these instructions to create a token authorized for the "repo" scope:'
  echo '  https://help.github.com/articles/creating-an-access-token-for-command-line-use/'
  echo 'Then do:'
  echo "  GITHUB_ACCESS_TOKEN=<token> $0"
  exit 1
}

#
# 1. npm publish
#
npm publish $tarball

#
# 2. git push, with tag
#
git push origin master tag $tagname

#
# 3. Create GitHub Release
#
changelog_entry="$(git show CHANGELOG.md | grep '^+' | sed -n '2,$ s/^+// p')"
json="$(
  tagname=$tagname \
  summary="$(echo "$changelog_entry" | sed -n '1 s/^## // p')" \
  body="$(echo "$changelog_entry" | tail +5)" \
  node -p 'JSON.stringify({
    tag_name: process.env.tagname,
    name: process.env.summary,
    body: process.env.body
  })'
)"

endpoint='https://api.github.com/repos/mathquill/mathquill/releases'
release_response="$(curl -s "$endpoint" -d "$json" \
                      -H "Authorization: token $GITHUB_ACCESS_TOKEN")"
upload_url="$(response="$release_response" \
  node -p 'JSON.parse(process.env.response).upload_url' | sed 's/{.*}$//')"

cat $tarball | curl "$upload_url?name=$tarball" --data-binary @- \
  -H 'Content-Type: application/x-gzip' -H "Authorization: token $GITHUB_ACCESS_TOKEN"
cat $zipfile | curl "$upload_url?name=$zipfile" --data-binary @- \
  -H 'Content-Type: application/zip' -H "Authorization: token $GITHUB_ACCESS_TOKEN"

#
# 4. Cleanup
#
rm -rf package $tarball $zipfile
