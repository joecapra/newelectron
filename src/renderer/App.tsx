import { useState } from 'react';
import { MemoryRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';

const Hello = () => {
  const [selectedFolderPath, setSelectedFolderPath] =
    useState('No folder selected');

  const selectFolderPath = () => {
    window.electron.ipcRenderer.once('ipc-select-folder', (arg) => {
      // eslint-disable-next-line no-console
      // Console logs the reply send from main.ts
      setSelectedFolderPath(arg);
    });
    window.electron.ipcRenderer.sendMessage('ipc-select-folder');
  };

  const doIt = () => {
    window.electron.ipcRenderer.once('ipc-get-json-file', (arg) => {
      // eslint-disable-next-line no-console
      // Console logs the reply send from main.ts
      console.log('RECEIVED BACK FROM MAIN PARSED', arg);
    });
    window.electron.ipcRenderer.sendMessage(
      'ipc-get-json-file',
      selectedFolderPath
    );
  };

  return (
    <div className="app">
      {/* <h1>{selectedFolderPath}</h1> */}
      <div>
        <input type="text" placeholder={selectedFolderPath} />
        <button onClick={selectFolderPath}>BROWSE</button>
      </div>
      <input type="text" placeholder="Sheet JSON URL" />
      <button onClick={doIt}>DO IT</button>
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
