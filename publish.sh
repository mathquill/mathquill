branch=`git branch | grep '\*' | sed 's/\* *//'`
git checkout gh-pages
rm -f mathquill.js
cp build/mathquill.js mathquill.js
git commit -a -m "publish new mathquill.js"
git push
git checkout $branch
