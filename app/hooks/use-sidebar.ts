import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type SidebarState = {
    isCollapsed: boolean;
    toggle: () => void;
};

export const useSidebar = create<SidebarState>()(
    persist(
        (set, get) => ({
            isCollapsed: false,
            toggle: () => set({ isCollapsed: !get().isCollapsed }),
        }),
        {
            name: 'sidebar-storage', // name of the item in the storage (must be unique)
        }
    )
);