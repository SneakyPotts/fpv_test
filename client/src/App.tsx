import React, {useState} from 'react';
import Map from './components/Map'

const App: React.FC = () => {
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [inputKey, setInputKey] = useState<string>('');

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setInputKey(event.target.value);
  };

  const handleFormSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (inputKey.trim() !== '') {
      setApiKey(inputKey.trim());
    }
  };

  if (!apiKey) {
    return (
      <div>
        <h1>Введіть API ключ для авторизації</h1>
        <form style={{display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 10, padding: 20}} onSubmit={handleFormSubmit}>
          <input
            type="text"
            value={inputKey}
            onChange={handleInputChange}
            placeholder="API ключ"
          />
          <button type="submit">Підтвердити</button>
          <sub>валідні ключі key1, key2, key3</sub>
        </form>
      </div>
    );
  }

  return (
    <div style={{width: '100vw', height: '100vh'}}>
      <Map apiKey={apiKey} />
    </div>
  );
};

export default App
