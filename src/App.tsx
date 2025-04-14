import React, { useState } from 'react';
import ImageRenderer from './components/ImageRenderer';
import './App.css'

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
      <input type="file" onChange={handleFileChange} accept=".png, .jpg, .jpeg, .gb7, image/png, image/jpeg"/>
      {image && (<ImageRenderer image={image} />)}

    </div>
  );
}

export default App;
