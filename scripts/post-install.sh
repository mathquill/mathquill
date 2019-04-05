set -e
cd ~/edulastic-mathquill
make
aws s3 sync ~/edulastic-mathquill/build s3://edupoc/mathquill
