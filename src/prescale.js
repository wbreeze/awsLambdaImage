'use strict';

import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand
} from '@aws-sdk/client-s3';
import sharp from 'sharp';

import { ImageRequestBuilder } from "./imageRequestBuilder.js";
import { dimVariants } from './dimVariants.js';

const Prescale = () => {
  let prescale = {};

  const S3 = new S3Client({
    region: process.env.AWS_S3_RESIZE_REGION
  });

  /**
  Accepts source image key (file name)
  Returns an array of scaled image parameters, each having form:
    {
      dstKey: "/path/to/600x600/png/srcName.png",
      width: 600,
      height: 600
    }
  */
  prescale.taskList = (srcKey) => {
    console.debug("Generate scaled image task list for source, %s", srcKey);
    let irb = ImageRequestBuilder(srcKey, "", "");
    return [false, true].map((acceptWebp) => {
      return dimVariants.map((dims) => {
        const task = {
          dstKey: irb.buildRequestURI(dims, acceptWebp),
          width: dims.w,
          height: dims.h
        };
        return task;
      });
    }).flat();
  };

  /**
  Accepts destination bucket and key together with an image buffer.
  Returns a promise to write the buffer as an image in the destination bucket.
  */
  prescale.writeImage = (bucket, dstKey, buffer) => {
    const dstParams = {
        Bucket: bucket,
        Key: dstKey,
        Body: buffer,
        ContentType: "image"
    };
    return S3.send(new PutObjectCommand(dstParams));
  };

  /**
  Accepts width, height, and image buffer
  Returns a promise that is scaling the image to fit the width and height
    bounds.
  */
  prescale.scaleImage = (width, height, buffer) => {
    let constructorOptions = {
      sequentialRead: true
    };

    let resizeOptions = {
      fit: "inside",
      kernel: "lanczos3",
      withoutEnlargement: true,
      fastShrinkOnLoad: false
    };

    return sharp(buffer, constructorOptions)
      .resize(width, height, resizeOptions)
      .toBuffer()
      .finally(() => {
        console.info(
          "Successfully wrote scaled image \"%s\" to bucket, \"%s\"",
          task.dstKey, task.dstBucket
        );
      });
  };

  /**
  Accepts one image scaling task of form from prescale.taskList(),
    together with an input image buffer.
  Returns a promise that is executing the image scaling task and writing
    the scaled result.
  */
  prescale.doScaleTask = (task, buffer) => {
    console.debug(
      "Schedule scale and write task ", JSON.stringify(task, null, 2)
    );
    prescale.scaleImage(task.width, task.height, buffer)
    .then((scaled) => { prescale.writeImage(task.dstKey, scaled); });
  }

  /**
  Accepts a source image buffer.
  Returns a promise of all af the scaling tasks.
  */
  prescale.doScaleTasksForBuffer = (buffer) => {
    Promise.all(
      prescale.tasklist.map((task) => prescale.doScaleTask(task, buffer))
    )
  };

  /**
  Uses values extracted by the constructor.
  Returns a promise to read the source image and launch scaling tasks with the
    source image buffer
  */
  prescale.doScaleImage = (srcBucket, srcKey, dstBucket) => {
    // Infer the image type from the file suffix.
    const typeMatch = srcKey.match(/\.([^.]*)$/);
    if (!typeMatch) {
        return Promise.reject("Could not determine the image type.");
    }

    // Check that the image type is supported
    const imageType = typeMatch[1].toLowerCase();
    if (imageType != "jpg" && imageType != "png") {
        return Promise.reject(`Unsupported image type: ${imageType}`);
    }

    const params = {
        Bucket: srcBucket,
        Key: srcKey
    };
    return S3.send(new GetObjectCommand(params))
      .then((result) => {
        console.debug(
          "Result of S3 get is %s", JSON.stringify(result, null, 2)
        );
        return prescale.doScaleTasksForBuffer(result.body);
      })
      .catch(console.error)
  };

  prescale.decodeEvent = (event) => {
    let params = {};

    params.srcBucket = event.Records[0].s3.bucket.name;
    params.srcKey = event.Records[0].s3.object.key;
    params.dstBucket = process.env.AWS_S3_RESIZE_DST_NAME || srcBucket + "-derived";

    return params;
  };

  return prescale;
};

// returns a promise of a scaling result
let processEvent = (event) => {
  console.debug("processEvent " + JSON.stringify(event, null, 2));
  let prescale = Prescale();
  let p = prescale.decodeEvent(event);
  return prescale.doScaleImage(p.srcBucket, p.srcKey, p.dstBucket);
}

const handler = async (event, context, callback) => {
  console.info("Prescale triggered");

  processEvent(event).then(result => {
    console.info("Scaling result is %j", result);
    return callback(null, response);
  }).catch((err) => {
    console.error("Failed resize images, error %j", err);
  });
};

export { Prescale, processEvent, handler };
