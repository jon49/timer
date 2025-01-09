rm -rf dist

mkdir dist

cp -r static/* dist/

echo "RUN BUILD"
npm run build

# in the dist directory loop through the html files and add `?v=<timestamp>` to the end of the css and js files
TIMESTAMP=$(date +%s)
echo $TIMESTAMP
for file in dist/*.html; do
    echo "Processing $file"
    sed -i -E 's/(href=".*\.css)"/\1?v='$TIMESTAMP'"/g' $file
    sed -i -E 's/(src=".*\.js)"/\1?v='$TIMESTAMP'"/g' $file
done
