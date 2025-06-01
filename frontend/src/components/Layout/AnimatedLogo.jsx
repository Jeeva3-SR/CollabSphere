const AnimatedLogo = () => (
  <>
    <svg
      viewBox="0 0 64 64"
      width="40"
      height="56"
      xmlns="http://www.w3.org/2000/svg"
      style={{ marginRight: "10px" }}
    >
      <circle cx="32" cy="32" r="12" fill="#3B82F6" />
      <g className="rotating-group" style={{ transformOrigin: "32px 32px" }}>
        <line
          className="connect-line"
          x1="32"
          y1="32"
          x2="32"
          y2="12"
          stroke="#3B82F6"
          strokeWidth="2"
        />
        <line
          className="connect-line"
          x1="32"
          y1="32"
          x2="32"
          y2="52"
          stroke="#3B82F6"
          strokeWidth="2"
        />
        <line
          className="connect-line"
          x1="32"
          y1="32"
          x2="12"
          y2="32"
          stroke="#3B82F6"
          strokeWidth="2"
        />
        <line
          className="connect-line"
          x1="32"
          y1="32"
          x2="52"
          y2="32"
          stroke="#3B82F6"
          strokeWidth="2"
        />

        <circle className="dot dot-top" cx="32" cy="12" r="4" fill="#3B82F6" />
        <circle className="dot dot-bottom" cx="32" cy="52" r="4" fill="#3B82F6" />
        <circle className="dot dot-left" cx="12" cy="32" r="4" fill="#3B82F6" />
        <circle className="dot dot-right" cx="52" cy="32" r="4" fill="#3B82F6" />
      </g>

      <style>{`
        /* Animate the small dots moving from edges to center */
        .dot-top {
          animation: moveToCenter 3s ease-in-out infinite;
          animation-delay: 0s;
        }
        .dot-bottom {
          animation: moveToCenter 3s ease-in-out infinite;
          animation-delay: 0s;
        }
        .dot-left {
          animation: moveToCenter 3s ease-in-out infinite;
          animation-delay: 0s;
        }
        .dot-right {
          animation: moveToCenter 3s ease-in-out infinite;
          animation-delay: 0s;
        }

        /* Move the dots from their original position to center */
        @keyframes moveToCenter {
          0%, 30% {
            /* start at original position */
            transform: translate(0, 0);
          }
          60%, 80% {
            /* move to center (32,32) */
            transform: translate(calc(32px - var(--cx)), calc(32px - var(--cy)));
          }
          100% {
            transform: translate(0, 0);
          }
        }

        /* Set CSS variables for each dot's original position for translation calculation */
        .dot-top {
          --cx: 32px;
          --cy: 12px;
        }
        .dot-bottom {
          --cx: 32px;
          --cy: 52px;
        }
        .dot-left {
          --cx: 12px;
          --cy: 32px;
        }
        .dot-right {
          --cx: 52px;
          --cy: 32px;
        }

        /* Rotating group does full rotation between 80% to 100% of animation */
        .rotating-group {
          animation: rotateOnce 3s linear infinite;
          animation-delay: 0s;
        }
        @keyframes rotateOnce {
          0%, 80% {
            transform: rotate(0deg);
            transform-origin: 32px 32px;
          }
          100% {
            transform: rotate(360deg);
            transform-origin: 32px 32px;
          }
        }
      `}</style>
    </svg>
  </>
);


export default AnimatedLogo;