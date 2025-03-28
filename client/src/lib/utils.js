import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function shortenAddress(address, chars = 4) {
  if (!address) return '';
  return `${address.substring(0, chars + 2)}...${address.substring(address.length - chars)}`;
}

export function formatDate(date) {
  const d = new Date(date);
  return d.toLocaleDateString();
}

export const calculateTimeAgo = (timestamp) => {
  const date = typeof timestamp === 'number' 
    ? new Date(timestamp * 1000) 
    : new Date(timestamp);
  
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  
  let interval = seconds / 31536000;
  if (interval > 1) {
    return Math.floor(interval) + ' years ago';
  }
  
  interval = seconds / 2592000;
  if (interval > 1) {
    return Math.floor(interval) + ' months ago';
  }
  
  interval = seconds / 86400;
  if (interval > 1) {
    return Math.floor(interval) + ' days ago';
  }
  
  interval = seconds / 3600;
  if (interval > 1) {
    return Math.floor(interval) + ' hours ago';
  }
  
  interval = seconds / 60;
  if (interval > 1) {
    return Math.floor(interval) + ' minutes ago';
  }
  
  return Math.floor(seconds) + ' seconds ago';
};

export async function encryptData(data, publicKey) {
  // In a real implementation, this would use a library like eth-crypto or lit-protocol
  // This is a placeholder that simulates encryption
  console.log(`Encrypting data with public key: ${publicKey}`);
  
  // For demo purposes, we'll base64 encode the data
  if (typeof data === 'string') {
    return btoa(data);
  } else {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result?.toString().split(',')[1] || '';
        resolve(base64);
      };
      reader.readAsDataURL(data);
    });
  }
}

export async function decryptData(encryptedData, privateKey) {
  // In a real implementation, this would use a library like eth-crypto or lit-protocol
  // This is a placeholder that simulates decryption
  console.log(`Decrypting data with private key: ${privateKey}`);
  
  // For demo purposes, we'll base64 decode the data
  return atob(encryptedData);
}