import { Outlet } from 'react-router-dom';
import './InventariosLayout.css';

export default function InventariosLayout() {
  return (
    <div className="module-layout" style={{ paddingTop: '20px' }}>
      <main className="module-content" style={{ height: '100%' }}>
        <Outlet />
      </main>
    </div>
  );
}
