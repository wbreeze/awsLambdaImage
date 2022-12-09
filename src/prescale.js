import AWS from 'aws-sdk';
import sharp from 'sharp';
const s3 = new AWS.S3({ apiVersion: '2006-03-01' });

const Prescale = () => {
  let prescale = {};

  // Extract parameters from the S3 event.
  prescale.decodeEvent = (event) => {
    let params = {};
    params.srcBucket = event.Records[0].s3.bucket.name;
    // Object key may have spaces or unicode non-ASCII characters.
    //const srcKey    = decodeURIComponent(event.Records[0].s3.object.key.replace(/\+/g, " "));
    params.srcKey = event.Records[0].s3.object.key;
    params.destBucket = params.srcBucket + "-derived";
    return params;
  }

  return prescale;
};

const handler = async (event, context, callback) => {
  // Read options from the event parameter.
  console.info("Prescale triggered by:\n", JSON.stringify(event));
  const params = prescale.decodeEvent(event);
  const srcBucket = params.srcBucket;
  const srcKey = params.srcKey;
  const dstBucket = params.destBucket;
  const dstKey = "resized-" + srcKey;

  // Infer the image type from the file suffix.
  const typeMatch = srcKey.match(/\.([^.]*)$/);
  if (!typeMatch) {
      console.log("Could not determine the image type.");
      return;
  }

  // Check that the image type is supported
  const imageType = typeMatch[1].toLowerCase();
  if (imageType != "jpg" && imageType != "png") {
      console.log(`Unsupported image type: ${imageType}`);
      return;
  }

  // Download the image from the S3 source bucket.

  try {
      const params = {
          Bucket: srcBucket,
          Key: srcKey
      };
      var origimage = await s3.getObject(params).promise();
  } catch (error) {
      console.error(error);
      return;
  }

  // set thumbnail width. Resize will set the height automatically to maintain aspect ratio.
  const width  = 200;

  // Use the sharp module to resize the image and save in a buffer.
  try {
      var buffer = await sharp(origimage.Body).resize(width).toBuffer();
  } catch (error) {
      console.error(error);
      return;
  }

  // Upload the thumbnail image to the destination bucket
  try {
      const destparams = {
          Bucket: dstBucket,
          Key: dstKey,
          Body: buffer,
          ContentType: "image"
      };
      const putResult = await s3.putObject(destparams).promise();
  } catch (error) {
      console.error(error);
      return;
  }

  console.info('Successfully resized ' + srcBucket + '/' + srcKey +
      ' and uploaded to ' + dstBucket + '/' + dstKey);
};

export { Prescale, handler };
