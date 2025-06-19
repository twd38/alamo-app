'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { PermissionGate } from '@/components/rbac/permission-gate'
import { PERMISSIONS } from '@/lib/rbac'
import { Users, Shield, Settings, CreditCard } from 'lucide-react'
import { UsersTab } from '@/components/admin/users-tab'
import { BadgesTab } from '@/components/admin/badges-tab'
import TopBar from '@/components/layouts/basic-top-bar'
import PageContainer from '@/components/page-container'

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState('users')

  return (
    <PermissionGate 
      permission={PERMISSIONS.SYSTEM.ADMIN}
      fallback={
        <div className="flex items-center justify-center h-full">
          <Card className="w-96">
            <CardHeader>
              <CardTitle>Access Denied</CardTitle>
              <CardDescription>
                You don't have permission to access the admin panel.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      }
    >
      <div className="flex flex-col">
        {/* Admin Top Bar - Using same structure as BoardsTopBar */}
        <TopBar />
        
        <PageContainer>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="">
              {/* <TabsTrigger value="general" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                General
              </TabsTrigger> */}
              <TabsTrigger value="users" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Users
              </TabsTrigger>
              <TabsTrigger value="badges" className="flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Badges
              </TabsTrigger>
              <TabsTrigger value="permissions" className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Roles & Permissions
              </TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>General Settings</CardTitle>
                  <CardDescription>
                    System-wide configuration options.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">Coming soon...</p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="users" className="space-y-4">
              <UsersTab />
            </TabsContent>

            <TabsContent value="badges" className="space-y-4">
              <BadgesTab />
            </TabsContent>

            <TabsContent value="permissions" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Roles & Permissions</CardTitle>
                  <CardDescription>
                    Manage user roles and permission assignments.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">Coming soon...</p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </PageContainer>
      </div>
    </PermissionGate>
  )
} 