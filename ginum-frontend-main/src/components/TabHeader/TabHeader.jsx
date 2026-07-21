import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import routeTitles from "../../config/routeTitles"; // Import route patterns

// TabHeader component to dynamically update the browser tab title based on the current route
const TabHeader = () => {
  // useLocation hook from react-router-dom to get the current location (pathname)
  const location = useLocation();

  // useEffect hook to update the document title whenever the pathname changes
  useEffect(() => {
    // Default title if no matching route is found
    let title = "Ginum";

    // Find the matching route title based on the current pathname
    // routeTitles is an array of objects containing `pattern` (regex) and `title` (string)
    const matchedRoute = routeTitles.find(({ pattern }) =>
      pattern.test(location.pathname)
    );

    // If a matching route is found, update the title
    if (matchedRoute) {
      title = matchedRoute.title;
    }

    // Set the document title to the matched or default title
    document.title = title;
  }, [location.pathname]); // Dependency array ensures this effect runs only when pathname changes

  // This component doesn't render anything to the DOM
  return null;
};

export default TabHeader;
