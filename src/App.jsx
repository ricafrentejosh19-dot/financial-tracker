import './App.css'
import HomePage from './assets/HomePage.jsx';
import { Routes, Route } from 'react-router-dom'
import { HistoryPage } from './assets/HistoryPage.jsx';


function App() {

  return (
    <>
      <Routes>
        <Route path='/' element={<HomePage />} />

        <Route path='/history' element={<HistoryPage />} />
      </Routes>
    </>
  )
}

export default App
