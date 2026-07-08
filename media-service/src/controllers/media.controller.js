const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { v4: uuidv4 } = require('uuid');
const MediaModel = require('../models/media.model');

// AWS_ENDPOINT_URL is only set in local docker-compose (pointing at LocalStack).
// forcePathStyle is required for LocalStack — real AWS S3 doesn't need it.
const s3Config = { region: process.env.AWS_REGION || 'us-east-1' };
if (process.env.AWS_ENDPOINT_URL) {
  s3Config.endpoint = process.env.AWS_ENDPOINT_URL;
  s3Config.forcePathStyle = true;
  s3Config.credentials = { accessKeyId: 'test', secretAccessKey: 'test' };
}
const s3 = new S3Client(s3Config);
const BUCKET = process.env.S3_BUCKET_NAME;

const MediaController = {
  // Step 1: Frontend asks for a presigned URL before uploading.
  // We generate a unique S3 key, create a pending media record,
  // and return the signed URL. The frontend uploads directly to S3
  // using this URL — the file never passes through our server.
  async getPresignedUrl(req, res) {
    const { report_id, mime_type, file_extension } = req.body;
    const userId = req.user.sub;

    if (!mime_type) {
      return res.status(400).json({ error: 'mime_type is required.' });
    }

    // Build a unique key so two users can't accidentally overwrite each other.
    const s3Key = `reports/${report_id || 'unlinked'}/${uuidv4()}.${file_extension || 'bin'}`;
    // In local dev (LocalStack), the returned URL must use the SAME hostname
    // that was used to sign the request, or S3 signature validation fails.
    // See the root README for the one-line /etc/hosts entry this requires.
    const fileUrl = process.env.AWS_ENDPOINT_URL
      ? `${process.env.AWS_ENDPOINT_URL}/${BUCKET}/${s3Key}`
      : `https://${BUCKET}.s3.amazonaws.com/${s3Key}`;

    try {
      // PutObjectCommand tells S3 we want to upload an object.
      // getSignedUrl wraps it in a temporary URL valid for 5 minutes.
      // After 5 minutes, the URL expires and can't be used — security feature.
      const command = new PutObjectCommand({
        Bucket: BUCKET,
        Key: s3Key,
        ContentType: mime_type,
      });
      const signedUrl = await getSignedUrl(s3, command, { expiresIn: 300 });

      // Save a pending record so we know this upload is in flight.
      const media = await MediaModel.create({ userId, reportId: report_id, s3Key, url: fileUrl, mimeType: mime_type });

      return res.status(200).json({
        upload_url: signedUrl,   // frontend POSTs the file directly to this
        media_id: media.id,
        s3_key: s3Key,
        expires_in: 300,
      });
    } catch (err) {
      console.error('presigned URL error:', err.message);
      return res.status(500).json({ error: 'Internal server error.' });
    }
  },

  // Step 2: After the frontend finishes uploading to S3, it calls this
  // to confirm the upload succeeded. We mark the media record as confirmed.
  async confirmUpload(req, res) {
    const { s3_key } = req.body;
    if (!s3_key) return res.status(400).json({ error: 's3_key is required.' });

    try {
      const media = await MediaModel.confirm(s3_key);
      if (!media) return res.status(404).json({ error: 'Media record not found.' });
      return res.status(200).json({ media });
    } catch (err) {
      console.error('confirm upload error:', err.message);
      return res.status(500).json({ error: 'Internal server error.' });
    }
  },

  async getByReport(req, res) {
    try {
      const media = await MediaModel.findByReportId(req.params.reportId);
      return res.status(200).json({ media });
    } catch (err) {
      console.error('getByReport error:', err.message);
      return res.status(500).json({ error: 'Internal server error.' });
    }
  },
};

module.exports = MediaController;
