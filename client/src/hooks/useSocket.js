import { useEffect } from 'react';
import { io } from 'socket.io-client';
import { useNotificationStore } from '../store/notifications';

export function useSocket(token) {
  useEffect(() => {
    if (!token) return;

    const socket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000', {
      auth: { token },
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    });

    socket.on('connect', () => console.log('Socket connected'));
    socket.on('connect_error', (err) => console.error('Socket error:', err.message));

    socket.on('new_listing', (data) => {
      // Depending on whether backend sends `data.listing` or just the `listing` object
      const listing = data.listing || data; 
      useNotificationStore.getState().add(listing);
    });

    socket.on('urgent_listing', (data) => {
      const listing = data.listing || data;
      useNotificationStore.getState().addUrgent(listing);
    });

    // Donor gets notified their food was claimed
    socket.on('listing_claimed', (data) => {
      useNotificationStore.getState().add({
        ...data,
        title: 'Your listing was claimed!',
        isUrgent: false,
      });
    });

    // Listing was unclaimed — update feed
    socket.on('listing_unclaimed', (data) => {
      useNotificationStore.getState().add({
        ...data,
        title: 'A listing is available again',
        isUrgent: false,
      });
    });

    // Background AI mapping completion payload
    socket.on('listing_updated', (data) => {
      useNotificationStore.getState().add({
        ...data,
        title: 'Safety Score Updated',
        isUrgent: false,
      });
    });

    // Volunteer gets notified of a nearby pickup request
    socket.on('pickup_request', (data) => {
      useNotificationStore.getState().addUrgent({
        ...data.listing,
        title: 'Pickup needed nearby!',
        isUrgent: true,
      });
    });

    socket.on('disconnect', () => console.log('Socket disconnected'));

    return () => socket.disconnect();
  }, [token]);
}
