branch=`git branch | grep '\*' | sed 's/\* *//'`
git checkout master
git pull --all
git push --all
git checkout $branch
