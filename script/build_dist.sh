rm -rf node_modules/
npm install --only=prod
cp resize.js index.js
zip -r resize.zip index.js node_modules
cp request.js index.js
zip -r request.zip index.js node_modules
rm index.js
npm install
