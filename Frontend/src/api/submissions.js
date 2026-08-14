import api from './axios';
import { API_BASE_URL } from './config';

/**
 * Multipart upload. The FormData is passed straight to axios with
 * `Content-Type` explicitly unset — axios (and the browser) must generate the
 * header itself so the multipart boundary is correct. Setting it by hand is
 * the classic way to break an upload.
 */
export const createSubmission = async ({ taskId, notes, link, files = [] }) => {
  const formData = new FormData();
  formData.append('taskId', taskId);
  formData.append('notes', notes);
  if (link) formData.append('link', link);
  files.forEach((file) => formData.append('files', file));

  const { data } = await api.post('/submissions', formData, {
    headers: { 'Content-Type': undefined },
  });
  return data.data;
};

export const fetchPendingSubmissions = async () => {
  const { data } = await api.get('/submissions/pending');
  return data.data; // { submissions, total }
};

export const fetchSubmissionsForTask = async (taskId) => {
  const { data } = await api.get(`/submissions/task/${taskId}`);
  return data.data;
};

export const reviewSubmission = async ({ id, decision, comment }) => {
  const { data } = await api.put(`/submissions/${id}/feedback`, {
    decision,
    comment,
  });
  return data.data;
};

/**
 * Attachments are served through an authorised route, never a static folder.
 * This is a plain <a href>, so it needs the absolute backend URL once the API
 * lives on a different origin than the app.
 */
export const fileDownloadUrl = (filename) =>
  `${API_BASE_URL}/submissions/file/${filename}`;
