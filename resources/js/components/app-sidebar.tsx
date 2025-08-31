import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { type NavItem } from '@/types';
import { Link } from '@inertiajs/react';
import { EggOutlined, GridViewOutlined, LocalShippingOutlined, MenuBookOutlined, RestaurantOutlined, WarehouseOutlined } from '@mui/icons-material';
import AppLogo from './app-logo';

const mainNavItems: NavItem[] = [
    { title: 'Dashboard', href: '/dashboard', icon: GridViewOutlined, color: 'primary' },
    { title: 'Ingredients', href: '/ingredients', icon: EggOutlined, color: 'primary' },
    { title: 'Recipes', href: '/recipes', icon: RestaurantOutlined, color: 'primary' },
    { title: 'Menus', href: '/menus', icon: MenuBookOutlined, color: 'primary' },
    { title: 'Suppliers', href: '/suppliers', icon: LocalShippingOutlined, color: 'primary' },
    { title: 'Stocktake', href: '/stocktake', icon: WarehouseOutlined, color: 'primary' },
];

// Remove “Repository” and “Documentation” links from the footer by keeping this empty.
const footerNavItems: NavItem[] = [];

export function AppSidebar() {
    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={'/dashboard'} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={mainNavItems} />
            </SidebarContent>

            <SidebarFooter>
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
