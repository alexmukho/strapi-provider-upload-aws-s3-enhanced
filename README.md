# strapi-provider-upload-aws-s3-enhanced
Enhanced AWS S3 provider for Strapi upload: thumbnails, image compression, WebP format, custom domain.

## Instalation

```
yarn add strapi-provider-upload-aws-s3-enhanced
```

## Settings
- **Access Key** - Access key for your AWS account with required permissions
- **Secret Key** - Access secret key
- **Bucket Region** - Region where your bucket is created
- **Bucket Name** - Name of your bucket
- **Upload path** - custom upload path (set **/** to skip)
- **Public-read object ACL** - set public read ACL, make sure your bucket policy allows this
- **Custom URL** - CloudFront or your custom URL (set **-** to skip)
- **Thumbnails** - list of thumbnail sizes, without enlargement (set **-** to skip). Adds suffix `-[width]x[height]`. Configuration sample:
```
1200x800
800x600
```
- **Generate WebP** - generate WebP format for each thumbnail
- **Quality** - image quality from 1 to 100 (**80** is recommended)


## License

MIT License
