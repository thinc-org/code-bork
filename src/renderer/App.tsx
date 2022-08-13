import { MemoryRouter as Router, Routes, Route } from 'react-router-dom';
import { useState, useEffect, useRef, useLayoutEffect } from 'react';
import Editor, { useMonaco } from '@monaco-editor/react';
import { Resizable } from 're-resizable';

import { hash } from './utils';
import './App.css';
import dracularTheme from './dracularTheme';
import Terminal from './Terminal';

const { ipcRenderer } = window.electron;

const Hello = () => {
  const [code, setCode] = useState(``);
  const [path, setPath] = useState('');
  const [viewSize, setViewSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });
  const [isSetTheme, setIsSetTheme] = useState(false);
  const [lastHash, setLastHash] = useState(0);
  const [isCompiling, setIsCompiling] = useState(false);
  const [terminalWidth, setTerminalWidth] = useState(window.innerWidth * 0.3);
  const [isShowTerminal, setIsShowTerminal] = useState(false);

  useLayoutEffect(() => {
    setTerminalWidth(window.innerWidth * 0.3);
    const onResize = () => {
      setViewSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
    };
  }, []);

  useEffect(() => {
    function handleKeyPress(event: KeyboardEvent) {
      if (event.metaKey && event.key === 's') {
        event.preventDefault();
        ipcRenderer.invoke('save-file', [code, path]);
        setLastHash(hash(code));
      }
    }
    window.addEventListener('keydown', handleKeyPress, true);
    return () => {
      window.removeEventListener('keydown', handleKeyPress, true);
    };
  });

  const isSaved = hash(code) === lastHash;
  useEffect(() => {
    const onReadCode = (args: string[]) => {
      setCode(args[0] as string);
      setPath(args[1] as string);
    };
    ipcRenderer.once('read-code-file', onReadCode);
    return () => {
      ipcRenderer.removeListener('read-code-file', onReadCode);
    };
  }, []);

  const runCode = async () => {
    setIsCompiling(true);
    setIsShowTerminal(true);
    await ipcRenderer.invoke('run-code', [code, path]);
    setIsCompiling(false);
  };
  const monaco = useMonaco();

  const setTheme = () => {
    if (!monaco) {
      return;
    }
    monaco.editor.defineTheme('dracular', dracularTheme);
    monaco.editor.setTheme('dracular');
    setIsSetTheme(true);
  };
  useEffect(setTheme, [monaco]);
  useEffect(() => {
    if (path !== '') {
      window.document.title = `${
        path.split('/')[path.split('/').length - 1]
      } | 🐶`;
    }
  }, [path]);
  const handleOpenFile = () => {
    ipcRenderer.invoke('open-file');
  };

  const [folder, setFolderPath] = useState<string>('');
  const [fileName, setFileName] = useState<string>('Untitled');
  const [isShowFileNameModal, setIsShowFileNameModal] =
    useState<boolean>(false);
  const handleNewFile = async () => {
    await ipcRenderer.invoke('open-folder');
    ipcRenderer.once('open-folder-reply', (args: string[]) => {
      setFolderPath(args[0] as string);
    });
    setIsShowFileNameModal(true);
    setPath('wait-for-filename');
  };

  const handleAddFilename = async () => {
    setPath(`${folder}/${fileName}.cpp`);
    setIsShowFileNameModal(false);
    await ipcRenderer.invoke('create-file', `${folder}/${fileName}.cpp`);
    setFolderPath('');
  };
  const beforeResizeTerminalWidth = useRef(0);
  const onResizeTerminal = (
    _e: MouseEvent | TouchEvent,
    _direction: string,
    _ref: HTMLElement,
    d: {
      height: number;
      width: number;
    }
  ) => {
    setTerminalWidth(beforeResizeTerminalWidth.current + d.width);
  };

  return (
    <div className="relative flex">
      {/* <div className="settingsModal">
        <div className="">
          auto save
        </div>
      </div>
      <div className="overlay"></div> */}

      {path === '' && (
        <>
          <div className="welcomeModal">
            <div>
              <h1>
                <b>🐶</b>
              </h1>
              <p className="small">
                <span className="appname">Code::Bork</span> is simple c++ ide
                for macOS <br /> this version is beta if u found any bugs please
                report to discord <span className="text-blue">@meen#9916</span>
              </p>
            </div>
            <div className="flex gap end">
              <button type="button" className="button" onClick={handleNewFile}>
                New File 💅
              </button>
              <button type="button" className="button" onClick={handleOpenFile}>
                Open File 🥵
              </button>
            </div>
          </div>

          <div className="overlay" />
        </>
      )}
      {folder !== '' && isShowFileNameModal && (
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
              <button
                type="button"
                className="button"
                onClick={handleAddFilename}
              >
                Create 🥺
              </button>
            </div>
          </div>

          <div className="overlay" />
        </>
      )}
      {isSetTheme && (
        <div className="flex relative">
          <div className="editor relative">
            <Editor
              value={code}
              onChange={(e) => {
                ipcRenderer.sendMessage('sync-code', [e, path]);
                setCode(e as string);
              }}
              height="100vh"
              width={viewSize.width - (isShowTerminal ? terminalWidth : 0)}
              defaultLanguage="cpp"
              defaultValue=""
              theme="dracular"
              options={{
                fontFamily: 'Fira Code',
                fontSize: 15,
                minimap: {
                  enabled: false,
                },
              }}
            />
          </div>
          <Resizable
            style={{
              height: '100vh',
            }}
            enable={{
              top: false,
              right: false,
              bottom: false,
              left: true,
              topRight: false,
              bottomRight: false,
              bottomLeft: false,
              topLeft: false,
            }}
            size={{
              width: isShowTerminal ? terminalWidth : 0,
              height: viewSize.height,
            }}
            onResizeStart={() => {
              beforeResizeTerminalWidth.current = terminalWidth;
            }}
            onResize={onResizeTerminal}
          >
            <Terminal
              isShow={isShowTerminal}
              setIsShow={setIsShowTerminal}
              width={isShowTerminal ? terminalWidth : 0}
            />
          </Resizable>
        </div>
      )}

      {/* {'path' !== '' && (
        <div onClick={() => runCode()} className="config">
          ⚙️
        </div>
      )} */}

      {path !== '' && (
        <div className="menuContainer">
          <button type="button" onClick={() => runCode()} className="run">
            {isCompiling ? 'compiling...' : 'compile & run 🦮'}
          </button>
        </div>
      )}

      {path !== '' && (
        <div className="menuContainerLeft">
          {!isSaved && (
            <div className="saveNotify">dont forget to save your code</div>
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
