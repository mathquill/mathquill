set -e
cd ~/edulastic-mathquill
chmod +x  script/*
make
aws s3 sync ~/edulastic-mathquill/build s3://edupoc/edulasticv2-development/JS/thirdpartylib/mathquill
