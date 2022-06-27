import { useState } from 'react';
import { MemoryRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';

const Hello = () => {
  const [statusMessage, setStatusMessage] = useState('');
  const [selectedFolderPath, setSelectedFolderPath] = useState('');
  const [sheetJsonPath, setSheetJsonPath] = useState('');

  window.electron.ipcRenderer.on('ipc-status-messages', (arg) => {
    // eslint-disable-next-line no-console
    // Console logs the reply send from main.ts
    setStatusMessage(arg);
  });

  const selectFolderPath = () => {
    window.electron.ipcRenderer.once('ipc-select-folder', (arg) => {
      // eslint-disable-next-line no-console
      // Console logs the reply send from main.ts
      setSelectedFolderPath(arg);
    });
    window.electron.ipcRenderer.sendMessage('ipc-select-folder');
  };

  const doIt = () => {
    // Check if a folder is selected and a sheet url is entered
    if (selectedFolderPath === '' || sheetJsonPath === '') {
      console.error('YOU DID NOT SELECT A FOLDER AND SHEET URL');
      console.error('selectedFolderPath==========', selectedFolderPath);
      console.error('sheetJsonPath==========', sheetJsonPath);
      return;
    }

    window.electron.ipcRenderer.once('ipc-get-json-file', (arg) => {
      // eslint-disable-next-line no-console
      // Console logs the reply send from main.ts
      console.log('RECEIVED BACK FROM MAIN PARSED', arg);
    });
    window.electron.ipcRenderer.sendMessage('ipc-get-json-file', {
      folderPath: selectedFolderPath,
      sheetPath: sheetJsonPath,
    });
  };

  return (
    <div className="app">
      <h1>{statusMessage}</h1>
      <div className="folderselect">
        <input
          type="text"
          placeholder="Select a folder"
          value={selectedFolderPath}
          readOnly
        />
        <button onClick={selectFolderPath}>BROWSE</button>
      </div>
      <input
        id="sheetUrl"
        type="text"
        placeholder="Sheet JSON URL"
        onBlur={() => {
          const val = document.getElementById('sheetUrl').value;
          setSheetJsonPath(val);
        }}
      />
      <button type="submit" onClick={doIt}>
        DO IT
      </button>
    </div>
  );
};

export default function App() {
  // calling IPC exposed from preload script

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Hello />} />
      </Routes>
    </Router>
  );
}
