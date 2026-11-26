rm -rf dist

mkdir dist

(cd src/stage-left/ && npm run build) &

(cd src/vanilla/ && npm run build) &

(cd src/react-timer/ && npm run build) &

(cd src/data-action/ && npm run build) &

(cd src/_action/ && npm run build) &

(cd src/svelte-timer/ && npm run build) &

(cd src/solid-timer/ && npm run build) &

(cd src/morph-timer/ && npm run build) &

(cd src/morph-scoped-timer/ && npm run build) &

(cd src/html-tag-timer/ && npm run build) &

(cd src/malinajs/ && npm run build) &

(cd src/van-timer/ && npm run build) &

(cd src/html-tag-timer/ && npm run build:main) &

wait

# Give the files without a hash in their name one in their URL.
node tasks/version-assets.mjs
