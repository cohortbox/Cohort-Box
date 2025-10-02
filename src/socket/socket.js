import { io } from "socket.io-client";

export const connectSocket = (accessToken) => {
  return io(`/`, {
    auth: { token: accessToken }, // send token with connection
    withCredentials: true,
  });
};