import { io } from "socket.io-client";

export const connectSocket = (accessToken) => {
  return io(`/`, {
    auth: { token: accessToken ? accessToken : null }, // send token with connection
    withCredentials: true,
  });
};