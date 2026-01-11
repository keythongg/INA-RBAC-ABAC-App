import React from "react";
import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ children, checkRole }) => {
    const token = localStorage.getItem("token");

    if (!token) {
        return <Navigate to="/login" replace />;
    }

    if (checkRole) {
        try {
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(atob(base64).split('').map(function (c) {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(''));

            const decoded = JSON.parse(jsonPayload);
            const userRole = decoded.role;

            if (checkRole !== userRole && userRole !== 'admin') {
                return <Navigate to="/dashboard" replace />;
            }
        } catch (error) {
            console.error("Token decode error:", error);
            return <Navigate to="/login" replace />;
        }
    }

    return children;
};

export default ProtectedRoute;
