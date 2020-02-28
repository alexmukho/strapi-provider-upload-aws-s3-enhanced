'use strict';

const AWS = require('aws-sdk');
const sharp = require('sharp');

module.exports = {
  provider: 'aws-s3-enhanced',
  name: 'AWS S3 Enhanced',
  auth: {
    access_key: {
      label: 'AWS Access Key',
      type: 'text',
    },
    secret_key: {
      label: 'AWS Secret Key',
      type: 'text',
    },
    region: {
      label: 'Bucket Region',
      type: 'enum',
      values: [
        'us-east-1',
        'us-east-2',
        'us-west-1',
        'us-west-2',
        'ca-central-1',
        'ap-south-1',
        'ap-northeast-1',
        'ap-northeast-2',
        'ap-northeast-3',
        'ap-southeast-1',
        'ap-southeast-2',
        'cn-north-1',
        'cn-northwest-1',
        'eu-central-1',
        'eu-north-1',
        'eu-west-1',
        'eu-west-2',
        'eu-west-3',
        'sa-east-1',
      ],
    },
    bucket: {
      label: 'Bucket Name',
      type: 'text',
    },
    prefix: {
      label: 'Upload path, e.g. uploads/',
      type: 'text'
    },
    publicACL: {
      label: 'Set the object ACL to public-read',
      type: 'enum',
      values: [
        'false',
        'true'
      ]
    },
    customUrl: {
      label: 'Custom URL, e.g. https://cdn.example.com',
      type: 'text'
    },
    thumbs: {
      label: 'Thumbnails: format [width]x[height]',
      type: 'textarea'
    },
    webp: {
      label: 'Generate WebP',
      type: 'enum',
      values: [
        'true',
        'false'
      ],
    },
    quality: {
      label: 'Quality',
      type: 'number',
      min: 10,
      max: 100
    }
  },
  init: config => {
    let awsConfig = {
      region: config.region
    };

    if (config.access_key && config.secret_key) {
      awsConfig = {
        accessKeyId: config.access_key.trim(),
        secretAccessKey: config.secret_key.trim(),
        ...awsConfig,
      }
    }

    AWS.config.update(awsConfig);

    const S3 = new AWS.S3({
      apiVersion: '2006-03-01',
      params: {
        Bucket: config.bucket.trim(),
      },
    });

    return {
      upload: async file => {

        const prefix = config.prefix.trim() === '/' ? '' : config.prefix.trim();

        if (config.thumbs && config.thumbs !== '-' && ['.png', '.jpg', '.jpeg'].includes(file.ext.toLowerCase())) {

          const thumbs = await generateThumbs(file, config);

          thumbs.forEach(images => {
            images.forEach(image => {
              const { buffer, mime, suffix } = image;

              return new Promise((resolve, reject) => {
                const path = file.path ? `${file.path}/` : '';
                const objectKey = `${prefix}${path}${file.hash}${suffix}`;

                S3.upload({
                    Key: objectKey,
                    Body: new Buffer(buffer, 'binary'),
                    ContentType: mime,
                    ...(config.publicACL === 'true' ? { ACL: 'public-read' } : {})
                  },
                  (err, data) => {
                    if (err) {
                      return reject(err);
                    }
                    resolve();
                  }
                );
              });
            })
          });
        }

        return new Promise((resolve, reject) => {

          const path = file.path ? `${file.path}/` : '';
          const objectKey = `${prefix}${path}${file.hash}${file.ext}`;

          S3.upload({
              Key: objectKey,
              Body: new Buffer(file.buffer, 'binary'),
              ContentType: file.mime,
              ...(config.publicACL === 'true' ? { ACL: 'public-read' } : {})
            },
            (err, data) => {
              if (err) {
                return reject(err);
              }

              file.url = (config.customUrl && config.customUrl !== '-') ? `${config.customUrl}/${objectKey}` : data.Location;

              resolve();
            }
          );
        });
      },
      delete: async file => {

        const prefix = config.prefix.trim() === '/' ? '' : config.prefix.trim();
        const thumbs = getThumbs(file, config);

        thumbs.forEach(images => {
          images.forEach(image => {
            return new Promise((resolve, reject) => {
              const path = file.path ? `${file.path}/` : '';
              const objectKey = `${prefix}${path}${file.hash}${image.suffix}`;

              S3.deleteObject({
                  Key: objectKey,
                },(err, data) => {
                  if (err) {
                    return reject(err);
                  }
                  resolve();
                }
              );
            });
          })
        });

        return new Promise((resolve, reject) => {
          const path = file.path ? `${file.path}/` : '';
          const objectKey = `${prefix}${path}${file.hash}${file.ext}`;

          S3.deleteObject({
              Key: objectKey,
            },(err, data) => {
              if (err) {
                return reject(err);
              }
              resolve();
            }
          );
        });
      },
    };
  },
};


const generateThumbs = async (file, config) => {
  const buffer = new Buffer(file.buffer, 'binary');

  const { thumbs, webp, quality } = config;
  const thumbsList = thumbs.split('\n');

  const imagesToCreate = thumbsList.map(async item => {
    const size = item.split('x');
    const width = parseInt(size[0]);
    const height = parseInt(size[1]);
    let images = [];

    switch (file.ext.toLowerCase()) {
      case '.png':
        images.push(
          await sharp(buffer).resize(width, height, { fit: sharp.fit.cover, withoutEnlargement: true })
            .png({ quality: parseInt(quality) }).toBuffer()
            .then(data => ({
              buffer: data,
              mime: file.mime,
              ext: file.ext,
              suffix:`-${width}x${height}${file.ext}`
            }))
        );
        break;
      case '.jpg':
      case '.jpeg':
        images.push(
          await sharp(buffer).resize(width, height, { fit: sharp.fit.cover, withoutEnlargement: true })
            .jpeg({ quality: parseInt(quality) }).toBuffer()
            .then(data => ({
              buffer: data,
              mime: file.mime,
              ext: file.ext,
              suffix:`-${width}x${height}${file.ext}`
            }))
        );
        break;
    }

    if (webp === 'true') {
      images.push(
        await sharp(buffer).resize(width, height, { fit: sharp.fit.cover, withoutEnlargement: true })
          .webp({ quality: parseInt(quality) }).toBuffer()
          .then(data => ({
            buffer: data,
            mime: 'image/webp',
            ext: '.webp',
            suffix:`-${width}x${height}.webp`
          }))
      );
    }

    return images;
  });

  return Promise.all(imagesToCreate);
};

const getThumbs = (file, config) => {
  const { thumbs, webp } = config;
  const thumbsList = thumbs.split('\n');

  return thumbsList.map(item => {
    const size = item.split('x');
    const width = parseInt(size[0]);
    const height = parseInt(size[1]);

    let list = [];

    switch (file.ext) {
      case '.png': list.push({ suffix:`-${width}x${height}.png` });
        break;
      case '.jpg':
      case '.jpeg': list.push({ suffix:`-${width}x${height}.jpg` });
        break;
    }

    if (webp === 'true') {
      list.push({ suffix:`-${width}x${height}.webp` });
    }

    return list;
  });
};
