import React, { FC } from "react";

interface StatusBarProps {
  width: number;
  height: number;
  colorDepth: string;
}

const StatusBar: FC<StatusBarProps> = ({ width, height, colorDepth }) => {
  return (
    <div className="status-bar">
      Размер: {width}×{height}px &nbsp;|&nbsp; Глубина цвета: {colorDepth}
    </div>
  );
};

export default StatusBar;
