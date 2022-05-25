Resize images on the fly from
AWS S3 bucket source
to Amazon Cloudfront CDN
using Lambda@Edge.

These files are variations of those given by [Resizing Images with Amazon CloudFront & Lambda@Edge][cdnBlog] at the AWS CDN Blog.

The main change is the method of parsing file size out of the URL.
I've also broken-up the sources given in the article and added tests.

## Development

The project uses `npm`, the Node package manager for configuration and
dependency management, and for the running of scripts.

- To get started, assuming you have the Node package manager installed, run
  `npm install`.
- To run a script type, for example, `npm run test`.

[cdnBlog]: https://aws.amazon.com/es/blogs/networking-and-content-delivery/resizing-images-with-amazon-cloudfront-lambdaedge-aws-cdn-blog/
  "Resizing Images with Amazon CloudFront & Lambda@Edge"
