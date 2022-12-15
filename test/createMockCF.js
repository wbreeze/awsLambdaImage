'use strict';

let createMockCF = () => {
  return {
    "Records": [
        {
            "cf": {
                "config": {
                    "distributionDomainName": "domain.cloudfront.net",
                    "distributionId": "EDSEXAMPLEDID",
                    "eventType": "origin-response",
                    "requestId": "pN1SoewTOXVxYcNPthsxo1Gi9yf-uqzSCrU-e2yjj8bfBr1KyKGTAA=="
                },
                "request": {
                    "clientIp": "127.0.0.0",
                    "headers": {
                        "x-forwarded-for": [
                            {
                                "key": "X-Forwarded-For",
                                "value": "127.0.0.0"
                            }
                        ],
                        "user-agent": [
                            {
                                "key": "User-Agent",
                                "value": "Amazon CloudFront"
                            }
                        ],
                        "via": [
                            {
                                "key": "Via",
                                "value": "1.1 arn.cloudfront.net (CloudFront)"
                            }
                        ],
                        "host": [
                            {
                                "key": "Host",
                                "value": "arn.s3.eu-west-1.amazonaws.com"
                            }
                        ]
                    },
                    "method": "GET",
                    "origin": {
                        "s3": {
                            "authMethod": "origin-access-identity",
                            "customHeaders": {},
                            "domainName": "arn.s3.eu-west-1.amazonaws.com",
                            "path": "",
                            "region": "eu-west-1"
                        }
                    },
                    "querystring": "",
                    "uri": "/600x600/png/IMG_8932.png"
                },
                "response": {
                    "headers": {
                        "x-amz-request-id": [
                            {
                                "key": "x-amz-request-id",
                                "value": "AJCP06B0MNSV9JH2"
                            }
                        ],
                        "x-amz-id-2": [
                            {
                                "key": "x-amz-id-2",
                                "value": "acVAebmZ7YB0YHwdDfsUtb+R0dFe91cEkbhTg6cEvVRO2SoBe3sY+WG8Z2zIDQCfpDSqQAQ1zAE="
                            }
                        ],
                        "date": [
                            {
                                "key": "Date",
                                "value": "Mon, 13 Jun 2022 14:46:01 GMT"
                            }
                        ],
                        "server": [
                            {
                                "key": "Server",
                                "value": "AmazonS3"
                            }
                        ],
                        "content-type": [
                            {
                                "key": "Content-Type",
                                "value": "application/xml"
                            }
                        ],
                        "transfer-encoding": [
                            {
                                "key": "Transfer-Encoding",
                                "value": "chunked"
                            }
                        ]
                    },
                    "status": "404",
                    "statusDescription": "Not Found"
                }
            }
        }
    ]
  }
};

export { createMockCF };
