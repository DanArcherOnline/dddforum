import { Route, Routes } from "react-router-dom";
import { MainPage } from "./pages/mainPage";
import { RegisterPage } from "./pages/RegisterPage";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<MainPage />} />
      <Route path="/join" element={<RegisterPage />} />
    </Routes>
  );
}
