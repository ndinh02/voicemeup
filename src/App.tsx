import { BrowserRouter, Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing";
import Create from "./pages/Create";
import Share from "./pages/Share";
import View from "./pages/View";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/create" element={<Create />} />
        <Route path="/share" element={<Share />} />
        <Route path="/t" element={<View />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
