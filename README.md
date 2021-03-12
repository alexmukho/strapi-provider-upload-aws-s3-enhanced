# strapi-provider-upload-aws-s3-enhanced
![Supported Strapi version](https://img.shields.io/badge/Strapi-3.5.2-green.svg) ![GitHub license](https://img.shields.io/github/license/garretua/strapi-provider-upload-aws-s3-enhanced.svg)

Enhanced AWS S3 provider for Strapi uploads: thumbnails, image compression, WebP format, custom domain.

## Instalation

```
yarn add strapi-provider-upload-aws-s3-enhanced
```

## Configuration
Update your `config/plugins.js`:

    module.exports = ({ env }) => ({
      upload: {
        provider: 'aws-s3-enhanced',
        providerOptions: {
          accessKeyId: env('AWS_ACCESS_KEY_ID'),
          secretAccessKey: env('AWS_ACCESS_SECRET'),
          region: env('AWS_REGION'),
          params: {
            Bucket: env('AWS_BUCKET'),
          },
          customDomain: env('CDN_DOMAIN'),
          endpoint: env('CUSTOM_S3_ENDPOINT'), // For third-party S3-compatible storages
          prefix: null,
          quality: 80,
          webp: true,
          thumbnails: [
            {
              name: 'custom',
              options: {
                width: 1200,
                withoutEnlargement: true,
              },
            },
            {
              name: 'preview',
              options: {
                width: 500,
                height: 300,
                fit: 'cover',
              },
            },
          ],
        },
      },
    });


## License

MIT License
