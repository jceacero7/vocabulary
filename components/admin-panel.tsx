"use client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Settings, Database, ArrowUpFromLine } from "lucide-react"
import DatabaseStatus from "./database-status"
import DataMigration from "./data-migration"

export default function AdminPanel() {
  return (
    <Card className="bg-white/90 backdrop-blur">
      <CardHeader>
        <CardTitle className="text-xl text-center text-purple-700 flex items-center justify-center">
          <Settings className="h-5 w-5 mr-2" />
          Panel de Administración
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="status">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="status" className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              Estado
            </TabsTrigger>
            <TabsTrigger value="migration" className="flex items-center gap-2">
              <ArrowUpFromLine className="h-4 w-4" />
              Migración
            </TabsTrigger>
          </TabsList>
          <TabsContent value="status">
            <DatabaseStatus />
          </TabsContent>
          <TabsContent value="migration">
            <DataMigration />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
