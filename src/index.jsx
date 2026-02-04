import React from 'react';
import ReactDOM from 'react-dom/client';

function App() {
  const [bgColor, setBgColor] = React.useState('bg-white');

  const handleClick = () => {
    setBgColor(bgColor === 'bg-white' ? 'bg-yellow-200' : 'bg-white');
  };

  return (
    <div
      onClick={handleClick}
      className={`h-screen font-bold text-8xl flex items-center justify-center ${bgColor}`}
    >
      <div> Hello React </div>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
