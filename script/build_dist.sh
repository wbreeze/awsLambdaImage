if [[ -n ${AWS_S3_RESIZE_SRC_NAME} && -n ${AWS_S3_RESIZE_DST_NAME} && -n ${AWS_S3_RESIZE_REGION} ]]; then
  [[ -e dist ]] || mkdir dist
  rm -rf node_modules/
  npm install --only=prod
  sed -e \
    "s/process.env.AWS_S3_RESIZE_SRC_NAME/\"${AWS_S3_RESIZE_SRC_NAME}\"/g" \
    resize.js \
    | sed -e \
    "s/process.env.AWS_S3_RESIZE_DST_NAME/\"${AWS_S3_RESIZE_DST_NAME}\"/g" \
    | sed -e \
    "s/process.env.AWS_S3_RESIZE_REGION/\"${AWS_S3_RESIZE_REGION}\"/g" \
    >index.js
  zip -r dist/resize.zip index.js node_modules
  cp request.js index.js
  zip -r dist/request.zip index.js node_modules
  rm index.js
  npm install
else
  echo "Missing environment variable"
  exit 2
fi
