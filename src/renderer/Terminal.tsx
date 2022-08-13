/* eslint jsx-a11y/no-static-element-interactions: off, no-console: off, no-restricted-syntax:off */

import { SyntheticEvent, useEffect, useRef, useState } from 'react';
import './Terminal.css';
import { hash } from './utils';
import { useReward } from 'react-rewards';

interface TerminalProps {
  width: number;
  isShow: boolean;
  setIsShow: (isShow: boolean) => void;
}

const { ipcRenderer } = window.electron;

interface TerminalResponse {
  from: 'stdout' | 'stderr' | 'stdin' | 'exit';
  data: string;
}

const nonTextKey = [
  'Shift',
  'Control',
  'Alt',
  'Meta',
  'CapsLock',
  'Tab',
  'Enter',
  'Backspace',
];

const dataToJSX = (data: string) => {
  return data.split('\n').map((line) => {
    return (
      <div
        key={line}
        dangerouslySetInnerHTML={{
          __html: line.replaceAll(' ', '&nbsp;'),
        }}
      />
    );
  });
};

const TerminalContent = ({ output }: { output: TerminalResponse[] }) => {
  console.log('TerminalContentOutput', output);
  return (
    <div className="terminal-content relative h-full overflow-scroll">
      {output.map(({ from, data }, i) => {
        return (
          <div
            style={{
              color: from === 'stdout' ? '#fff' : '#f00',
            }}
            key={hash(`${data},${i}`)}
          >
            {dataToJSX(data)}
          </div>
        );
      })}
    </div>
  );
};

const defaultOutput: TerminalResponse[] = [
  {
    from: 'stdout',
    data: '',
  },
];

const Terminal = ({ width, isShow, setIsShow }: TerminalProps) => {
  const [output, setOutput] = useState<TerminalResponse[]>(defaultOutput);
  const { reward: doneConfetti } = useReward(
    'terminal-done-confetti',
    'emoji',
    {
      emoji: ['🐶', '🦮'],
      spread: 90,
      elementCount: 100,
    }
  );

  console.log(output);
  useEffect(() => {
    ipcRenderer.on('terminal-stdout', (args) => {
      const data = args as unknown as TerminalResponse;
      if (data.from === 'stdin') {
        if (data.data === 'backspace') {
          console.log('backspace');
          setOutput((prevOutput) => {
            const newOutput = [...prevOutput];
            const lastRow = newOutput[prevOutput.length - 1].data;
            newOutput[prevOutput.length - 1].data = lastRow.slice(0, -1);
            return newOutput;
          });
        } else {
          setOutput((prevOutput) => {
            const newOutput = [...prevOutput];
            newOutput[prevOutput.length - 1].data += data.data;
            return newOutput;
          });
        }
      } else {
        setOutput((prevOutput) => [...prevOutput, data]);
      }
    });
    ipcRenderer.on('terminal-open-new', () => {
      setIsShow(true);
      setOutput(defaultOutput);
    });
    ipcRenderer.on('terminal-exit', () => {
      doneConfetti();
      setOutput((prev) => [...prev, { from: 'exit', data: '' }]);
    });
    return () => {
      ipcRenderer.removeAllListeners('terminal-stdout');
      ipcRenderer.removeAllListeners('terminal-open-new');
      ipcRenderer.removeAllListeners('terminal-exit');
    };
  }, [setIsShow, doneConfetti]);

  const [isFocus, setIsFocus] = useState(false);
  const terminalRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const handler = (event: MouseEvent) => {
      if (terminalRef.current) {
        if (terminalRef.current.contains(event.target as Node)) {
          setIsFocus(true);
        } else {
          setIsFocus(false);
        }
      }
    };
    if (terminalRef.current) {
      window.addEventListener('mousedown', handler);
    }
    return () => {
      window.removeEventListener('mousedown', handler);
    };
  }, [terminalRef]);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.key === 'Enter') {
        ipcRenderer.sendMessage('terminal-stdin', ['\n']);
      }
      if (event.key === 'Backspace') {
        ipcRenderer.sendMessage('terminal-stdin', ['', 'backspace']);
      }
      if (!nonTextKey.includes(event.key)) {
        ipcRenderer.sendMessage('terminal-stdin', [event.key]);
      }
    };
    if (isFocus) {
      window.addEventListener('keydown', handler);
    } else {
      window.removeEventListener('keydown', handler);
    }
    return () => {
      window.removeEventListener('keydown', handler);
    };
  }, [isFocus]);

  return (
    <div
      style={{
        width: isShow ? width : 0,
      }}
      className="terminal"
      ref={terminalRef}
    >
      <div
        style={{
          backgroundColor: isFocus ? '#191b22' : '#000',
        }}
        className="flex between terminal-head items-center"
      >
        <div className="">💖 output</div>
        <svg
          onClick={() => setIsShow(false)}
          width={20}
          height={20}
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 512 512"
        >
          <path
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="32"
            d="M368 368L144 144M368 144L144 368"
          />
        </svg>
      </div>
      <TerminalContent output={output} />
      <span id="terminal-done-confetti" />
    </div>
  );
};

export default Terminal;
