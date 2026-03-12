import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';



const MainLayout = () => {
    return (
        <div className="light-layout">
            <Sidebar />
            <main className="light-main">
                <div className="light-content">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default MainLayout;
