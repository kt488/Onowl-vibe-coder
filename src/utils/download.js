import JSZip from 'jszip';
import { saveAs } from 'file-saver';

/**
 * Powerful File Download System
 * Allows exporting single files or entire multi-file projects as ZIP archives.
 */

export const downloadSingleFile = (filename, content) => {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  saveAs(blob, filename);
};

export const exportProjectAsZip = async (files, projectName = 'onowl-project') => {
  const zip = new JSZip();
  
  // Group files into the zip structure
  files.forEach(file => {
    // Determine mime type / formatting if needed, but JSZip handles strings nicely.
    zip.file(file.name, file.content);
  });

  // Generate ZIP blob
  const zipBlob = await zip.generateAsync({ 
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: { level: 9 } 
  });
  
  // Trigger download
  saveAs(zipBlob, `${projectName}.zip`);
};

export const exportToGithubMock = async (files, repoName) => {
  // In a real environment, this would call a backend API with a GitHub OAuth token
  // that uses the GitHub REST API to create a repo and commit the files.
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ success: true, message: `Successfully pushed to github.com/user/${repoName}` });
    }, 1500);
  });
};