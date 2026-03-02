import React, { useEffect, useState } from 'react';

function App() {
    const [availableFiles, setAvailableFiles] = useState([]);

    useEffect(() => {
        fetchAvailableFiles();
    }, []);

    const fetchAvailableFiles = async () => {
        try {
            const response = await fetch('/api/files');
            const data = await response.json();
            setAvailableFiles(data);
        } catch (error) {
            console.error('Error fetching files:', error);
        }
    };

    const handleServerFile = (fileName) => {
        // Logic to load the file (e.g., open or download)
    };

    return (
        <div>
            <h1>Files from Uploads Folder</h1>
            {availableFiles.length === 0 ? (
                <p>Loading files...</p>
            ) : (
                <ul>
                    {availableFiles.map(file => (
                        <li key={file} onClick={() => handleServerFile(file)}>
                            {file}
                        </li>
                    ))}
                </ul>
            )}

            <h2>Manual File Upload</h2>
            {/* Existing manual file upload section here */}
        </div>
    );
}

export default App;