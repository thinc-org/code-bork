import { MemoryRouter as Router, Routes, Route } from 'react-router-dom';
import { useState } from 'react';
import Editor, { useMonaco } from '@monaco-editor/react';
import { hash } from './utils';
import './App.css';
import dracularTheme from './dracularTheme';
import { useEffect } from 'react';

const defaultCode = `//Hi Bork Bork 🐶
#include <iostream>
using namespace std;

int main()
{
    return 0;
}
`;
const Hello = () => {
  const [code, setCode] = useState(defaultCode);
  const [path, setPath] = useState('');
  const [isSetTheme, setIsSetTheme] = useState(false);
  const [lastHash, setLastHash] = useState(0);
  const [isCompiling, setIsCompiling] = useState(false);
  useEffect(() => {
    function handleKeyPress(event: any) {
      if (event.metaKey && event.key === 's') {
        event.preventDefault();
        window.electron.ipcRenderer.invoke('save-file', [code, path]);
        setLastHash(hash(code));
      }
    }
    window.addEventListener('keydown', handleKeyPress, true);
  });

  const isSaved = hash(code) === lastHash;
  console.log('isSaved', isSaved);
  window.electron.ipcRenderer.once('read-code-file', (args: string[]) => {
    setCode(args[0] as string);
    setPath(args[1] as string);
  });
  const runCode = async () => {
    setIsCompiling(true);
    await window.electron.ipcRenderer.invoke('run-code', [code, path]);
    setIsCompiling(false);
  };
  const monaco = useMonaco();

  const setTheme = () => {
    if (!monaco) {
      return;
    }
    monaco.editor.defineTheme('dracular', dracularTheme as any);
    monaco.editor.setTheme('dracular');
    setIsSetTheme(true);
    console.log('set theme');
  };
  console.log('setIsCompiling', isCompiling);
  useEffect(setTheme, [monaco]);
  useEffect(() => {
    if (path != '') {
      console.log(path, path.split('/')[path.length - 1]);
      window.document.title = `${
        path.split('/')[path.split('/').length - 1]
      } | 🐶`;
    }
  }, [path]);
  const handleOpenFile = () => {
    window.electron.ipcRenderer.invoke('open-file');
  };
  const [folder, setFolderPath] = useState<string>('');
  const [fileName, setFileName] = useState<string>('Untitled');
  const [isShowFileNameModal, setIsShowFileNameModal] =
    useState<boolean>(false);
  const handleNewFile = async () => {
    await window.electron.ipcRenderer.invoke('open-folder');
    window.electron.ipcRenderer.once('open-folder-reply', (args: string[]) => {
      setFolderPath(args[0] as string);
    });
    setIsShowFileNameModal(true);
    setPath('wait-for-filename');
  };

  const handleAddFilename = async (folder: string) => {
    setPath(`${folder}/${fileName}.cpp`);
    setIsShowFileNameModal(false);
    await window.electron.ipcRenderer.invoke(
      'create-file',
      `${folder}/${fileName}.cpp`
    );
    setFolderPath('');
  };

  return (
    <div className="relative flex">
      {/* <div className="settingsModal">
        <div className="">
          auto save
        </div>
      </div>
      <div className="overlay"></div> */}

      {path == '' && (
        <>
          <div className="welcomeModal">
            <div>
              <h1>
                <b>🐶</b>
              </h1>
              <p className="small">
                <span className="appname">Code::Bork</span> is simple c++ ide
                for macOS <br></br> this version is beta if u found any bugs
                please report to discord{' '}
                <span className="text-blue">@meen#9916</span>
              </p>
            </div>
            <div className="flex gap end">
              <div className="button" onClick={handleNewFile}>
                New File 💅
              </div>
              <div className="button" onClick={handleOpenFile}>
                Open File 🥵
              </div>
            </div>
          </div>

          <div className="overlay"></div>
        </>
      )}
      {folder != '' && isShowFileNameModal && (
        <>
          <div className="welcomeModal flex between">
            <div className="flex items-center">
              <div>file name:</div>
              <input
                className="filenameInput"
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
              />
              <div>.cpp</div>
            </div>
            <div className="flex">
              <div className="button" onClick={() => handleAddFilename(folder)}>
                Create 🥺
              </div>
            </div>
          </div>

          <div className="overlay"></div>
        </>
      )}
      {isSetTheme && (
        <Editor
          value={code}
          onChange={(e) => {
            window.electron.ipcRenderer.sendMessage('sync-code', [e, path]);
            setCode(e as string);
          }}
          height="100vh"
          defaultLanguage="cpp"
          defaultValue={defaultCode}
          theme={'dracular'}
          options={{
            fontFamily: 'Fira Code',
            fontSize: 15,
            minimap: {
              enabled: false,
            },
          }}
        />
      )}

      {/* {'path' !== '' && (
        <div onClick={() => runCode()} className="config">
          ⚙️
        </div>
      )} */}

      {path !== '' && (
        <div className="menuContainer">
          <div onClick={() => runCode()} className="run">
            {isCompiling ? 'compiling...' : 'compile & run 🦮'}
          </div>
        </div>
      )}

      {path !== '' && (
        <div className="menuContainerLeft">
          {!isSaved && (
            <div className="saveNotify">don't forget to save your code</div>
          )}
        </div>
      )}
    </div>
  );
};

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Hello />} />
      </Routes>
    </Router>
  );
}
