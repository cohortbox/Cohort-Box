import './PhotoStep.css';
import { useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { useAuth } from './context/AuthContext';
import Toast from "./components/Toast";
import closeImg from './images/close-gray.png';

export default function ProfilePhotoStep() {
  const navigate = useNavigate();
  const { method, id } = useParams();
  const { accessToken } = useAuth();
  const [preview, setPreview] = useState(null);
  const [toastMessage, setToastMessage] = useState("");
  const [showToast, setShowToast] = useState(false);

  function showAlert(msg) {
    setToastMessage(msg);
    setShowToast(true);
  }
  // Handle file drop
  const onDrop = useCallback((acceptedFiles) => {
    const file = acceptedFiles[0];
    if (file) {
      setPreview(URL.createObjectURL(file));
    }
  }, []);

  const MAX_SIZE = 2 * 1024 * 1024;

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': [] },
    maxFiles: 1,
    maxSize: MAX_SIZE,
    onDropRejected: (fileRejections) => {
      fileRejections.forEach((rej) => {
        if (rej.errors[0].code === "file-too-large") {
          showAlert("Your image is larger than 2MB. Pick a smaller file.");
        } else {
          showAlert("Invalid file selected.");
        }
      });
    }
  });

  async function handleUpload() {
    if (!preview) return showAlert('Please select a photo!');
    const formData = new FormData();
    formData.append('image', document.querySelector('input[type="file"]').files[0]);
    if(method !== 'profile'){
      formData.append('chatId', id);
    }

    const apiUrl = method === 'profile' ? '/api/upload-user-dp' : '/api/upload-chat-dp'
    const res = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${accessToken}`,
      },
      body: formData,
    });

    const data = await res.json();
    if(!res.ok){
      showAlert('Image not Uploade: Error Occured!');
      return;
    } else {
      navigate('/')
    }
    console.log('Uploaded DP URL:', data.url);
  }

  return (
    <div className="profile-photo-step">
      <div className='close-btn-container'>
        <button onClick={() => navigate('/')} className='close-btn'><img src={closeImg}/></button>
      </div>
      <div className='profile-photo-step-body'>
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
        <p className='profile-photo-step-note'>Note: Your image should be under 2MB.</p>
        <button onClick={handleUpload} className="upload-btn">
          Upload Photo
        </button>
        <Toast
          message={toastMessage}
          show={showToast}
          onClose={() => setShowToast(false)}
        />
      </div>
    </div>
  );
}
