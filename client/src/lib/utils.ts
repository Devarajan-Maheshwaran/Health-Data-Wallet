import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function shortenAddress(address: string | null | undefined, chars = 4): string {
  if (!address) return '';
  return `${address.substring(0, chars + 2)}...${address.substring(address.length - chars)}`;
}

export function formatDate(date: Date | string | number): string {
  const d = new Date(date);
  return d.toLocaleDateString();
}

export const calculateTimeAgo = (timestamp: number | string | Date): string => {
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

export async function encryptData(data: string | Blob, publicKey: string): Promise<string> {
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

export async function decryptData(encryptedData: string, privateKey: string): Promise<string> {
  // In a real implementation, this would use a library like eth-crypto or lit-protocol
  // This is a placeholder that simulates decryption
  console.log(`Decrypting data with private key: ${privateKey}`);
  
  // For demo purposes, we'll base64 decode the data
  return atob(encryptedData);
}
