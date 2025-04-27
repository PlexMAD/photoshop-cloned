import React, { useState } from 'react';
import ImageRenderer from './components/ImageRenderer';
import './App.css'
import MyFileInput from './components/MyFileInput';
import './styles/main.scss'
function App() {
  const [image, setImage] = useState<Blob | null>(null); 
  const [inputVisible, setInputVisible] = useState<Boolean>(true);
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setImage(file); 
      setInputVisible(false)
    }
  };

  return (
    <div className="App">
      {!inputVisible && <button onClick={() => {setInputVisible(true); setImage(null)}} className="closeButton">Закрыть</button>}
      {inputVisible && <MyFileInput onChange={handleFileChange} accept=".png, .jpg, .jpeg, .gb7, image/png, image/jpeg"/>}
      {image && (<ImageRenderer image={image} />)}
    </div>
  );
}

export default App;
