import { io } from "socket.io-client";

export const connectSocket = (accessToken) => {
  return io(`${process.env.REACT_APP_API_BASE_URL}`, {
    auth: { token: accessToken }, // send token with connection
    withCredentials: true,
  });
};