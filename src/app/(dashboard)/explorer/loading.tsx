import BasicTopBar from '@/components/layouts/basic-top-bar';

export default function Loading() {
  return (
    <div className="w-full h-full">
      <BasicTopBar />
      <div className="flex items-center justify-center w-full h-[calc(100vh-48px)] bg-gray-100">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
          <p className="mt-4 text-lg text-gray-700">Loading map...</p>
        </div>
      </div>
    </div>
  );
} 