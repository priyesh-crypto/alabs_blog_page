"use client";
import { createContext, useContext } from "react";
export const StudioContext = createContext(null);
export const useStudioContext = () => useContext(StudioContext);
