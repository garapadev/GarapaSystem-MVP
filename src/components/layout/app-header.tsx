"use client"

import { Button } from "@/components/ui/button"
import { Menu } from "lucide-react"
import { useSidebar } from "@/components/ui/sidebar"

export function AppHeader() {
  const { toggleSidebar } = useSidebar()

  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={toggleSidebar}
        >
          <Menu className="h-5 w-5" />
        </Button>
        
        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          <div className="w-full flex-1 md:w-auto md:flex-none">
            {/* Aqui pode adicionar breadcrumbs ou título da página */}
          </div>
          
          <nav className="flex items-center space-x-2">
            {/* Aqui pode adicionar notificações, perfil do usuário, etc */}
          </nav>
        </div>
      </div>
    </header>
  )
}