import { MemoryRouter as Router, Routes, Route } from 'react-router-dom';
import icon from '../../assets/icon.svg';
import './App.css';

const Hello = () => {
  const doSomething = () => {
    window.electron.ipcRenderer.once('ipc-example', (arg) => {
      // eslint-disable-next-line no-console
      // Console logs the reply send from main.ts
      console.log('RECEIVED BACK FROM MAIN', arg);
    });
    window.electron.ipcRenderer.sendMessage('ipc-example', 'FOLDER PATH');
  };

  return (
    <div>
      <div className="Hello">
        <img width="200px" alt="icon" src={icon} />
      </div>
      <h1>electron-react-boilerplate</h1>
      <div className="Hello">
        <button onClick={doSomething}>DO SOMETHING</button>
      </div>
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
