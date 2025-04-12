'use client'
import BasicTopBar from '@/components/layouts/basic-top-bar';
import Map from './components/map';

const ExplorerPage = () => {
    return (
        <div className="w-full h-full">
            <BasicTopBar />
            <Map />
        </div>
    );
};

export default ExplorerPage;