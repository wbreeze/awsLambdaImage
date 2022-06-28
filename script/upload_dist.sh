aws lambda update-function-code \
--function-name "scale_image" \
--zip-file fileb://dist/resize.zip \
--publish \
--region us-east-1
