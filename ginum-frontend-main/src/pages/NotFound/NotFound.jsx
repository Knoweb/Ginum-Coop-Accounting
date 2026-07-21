import React from "react";
import usePageTitle from "../../hooks/usePageTitle";

function NotFound() {
  usePageTitle("404 - Page Not Found");
  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-r from-blue-500 to-grey-500">
      <div className="text-center text-slate-700">
        <h1 className="text-9xl font-bold">404</h1>
        <p className="text-2xl mt-4">
          Oops! The page you're looking for doesn't exist.
        </p>
        <p className="text-lg mt-2">
          It seems like you’ve found a glitch in the matrix.
        </p>
        <a
          href="/"
          className="mt-6 inline-block bg-white text-gray-800 px-6 py-3 rounded-full text-lg font-semibold hover:bg-gray-200 transition duration-300"
        >
          Go Back Ginum
        </a>
      </div>
    </div>
  );
}

export default NotFound;
