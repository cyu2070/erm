import React, { useEffect, useState } from 'react';

const App = () => {
  const [files, setFiles] = useState([]);

  const handleFileChange = (event) => {
    setFiles(event.target.files);
  };

  const uploadFiles = async () => {
    const formData = new FormData();
    for (const file of files) {
      formData.append('files[]', file);
    }
    const response = await fetch('/upload', {  // Update '/upload' with your server endpoint
      method: 'POST',
      body: formData,
    });
    if (response.ok) {
      console.log('Files uploaded successfully');
    } else {
      console.error('File upload failed');
    }
  };

  useEffect(() => {
    if (files.length > 0) {
      uploadFiles();
    }
  }, [files]);

  return (
    <div>
      <input type="file" multiple onChange={handleFileChange} />
    </div>
  );
};

export default App;