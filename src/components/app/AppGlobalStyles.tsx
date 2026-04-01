import React from 'react';

/** AgentFlow 메인 레이아웃·React Flow 엣지용 전역 스타일 */
export const AppGlobalStyles = () => (
  <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #333;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #444;
        }
        
        /* ReactFlow Edge Animation Enhancement */
        .react-flow__edge-path {
          stroke-dasharray: 10;
          animation: flow-animation 1s linear infinite;
        }
        
        @keyframes flow-animation {
          from {
            stroke-dashoffset: 20;
          }
          to {
            stroke-dashoffset: 0;
          }
        }

        .react-flow__edge.animated path {
          stroke-dasharray: 10;
          animation: flow-animation 0.5s linear infinite;
        }

        /* 라벨·배경이 팬/빈 영역 클릭을 가로막지 않도록 (EdgeText rect hit 영역 제거) */
        .react-flow__edge-textwrapper,
        .react-flow__edge-text,
        .react-flow__edge-textbg {
          pointer-events: none !important;
        }
      `}</style>
);
