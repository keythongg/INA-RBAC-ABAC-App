// src/contexts/SocketContext.js
import React, { createContext, useState, useEffect, useContext, useRef } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext(null);

export const useSocket = () => {
    const context = useContext(SocketContext);
    if (!context) {
        throw new Error('useSocket must be used within a SocketProvider');
    }
    return context;
};

export const SocketProvider = ({ children }) => {
    const [isConnected, setIsConnected] = useState(false);
    const socketRef = useRef(null);

    useEffect(() => {
        console.log('🔄 SocketProvider - Initializing WebSocket...');

        const socket = io('http://localhost:5000', {
            reconnectionAttempts: 5,
            timeout: 10000,
            transports: ['websocket', 'polling']
        });

        socketRef.current = socket;

        socket.on('connect', () => {
            console.log('✅ WebSocket connected:', socket.id);
            setIsConnected(true);

            // Auto-join based on stored user data
            const userData = JSON.parse(localStorage.getItem('userData') || '{}');
            if (userData.id && userData.role) {
                console.log(`🔗 Auto-joining rooms: user_${userData.id}, role_${userData.role}`);
                socket.emit("join_user_rooms", userData.id, userData.role);
            }
        });

        socket.on('disconnect', (reason) => {
            console.log('❌ WebSocket disconnected:', reason);
            setIsConnected(false);
        });

        socket.on('connect_error', (error) => {
            console.error('❌ WebSocket connection error:', error);
        });

        // Cleanup
        return () => {
            console.log('🔌 SocketProvider - Cleaning up WebSocket');
            if (socket) {
                socket.disconnect();
            }
        };
    }, []);

    // Funkcija za join soba
    const joinRooms = (userId, userRole) => {
        if (socketRef.current?.connected) {
            console.log(`🔗 Joining rooms for user ${userId}, role ${userRole}`);
            socketRef.current.emit("join_user_rooms", userId, userRole);
        } else {
            console.log('⚠️ Cannot join rooms - socket not connected');
        }
    };

    // Funkcija za emit eventa
    const emit = (event, data) => {
        if (socketRef.current?.connected) {
            console.log(`📤 Emitting ${event}:`, data);
            socketRef.current.emit(event, data);
        } else {
            console.log(`⚠️ Cannot emit ${event} - socket not connected`);
        }
    };

    // Funkcija za dodavanje event listenera
    const on = (event, callback) => {
        if (socketRef.current) {
            console.log(`👂 Adding listener for ${event}`);
            socketRef.current.on(event, callback);
        } else {
            console.log(`⚠️ Cannot add listener for ${event} - socket not available`);
        }
    };

    // Funkcija za uklanjanje event listenera
    const off = (event, callback) => {
        if (socketRef.current) {
            console.log(`🗑️ Removing listener for ${event}`);
            socketRef.current.off(event, callback);
        }
    };

    // Funkcija za jednokratni listener
    const once = (event, callback) => {
        if (socketRef.current) {
            socketRef.current.once(event, callback);
        }
    };

    const value = {
        socket: socketRef.current,
        isConnected,
        joinRooms,
        emit,
        on,          // DODANO
        off,         // DODANO
        once         // DODANO
    };

    return (
        <SocketContext.Provider value={value}>
            {children}
        </SocketContext.Provider>
    );
};