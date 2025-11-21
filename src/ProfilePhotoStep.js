import './ProfilePhotoStep.css';
import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useAuth } from './context/AuthContext';

export default function ProfilePhotoStep() {
  const { accessToken } = useAuth();
  const [preview, setPreview] = useState(null);

  // Handle file drop
  const onDrop = useCallback((acceptedFiles) => {
    const file = acceptedFiles[0];
    if (file) {
      setPreview(URL.createObjectURL(file));
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': [] },
    maxFiles: 1,
  });

  async function handleUpload() {
    if (!preview) return alert('Please select a photo!');
    const formData = new FormData();
    formData.append('image', document.querySelector('input[type="file"]').files[0]);

    const res = await fetch('/api/upload-user-dp', {
      method: 'POST',
      headers: {
        authorization: `Bearer ${accessToken}`,
      },
      body: formData,
    });

    const data = await res.json();
    console.log('Uploaded DP URL:', data.url);
  }

  return (
    <div className="profile-photo-step">
      <div {...getRootProps({ className: 'dropzone' })}>
        <input {...getInputProps()} />
        {isDragActive ? (
          <p>Drop the photo here...</p>
        ) : (
          <p>Drag & drop a photo, or click to select one</p>
        )}
      </div>

      {preview && (
        <div className="preview-container">
          <img src={preview} alt="Preview" className="preview-image" />
        </div>
      )}

      <button onClick={handleUpload} className="upload-btn">
        Upload Photo
      </button>
    </div>
  );
}
