import api from './api';
import axios from 'axios';

export const mediaService = {
  // Two-step upload:
  // 1. Ask our backend for a presigned URL
  // 2. PUT the file directly to S3 using that URL
  // The file never passes through our own servers — S3 receives it directly.
  async upload(file, reportId) {
    const ext = file.name.split('.').pop();

    // Step 1: get the signed URL from Media Service
    const { data } = await api.post('/media/presign', {
      report_id: reportId,
      mime_type: file.type,
      file_extension: ext,
    });

    // Step 2: upload directly to S3
    // We use plain axios here (not our api client) because this request
    // goes to S3, not our Gateway — no Authorization header needed.
    await axios.put(data.upload_url, file, {
      headers: { 'Content-Type': file.type },
    });

    // Step 3: tell our backend the upload is done so it marks it confirmed
    const { data: confirmed } = await api.post('/media/confirm', {
      s3_key: data.s3_key,
    });

    return confirmed.media;
  },

  async getByReport(reportId) {
    const { data } = await api.get(`/media/report/${reportId}`);
    return data.media;
  },
};
