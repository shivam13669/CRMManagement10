import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Date formatting utilities for Indian Standard Time (New Delhi)
export function formatDate(dateString: string): string {
  // Convert to IST and format as DD/MM/YYYY
  const date = new Date(dateString);
  const istDate = new Date(date.toLocaleString("en-US", {timeZone: "Asia/Kolkata"}));
  const day = istDate.getDate().toString().padStart(2, '0');
  const month = (istDate.getMonth() + 1).toString().padStart(2, '0');
  const year = istDate.getFullYear();
  return `${day}/${month}/${year}`;
}

export function formatTime(dateString: string): string {
  // Convert to IST time format (24-hour)
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'Asia/Kolkata'
  }).format(date);
}

export function formatDateTime(dateString: string): string {
  return `${formatDate(dateString)}, ${formatTime(dateString)}`;
}

// Function to get current IST timestamp for database storage
export function getCurrentISTTimestamp(): string {
  const now = new Date();
  const istTime = new Date(now.toLocaleString("en-US", {timeZone: "Asia/Kolkata"}));

  // Format as SQLite datetime: YYYY-MM-DD HH:MM:SS
  const year = istTime.getFullYear();
  const month = (istTime.getMonth() + 1).toString().padStart(2, '0');
  const day = istTime.getDate().toString().padStart(2, '0');
  const hours = istTime.getHours().toString().padStart(2, '0');
  const minutes = istTime.getMinutes().toString().padStart(2, '0');
  const seconds = istTime.getSeconds().toString().padStart(2, '0');

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}
