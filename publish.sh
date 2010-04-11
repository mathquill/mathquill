branch=master
git checkout gh-pages
rm -f mathquill.js
cp build/mathquill.js mathquill.js
git push
git checkout 
