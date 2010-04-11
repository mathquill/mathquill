cp mathquill.css build/mathquill.css
branch=`git branch | grep '\*' | sed 's/\* *//'`
git checkout gh-pages
rm -f mathquill.js mathquill.css
cat build/mathquill.js | sed 's/\/\/\$(/$(/1' > mathquill.js
cp build/mathquill.css mathquill.css
rm -f build/mathquill.css
git commit -a -m "publish new mathquill.js"
git push
git checkout $branch
