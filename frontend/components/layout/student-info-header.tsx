"use client"

import { useAuth } from "@/hooks/use-auth"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { AddStudentDialog } from "@/components/students/add-student-dialog"
import { ProfileDialog } from "@/components/profile/profile-dialog"

export function StudentInfoHeader() {
  const { user } = useAuth()

  if (!user) return null

  return (
    <div className="bg-card p-3 border-b border-border/40 sticky top-0 z-50 shadow-sm">
      <div className="flex items-center justify-between gap-3 max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0 w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
            М
          </div>
          <h2 className="font-bold text-lg hidden sm:block truncate text-foreground">MIREA Tools</h2>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <AddStudentDialog>
            <Button size="sm" variant="default">
              <Plus className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Add Friend</span>
            </Button>
          </AddStudentDialog>
          <ProfileDialog />
        </div>
      </div>
    </div>
  )
}
