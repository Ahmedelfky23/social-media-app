import { createBrowserRouter, RouterProvider } from "react-router-dom";
import "./App.css";
import Layout from "./Layout/Layout";
import Home from "./Pages/home/Home";
import Welcome from "./Pages/Welcome/Welcome";
import Profile from "./Pages/profile/Profile";
import Login from "./Pages/Login/Login";
import Signup from "./Pages/SignUp/SignUp";
import Notfound from "./Pages/NotFound/NotFound";
import { Toaster } from "#components/ui/toast";
import { ThemeProvider } from "./context/ThemeContext";
import { AuthProvider } from "./context/AuthContext";
import { Bookmarks } from "./Pages/Bookmarks/Bookmarks";
import PostDetails from "./Pages/PostDetails/PostDetails";
import { Setting } from "./Pages/settings/Setting";
import Chats from "./Pages/chats/Chats";
import { AuthProtectedroute, Protectedroute } from "#components/ProtectedRoute/ProtectedRoute";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import OfflineBanner from "#components/OfflineBanner/OfflineBanner";



const queryClient = new QueryClient();
const Routers = createBrowserRouter([
  {
    path: "/",
    element: (
      <AuthProtectedroute>
        <Welcome />
      </AuthProtectedroute>
    ),
  },
  {
    path: "welcome",
    element: (
      <AuthProtectedroute>
        <Welcome />
      </AuthProtectedroute>
    ),
  },
  {
    path: "",
    element: <Layout />,
    children: [
      { path: "home", element: <Protectedroute><Home /></Protectedroute> },
      { path: "profile", element: <Protectedroute><Profile /></Protectedroute> },
      { path: "profile/:userId", element: <Protectedroute><Profile /></Protectedroute> },
      { path: "bookmarks", element: <Protectedroute><Bookmarks /></Protectedroute> },
      {
        path: "post/:_id",
        element: <Protectedroute><PostDetails /></Protectedroute>,
      },
      { path: "settings", element: <Protectedroute><Setting /></Protectedroute> },
      { path: "chats", element: <Protectedroute><Chats /></Protectedroute> },
      { path: "*", element: <Notfound /> },
    ],
  },
  { path: "login", element: <AuthProtectedroute><Login /></AuthProtectedroute> },
  { path: "signup", element: <AuthProtectedroute><Signup /></AuthProtectedroute> },
]);



function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ThemeProvider>
          <Toaster>
            <OfflineBanner />
            <RouterProvider router={Routers} />
          </Toaster>
        </ThemeProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
