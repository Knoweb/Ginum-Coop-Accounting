import { useEffect } from "react";

// usePageTitle custom hook to dynamically update the browser tab title
const usePageTitle = (title) => {
  // useEffect hook to update the document title whenever the `title` prop changes
  useEffect(() => {
    // Set the document title to the provided title with a suffix " | Ginum"
    // If no title is provided, set the document title to the default "Ginum"
    document.title = title ? `${title} | Ginum` : "Ginum";
  }, [title]); // Dependency array ensures this effect runs only when `title` changes
};

export default usePageTitle;
