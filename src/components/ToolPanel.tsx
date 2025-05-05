import React, { useEffect } from 'react';
import { startKeyUX, hotkeyKeyUX, pressKeyUX, hotkeyOverrides } from 'keyux';


export type Tool = 'eyedropper' | 'hand';

interface ToolPanelProps {
  activeTool: Tool | null;
  setActiveTool: (tool: Tool) => void;
}
const overrides = hotkeyOverrides({})
const ToolPanel: React.FC<ToolPanelProps> = ({ activeTool, setActiveTool }) => {
  useEffect(() => {
    startKeyUX(window, [hotkeyKeyUX([overrides]), pressKeyUX('is-pressed')]);
  }, []);

  const tools = [
    { id: 'eyedropper', name: 'Пипетка', shortcut: 'E', icon: '🧪' },
    { id: 'hand', name: 'Рука', shortcut: 'H', icon: '✋' },
  ] as const;

  return (
    <div className="tool-panel">
      {tools.map(tool => (
        <button
          key={tool.id}
          onClick={() => setActiveTool(tool.id)}
          className={activeTool === tool.id ? 'active' : ''}
          aria-keyshortcuts={tool.shortcut}
          title={`${tool.name} (Горячая клавиша: ${tool.shortcut})`}
        >
          {tool.icon}
        </button>
      ))}
    </div>
  );
};

export default ToolPanel;
