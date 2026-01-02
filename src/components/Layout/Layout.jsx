import Navbar from '../Navbar/Navbar';
import News from '../News/News';
import './Layout.css';

function Layout({ children }) {
  return (
    <div className="layout">
      <Navbar />
      <News />
      <main className="layout-content">
        {children}
      </main>
    </div>
  );
}

export default Layout;

