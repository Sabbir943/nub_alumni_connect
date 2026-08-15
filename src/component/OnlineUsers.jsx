'use client';

import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { FiUsers, FiWifiOff } from 'react-icons/fi';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';
const MAX_VISIBLE = 12;

const ROLE_STYLES = {
  Admin: 'bg-purple-100 text-purple-600 dark:bg-purple-900/40 dark:text-purple-400',
  Alumni: 'bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400',
  Student: 'bg-green-100 text-green-600 dark:bg-green-900/40 dark:text-green-400',
};

export default function OnlineUsers({ currentUserEmail, onUsersChange }) {
  const [users, setUsers] = useState([]);
  const [status, setStatus] = useState('connecting'); // 'connecting' | 'online' | 'offline'
  const socketRef = useRef(null);

  const others = users.filter((u) => u.email !== currentUserEmail);

  useEffect(() => {
    onUsersChange?.(others.length);
  }, [others.length, onUsersChange]);

  useEffect(() => {
    if (!currentUserEmail) return;

    const socket = io(SOCKET_URL, {
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      transports: ['websocket'],
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('join', currentUserEmail);
      setStatus('online');
    });

    socket.on('connect_error', () => {
      setStatus('offline');
    });

    socket.on('disconnect', () => {
      setStatus('connecting');
    });

    socket.on('online-users', (list) => {
      setUsers(Array.isArray(list) ? list : []);
    });

    socket.connect();

    return () => {
      socket.off('connect');
      socket.off('connect_error');
      socket.off('disconnect');
      socket.off('online-users');
      socket.disconnect();
      socketRef.current = null;
    };
  }, [currentUserEmail]);

  const visible = others.slice(0, MAX_VISIBLE);
  const extraCount = others.length - visible.length;

  if (status === 'offline') {
    return (
      <div className="flex items-center gap-3 px-5 py-4 bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-zinc-200/60 dark:border-zinc-800">
        <div className="w-9 h-9 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center shrink-0">
          <FiWifiOff className="w-4 h-4 text-zinc-400" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Live presence unavailable</p>
          <p className="text-xs text-zinc-400">Start the socket server (npm run socket-server) to see who&apos;s online.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-zinc-200/60 dark:border-zinc-800 overflow-hidden">
      <div className="flex items-center gap-2 px-5 pt-4 pb-3">
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-emerald-400 to-green-500 flex items-center justify-center shrink-0">
          <FiUsers className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-bold text-zinc-900 dark:text-white">Online Now</h3>
          <p className="text-[11px] text-zinc-400">
            {others.length > 0 ? `${others.length} member${others.length !== 1 ? 's' : ''} active right now` : 'No one is online right now'}
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-[11px] font-semibold">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          Live
        </span>
      </div>

      {status === 'connecting' ? (
        <div className="px-5 pb-5 flex gap-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="animate-pulse flex flex-col items-center gap-1.5 w-16">
              <div className="w-12 h-12 rounded-full bg-zinc-200 dark:bg-zinc-700" />
              <div className="h-2.5 bg-zinc-200 dark:bg-zinc-700 rounded w-12" />
            </div>
          ))}
        </div>
      ) : visible.length === 0 ? (
        <p className="px-5 pb-5 text-sm text-zinc-400">No one is online right now. Be the first to connect!</p>
      ) : (
        <div className="px-3 pb-4">
          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
            {visible.map((user) => (
              <div
                key={user.email}
                className="group flex flex-col items-center gap-1.5 px-1.5 py-2 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors cursor-pointer shrink-0 w-16"
                title={user.name}
              >
                <div className="relative">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-400 to-green-500 p-[2.5px] group-hover:from-blue-500 group-hover:to-purple-600 transition-all">
                    <div className="w-full h-full rounded-full bg-white dark:bg-zinc-900 p-[2.5px]">
                      {user.avatar ? (
                        <img src={user.avatar} alt="" className="w-full h-full rounded-full object-cover" />
                      ) : (
                        <div className="w-full h-full rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-sm font-bold">
                          {user.name?.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                  </div>
                  <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white dark:border-zinc-900" />
                </div>
                <p className="text-[10px] font-medium text-zinc-600 dark:text-zinc-400 truncate w-full text-center">
                  {user.name}
                </p>
                {user.role && (
                  <span className={`px-1.5 py-px rounded text-[8px] font-bold uppercase tracking-wide ${ROLE_STYLES[user.role] || ROLE_STYLES.Student}`}>
                    {user.role}
                  </span>
                )}
              </div>
            ))}

            {extraCount > 0 && (
              <div className="flex flex-col items-center justify-center gap-1 shrink-0 w-16">
                <div className="w-12 h-12 rounded-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center text-zinc-500 dark:text-zinc-400 text-sm font-bold">
                  +{extraCount}
                </div>
                <span className="text-[10px] text-zinc-400">more</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
