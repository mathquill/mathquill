#!/bin/bash

if [ ! -d build ]; then
  mkdir build \
    && echo "No build/ directory, made one for ya" >/dev/stderr
fi

if [ "$1" == "HEAD" ]; then
  STASH="$(git stash)"
  echo "$STASH"
fi

echo "cat src/{blah,blah}.js > build/mathquill.js # not literally"
cat \
  src/intro.js \
  src/baseclasses.js \
  src/rootelements.js \
  src/commands.js \
  src/symbols.js \
  src/cursor.js \
  src/publicapi.js \
  src/outro.js \
  > build/mathquill.js

if [ "$1" == "cat" ]; then
  exit
elif [ "$1" == "HEAD" ]; then
  if [ "$STASH" != "No local changes to save" ]; then
    git stash pop
  fi
fi

echo "uglifyjs build/mathquill.js > build/mathquill.min.js"
uglifyjs build/mathquill.js \
  > build/mathquill.min.js \
    || echo "\
 ___________________
/ i no has uglifyjs \\
\\ i no can minify   /
 -------------------
  \\
   \\
      /\\_)o<
     |      \\
     | O . O |
      \\_____/" \
      >/dev/stderr
  # created with cowsay

if [ "$1" == "publish" ]; then
  cp mathquill.css build/mathquill.css
  STASH="$(git stash)"
  echo "$STASH"
  BRANCH="$(git status | head -1)"
  COMMIT="$(git show -s --oneline)"
  git checkout gh-pages
  echo "git pull origin gh-pages"
  git pull origin gh-pages
  cp build/* .
  rm build/mathquill.css
  if [ "$BRANCH" != "# Not currently on any branch" ]; then
    BRANCH="$(echo "$BRANCH" | cut -d ' ' -f 4)"
    git commit -am "publish latest $BRANCH $COMMIT"
  else
    git commit -am "publish detached $COMMIT"
  fi
  echo "git push origin gh-pages"
  git push origin gh-pages
  git checkout -
  if [ "$STASH" != "No local changes to save" ]; then
    git stash pop
  fi
fi
