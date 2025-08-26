"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import {
  Home,
  Users,
  Building2,
  Calendar,
  CheckSquare,
  Mail,
  BarChart3,
  Settings,
  LogOut,
  ChevronDown,
  X
} from "lucide-react"

const navigation = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: Home,
  },
  {
    title: "Clientes",
    url: "/customers",
    icon: Users,
  },
  {
    title: "Empresas",
    url: "/companies",
    icon: Building2,
  },
  {
    title: "Funcionários",
    url: "/employees",
    icon: Users,
  },
  {
    title: "Agenda",
    url: "/calendar",
    icon: Calendar,
  },
  {
    title: "Tarefas",
    url: "/tasks",
    icon: CheckSquare,
  },
  {
    title: "Webmail",
    url: "/webmail",
    icon: Mail,
  },
  {
    title: "Relatórios",
    url: "/reports",
    icon: BarChart3,
  },
  {
    title: "Configurações",
    url: "/settings",
    icon: Settings,
  },
]

export function AppSidebar() {
  const pathname = usePathname()
  const { isMobile, state, setOpenMobile } = useSidebar()
  const [expandedGroups, setExpandedGroups] = useState<string[]>(['main'])

  const toggleGroup = (groupId: string) => {
    setExpandedGroups(prev => 
      prev.includes(groupId) 
        ? prev.filter(id => id !== groupId)
        : [...prev, groupId]
    )
  }

  const handleSignOut = () => {
    signOut({ callbackUrl: '/login' })
  }

  const SidebarContent = () => (
    <>
      <SidebarHeader className="border-b px-6 py-4">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">G</span>
          </div>
          <span className="font-semibold text-lg">GarapaSystem</span>
        </div>
      </SidebarHeader>

      <ScrollArea className="flex-1">
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Menu Principal</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {navigation.map((item) => {
                  const isActive = pathname === item.url
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild isActive={isActive}>
                        <Link href={item.url}>
                          <item.icon className="h-4 w-4" />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </ScrollArea>

      <SidebarFooter className="border-t p-4">
        <Button 
          variant="ghost" 
          className="w-full justify-start" 
          onClick={handleSignOut}
        >
          <LogOut className="h-4 w-4 mr-2" />
          Sair
        </Button>
      </SidebarFooter>
    </>
  )

  if (isMobile) {
    return (
      <Sheet open={state === "open"} onOpenChange={setOpenMobile}>
        <SheetContent side="left" className="p-0 w-64">
          <SheetHeader className="border-b px-6 py-4">
            <div className="flex items-center justify-between">
              <SheetTitle className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <span className="text-primary-foreground font-bold text-sm">G</span>
                </div>
                <span className="font-semibold text-lg">GarapaSystem</span>
              </SheetTitle>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setOpenMobile(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </SheetHeader>
          
          <div className="flex flex-col h-full">
            <ScrollArea className="flex-1">
              <div className="p-4">
                <nav className="space-y-2">
                  {navigation.map((item) => {
                    const isActive = pathname === item.url
                    return (
                      <Link
                        key={item.title}
                        href={item.url}
                        className={`flex items-center space-x-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                          isActive 
                            ? 'bg-primary text-primary-foreground' 
                            : 'text-gray-700 hover:bg-gray-100'
                        }`}
                        onClick={() => setOpenMobile(false)}
                      >
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    )
                  })}
                </nav>
              </div>
            </ScrollArea>
            
            <div className="border-t p-4">
              <Button 
                variant="ghost" 
                className="w-full justify-start" 
                onClick={handleSignOut}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sair
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    )
  }

  return (
    <Sidebar>
      <SidebarContent />
      <SidebarRail />
    </Sidebar>
  )
}