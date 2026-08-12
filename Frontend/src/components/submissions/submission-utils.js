/** Shared submission helpers — kept out of component files so those export
 *  only components (React Fast Refresh requirement). */

export const MAX_FILES = 5;
export const MAX_FILE_SIZE = 5 * 1024 * 1024;
export const ACCEPT = '.pdf,.doc,.docx,.png,.jpg,.jpeg,.zip';
export const ALLOWED_EXTENSIONS = ['pdf', 'doc', 'docx', 'png', 'jpg', 'jpeg', 'zip'];

export const formatBytes = (bytes = 0) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};
