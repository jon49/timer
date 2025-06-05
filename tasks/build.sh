rm -rf dist

mkdir dist

(cd src/stage-left/ && npm run build) &

(cd src/vanilla/ && npm run build) &

(cd src/react-timer/ && npm run build) &

(cd src/van-timer/ && npm run build) &

(cd src/van-timer/ && npm run build:main) &

wait
