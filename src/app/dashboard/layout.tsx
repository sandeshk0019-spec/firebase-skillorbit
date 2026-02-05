"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from 'next/navigation'
import {
  BrainCircuit,
  Home,
  Webhook,
  PanelLeft,
  Cpu,
  Settings,
} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
  SidebarFooter,
} from "@/components/ui/sidebar"
import { Logo } from "@/components/logo"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

function AppSidebar() {
  const pathname = usePathname()

  const isActive = (path: string) => {
    return pathname === path
  }

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-2">
          <Logo />
          <span className="text-xl font-semibold font-headline">SkillOrbit</span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          <SidebarMenuItem>
            <Link href="/dashboard" legacyBehavior passHref>
              <SidebarMenuButton isActive={isActive('/dashboard')} tooltip="Dashboard">
                <Home />
                <span>Dashboard</span>
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <Link href="/dashboard/quiz" legacyBehavior passHref>
              <SidebarMenuButton isActive={isActive('/dashboard/quiz')} tooltip="AI Quiz Generator">
                <Cpu />
                <span>AI Quiz</span>
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <Link href="/dashboard/tutor" legacyBehavior passHref>
              <SidebarMenuButton isActive={isActive('/dashboard/tutor')} tooltip="AI Tutor">
                <BrainCircuit />
                <span>AI Tutor</span>
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <Link href="/dashboard/dyslexia-support" legacyBehavior passHref>
              <SidebarMenuButton isActive={isActive('/dashboard/dyslexia-support')} tooltip="Dyslexia Support">
                <Webhook />
                <span>Speech Tools</span>
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter>
        <div className="flex items-center gap-2">
            <Avatar className="h-9 w-9 border-2 border-primary/50 animate-glow">
              <AvatarImage src="https://picsum.photos/seed/avatar/40/40" alt="@student" data-ai-hint="person face" />
              <AvatarFallback>S</AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="text-sm font-medium">Student</span>
              <span className="text-xs text-sidebar-foreground/70">student@email.com</span>
            </div>
          </div>
      </SidebarFooter>
    </Sidebar>
  )
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen">
        <AppSidebar />
        <SidebarInset className="flex-1 flex flex-col">
           <header className="flex h-14 items-center gap-4 border-b border-border/50 bg-background/80 backdrop-blur-sm px-6 sticky top-0 z-30">
            <SidebarTrigger className="md:hidden"/>
            <div className="flex-1">
              <h1 className="text-lg font-semibold md:text-xl font-headline">
                {/* Title could be dynamic based on page */}
              </h1>
            </div>
            <Button variant="ghost" size="icon">
              <Settings className="h-5 w-5" />
              <span className="sr-only">Settings</span>
            </Button>
          </header>
          <main className="flex-1 p-4 md:p-6 lg:p-8">
            {children}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}
