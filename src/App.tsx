import React, { useState } from 'react';
import ImageRenderer from './components/ImageRenderer';
import './App.css'
import MyFileInput from './components/MyFileInput';
import './styles/main.scss'
import StatusBar from './components/StatusBar';
function App() {
  const [image, setImage] = useState<Blob | null>(null); 

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setImage(file); 
    }
  };

  return (
    <div className="App">
      <MyFileInput onChange={handleFileChange} accept=".png, .jpg, .jpeg, .gb7, image/png, image/jpeg"/>
      {image && (<ImageRenderer image={image} />)}
    </div>
  );
}

export default App;
