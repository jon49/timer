rm -rf dist

mkdir dist

(cp -r static/* dist/) &

(npx esbuild src/app-stage-left.ts src/app-vanilla.ts --bundle --format=esm --outdir=dist/js/ --minify) &

(cd src/react-timer/ && npm run build) &

(cd src/van-timer/ && npm run build) &

# in the dist directory loop through the html files and add `?v=<timestamp>` to the end of the css and js files
TIMESTAMP=$(date +%s)
echo $TIMESTAMP
for file in dist/*.html; do
    echo "Processing $file"
    sed -i -E 's/(href=".*\.css)"/\1?v='$TIMESTAMP'"/g' $file
    sed -i -E 's/(src=".*\.js)"/\1?v='$TIMESTAMP'"/g' $file
done

wait
